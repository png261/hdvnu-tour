<script lang="ts">
	import { writable, derived, get } from 'svelte/store';
	import JSZip from 'jszip';

	import * as Tabs from '$lib/components/ui/tabs/index';
	import * as Card from '$lib/components/ui/card/index';
	import { Button } from '$lib/components/ui/button/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import { Badge } from '$lib/components/ui/badge/index';
	import { Switch } from '$lib/components/ui/switch/index';
	import { Skeleton } from '$lib/components/ui/skeleton/index';
	import { hotSpotInfo, hotSpotsList, pannellumSetup } from '$lib/storedInfo';
	import { Textarea } from '$lib/components/ui/textarea/index';
	import { onMount } from 'svelte';
	import { copyText } from 'svelte-copy';
	import { twi } from 'tw-to-css';
	import { FileCode, FileJson, TriangleAlert, FolderArchive } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog/index';

	const tags = Array.from({ length: 50 }).map((_, i, a) => `v1.2.0-beta.${a.length - i}`);

	let cssFile: string = '';

	let keepTailwind = true;
	let exportingZip = false;

	function removeHotSpot(index: number) {
		hotSpotInfo.update((currentHotSpots) => {
			return currentHotSpots.filter((item, i) => i !== index);
		});
	}

	const jsonConfigWithTailwind = derived(pannellumSetup, ($pannellumSetup) => {
		const pannellumCopy = JSON.parse(JSON.stringify($pannellumSetup));

		for (const sceneId in pannellumCopy.scenes) {
			if (pannellumCopy.scenes.hasOwnProperty(sceneId)) {
				const scene = pannellumCopy.scenes[sceneId];

				for (const hotspot of scene.hotSpots) {
					delete hotspot.div;
				}
			}
		}

		// Return the modified pannellumCopy object as a JSON string
		return JSON.stringify(pannellumCopy, null, '\t');
	});

	const jsonConfigWithoutTailwind = derived(pannellumSetup, ($pannellumSetup) => {
		const pannellumCopy = JSON.parse(JSON.stringify($pannellumSetup));
		cssFile = '';

		for (const sceneId in pannellumCopy.scenes) {
			if (pannellumCopy.scenes.hasOwnProperty(sceneId)) {
				const scene = pannellumCopy.scenes[sceneId];

				for (const hotspot of scene.hotSpots) {
					delete hotspot.div;
					if (hotspot.cssClass) {
						const formattedCssClass = twi(hotspot.cssClass)
							.split(';')
							.filter((rule) => rule.trim() !== '') // Remove any empty rules
							.map((rule) => `\t${rule.trim()};`)
							.join('\n');
						// Construct CSS file content
						cssFile += `.${sceneId}-${hotspot.id} {\n${formattedCssClass}\n}\n`;
						hotspot.cssClass = `${sceneId}-${hotspot.id}`;
					}
				}
			}
		}

		// Return the modified pannellumCopy object as a JSON string
		return JSON.stringify(pannellumCopy, null, '\t');
	});

	function downloadFile(content: string | Blob, filename: string, type: string) {
		const blob = content instanceof Blob ? content : new Blob([content], { type });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		setTimeout(() => {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		}, 0);
	}

	function downloadJsonConfig() {
		if (keepTailwind) {
			downloadFile($jsonConfigWithTailwind, 'pannellum.config.json', 'application/json');
		} else {
			downloadFile($jsonConfigWithoutTailwind, 'pannellum.config.json', 'application/json');
		}
	}

	function downloadCssFile() {
		downloadFile(cssFile, 'pannellum-hotspots.css', 'text/css');
	}

	function copyJsonConfig() {
		if (keepTailwind) {
			copyText($jsonConfigWithTailwind).then(() => {
				toast.info('JSON configuration copied to clipboard');
			});
		} else {
			copyText($jsonConfigWithoutTailwind).then(() => {
				toast.info('JSON configuration copied to clipboard');
			});
		}
	}

	function copyCssFile() {
		copyText(cssFile).then(() => {
			toast.info('CSS file copied to clipboard');
		});
	}

	function blobToBase64(blob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	}

	async function exportToZip() {
		exportingZip = true;
		const toastId = toast.loading('Generating ZIP file...');

		try {
			const zip = new JSZip();

			// Parse the configuration
			const pannellumCopy = JSON.parse(JSON.stringify(get(pannellumSetup)));

			// Create assets folder
			const assetsFolder = zip.folder('assets');
			if (!assetsFolder) throw new Error('Failed to create assets folder in ZIP');

			// Store base64 data for offline fallback
			const base64Assets: Record<string, string> = {};

			// Loop through all scenes to fetch images and package them
			for (const sceneId in pannellumCopy.scenes) {
				if (pannellumCopy.scenes.hasOwnProperty(sceneId)) {
					const scene = pannellumCopy.scenes[sceneId];
					const panoramaUrl = scene.panorama;

					if (!panoramaUrl) continue;

					let fileData: ArrayBuffer | Blob;
					let fileExtension = 'jpg'; // default fallback

					try {
						// Fetch the panorama image data (works for blob: URLs and CORS-enabled HTTP URLs)
						const response = await fetch(panoramaUrl);
						if (!response.ok) throw new Error(`HTTP status ${response.status}`);
						
						const imageBlob = await response.blob();
						fileData = await imageBlob.arrayBuffer();

						// Get base64 string for offline fallback
						const base64Data = await blobToBase64(imageBlob);
						base64Assets[sceneId] = base64Data;

						// Try to get actual extension from content-type header or URL
						const contentType = response.headers.get('content-type');
						if (contentType) {
							if (contentType.includes('png')) fileExtension = 'png';
							else if (contentType.includes('webp')) fileExtension = 'webp';
							else if (contentType.includes('jpeg') || contentType.includes('jpg')) fileExtension = 'jpg';
						} else {
							// Try to get from URL
							const match = panoramaUrl.match(/\.(png|webp|jpe?g|gif)($|\?)/i);
							if (match) {
								fileExtension = match[1].toLowerCase();
								if (fileExtension === 'jpeg') fileExtension = 'jpg';
							}
						}
					} catch (err) {
						console.error(`Failed to fetch panorama for scene ${sceneId}:`, err);
						// For remote URLs that fail due to CORS, we can keep the remote URL as-is
						// and skip bundling it. But if it's a local blob, fetch should always work.
						if (panoramaUrl.startsWith('blob:')) {
							throw new Error(`Failed to bundle local image for scene "${scene.title || sceneId}"`);
						}
						continue; // Keep external URL and don't bundle
					}

					// Write the file to assets folder
					const assetFileName = `${sceneId}.${fileExtension}`;
					assetsFolder.file(assetFileName, fileData);

					// Update the configuration panorama path to be relative to index.html
					scene.panorama = `./assets/${assetFileName}`;

					// Clean up any references in hotspots
					for (const hotspot of scene.hotSpots) {
						delete hotspot.div;
					}
				}
			}

			let base64Audio = '';
			let audioFileName = '';

			// Handle background audio
			if (pannellumCopy.backgroundSound) {
				try {
					const audioUrl = pannellumCopy.backgroundSound;
					const response = await fetch(audioUrl);
					if (response.ok) {
						const audioBlob = await response.blob();
						const audioData = await audioBlob.arrayBuffer();

						// Get base64 string for offline fallback
						base64Audio = await blobToBase64(audioBlob);

						// Determine file extension
						let audioExtension = 'mp3';
						const audioMime = audioBlob.type;
						if (audioMime) {
							if (audioMime.includes('wav')) audioExtension = 'wav';
							else if (audioMime.includes('ogg')) audioExtension = 'ogg';
							else if (audioMime.includes('webm')) audioExtension = 'webm';
							else if (audioMime.includes('mpeg') || audioMime.includes('mp3')) audioExtension = 'mp3';
						} else {
							// Try to get from URL
							const match = audioUrl.match(/\.(mp3|wav|ogg|webm)($|\?)/i);
							if (match) audioExtension = match[1].toLowerCase();
						}

						audioFileName = `background-audio.${audioExtension}`;

						// Write the file to assets folder inside the ZIP
						assetsFolder.file(audioFileName, audioData);

						// Update the configuration backgroundSound path to be relative to index.html
						pannellumCopy.backgroundSound = `./assets/${audioFileName}`;
					}
				} catch (err) {
					console.error('Failed to bundle background audio:', err);
					// For remote URLs that fail due to CORS, keep remote URL intact and don't bundle
				}
			}

			let base64Logo = '';
			const base64Thumbnails = {};
			
			// Create a thumbnails folder inside assets if we have custom thumbnails
			let thumbnailsFolder = null;

			// Handle Logo Image
			if (pannellumCopy.logoImage) {
				try {
					const logoUrl = pannellumCopy.logoImage;
					const response = await fetch(logoUrl);
					if (response.ok) {
						const logoBlob = await response.blob();
						const logoData = await logoBlob.arrayBuffer();

						// Get base64 string for offline fallback
						base64Logo = await blobToBase64(logoBlob);

						// Determine file extension
						let logoExtension = 'png'; // default fallback
						const logoMime = logoBlob.type;
						if (logoMime) {
							if (logoMime.includes('png')) logoExtension = 'png';
							else if (logoMime.includes('webp')) logoExtension = 'webp';
							else if (logoMime.includes('jpeg') || logoMime.includes('jpg')) logoExtension = 'jpg';
							else if (logoMime.includes('gif')) logoExtension = 'gif';
							else if (logoMime.includes('svg')) logoExtension = 'svg';
						} else {
							const match = logoUrl.match(/\.(png|webp|jpe?g|gif|svg)($|\?)/i);
							if (match) logoExtension = match[1].toLowerCase();
						}

						const logoFileName = `logo.${logoExtension}`;

						// Write file to assets folder inside ZIP
						assetsFolder.file(logoFileName, logoData);

						// Update configuration path to relative path
						pannellumCopy.logoImage = `./assets/${logoFileName}`;
					}
				} catch (err) {
					console.error('Failed to bundle logo image:', err);
				}
			}

			// Handle Scene Thumbnails
			for (const sceneId in pannellumCopy.scenes) {
				if (pannellumCopy.scenes.hasOwnProperty(sceneId)) {
					const scene = pannellumCopy.scenes[sceneId];
					const thumbUrl = scene.thumbnail;

					if (!thumbUrl) continue;

					try {
						const response = await fetch(thumbUrl);
						if (response.ok) {
							const thumbBlob = await response.blob();
							const thumbData = await thumbBlob.arrayBuffer();

							// Get base64 string for offline fallback
							const base64Data = await blobToBase64(thumbBlob);
							base64Thumbnails[sceneId] = base64Data;

							// Determine file extension
							let thumbExtension = 'jpg'; // default fallback
							const thumbMime = thumbBlob.type;
							if (thumbMime) {
								if (thumbMime.includes('png')) thumbExtension = 'png';
								else if (thumbMime.includes('webp')) thumbExtension = 'webp';
								else if (thumbMime.includes('jpeg') || thumbMime.includes('jpg')) thumbExtension = 'jpg';
							} else {
								const match = thumbUrl.match(/\.(png|webp|jpe?g)($|\?)/i);
								if (match) thumbExtension = match[1].toLowerCase();
							}

							if (!thumbnailsFolder) {
								thumbnailsFolder = assetsFolder.folder('thumbnails');
							}
							
							const thumbFileName = `${sceneId}-thumb.${thumbExtension}`;
							thumbnailsFolder.file(thumbFileName, thumbData);

							// Update configuration path to relative path
							scene.thumbnail = `./assets/thumbnails/${thumbFileName}`;
						}
					} catch (err) {
						console.error(`Failed to bundle thumbnail for scene ${sceneId}:`, err);
						if (thumbUrl.startsWith('blob:')) {
							throw new Error(`Failed to bundle local thumbnail for scene "${scene.title || sceneId}"`);
						}
					}
				}
			}

			// Add .nojekyll file
			zip.file('.nojekyll', '# Disable Jekyll processing\n');

			// Generate the configuration JSON string
			const configJson = JSON.stringify(pannellumCopy, null, '\t');

			// Create the index.html content
			const indexHtmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>360 Panorama Tour</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"/>
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"><\/script>
    <style>
        html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #000;
        }
        #tour-container {
            width: 100%;
            height: 100%;
            position: relative;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            user-select: none;
            -webkit-user-select: none;
        }
        #panorama-container {
            width: 100%;
            height: 100%;
        }
        /* Glassmorphism bottom control bar */
        .control-bar {
            position: absolute;
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 800px;
            z-index: 1000;
            background: rgba(18, 18, 18, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 12px;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            gap: 12px;
            transition: all 0.3s ease;
            box-sizing: border-box;
        }
        .control-bar.hidden {
            display: none !important;
        }
        /* Scene thumbnails list */
        .thumbnails-container {
            display: block;
            transition: all 0.3s ease;
            max-height: 120px;
            overflow: hidden;
        }
        .thumbnails-container.collapsed {
            max-height: 0;
            margin: 0;
            padding: 0;
            opacity: 0;
        }
        .thumbnails-list {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding-bottom: 6px;
        }
        /* Hide default scrollbars and style custom scrollbars */
        .thumbnails-list::-webkit-scrollbar {
            height: 4px;
        }
        .thumbnails-list::-webkit-scrollbar-track {
            background: transparent;
        }
        .thumbnails-list::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
        }
        .thumbnails-list::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.4);
        }
        /* Thumbnail items */
        .thumb-btn {
            background: transparent;
            border: 2px solid transparent;
            border-radius: 8px;
            padding: 4px;
            min-width: 110px;
            max-width: 110px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: rgba(255, 255, 255, 0.7);
            outline: none;
            box-sizing: border-box;
        }
        .thumb-btn:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
        }
        .thumb-btn.active {
            border-color: #007aff;
            background: rgba(0, 122, 255, 0.15);
            color: #fff;
        }
        .thumb-img {
            width: 100%;
            height: 52px;
            border-radius: 6px;
            object-fit: cover;
            background-color: #2c2c2c;
        }
        .thumb-title {
            font-size: 10px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            text-align: center;
        }
        /* Controls row */
        .controls-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }
        .scene-title {
            font-size: 13px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.9);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .control-buttons {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }
        .control-btn {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.75);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            outline: none;
            padding: 0;
        }
        .control-btn:hover {
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
            transform: scale(1.05);
        }
        .control-btn.hidden {
            display: none !important;
        }
        /* Pulse animation for active sound icon */
        .pulse-icon {
            color: #007aff;
            animation: audioPulse 1.5s infinite alternate;
        }
        @keyframes audioPulse {
            0% { opacity: 0.6; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1.05); }
        }
        /* Modal dialog styles */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            transition: opacity 0.3s ease;
        }
        .modal-overlay.hidden {
            opacity: 0;
            pointer-events: none;
            display: none !important;
        }
        .modal-card {
            background: #1e1e1e;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 28px;
            max-width: 360px;
            width: 85%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
            transform: scale(1);
            transition: transform 0.3s ease;
            box-sizing: border-box;
        }
        .modal-card h3 {
            margin: 0 0 10px 0;
            color: #fff;
            font-size: 18px;
            font-weight: 600;
        }
        .modal-card p {
            margin: 0 0 24px 0;
            color: rgba(255, 255, 255, 0.7);
            font-size: 13.5px;
            line-height: 1.5;
        }
        .modal-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
        }
        .modal-btn {
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
            outline: none;
            flex: 1;
        }
        .btn-secondary {
            background: rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.85);
        }
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
        }
        .btn-primary {
            background: #007aff;
            color: #fff;
        }
        .btn-primary:hover {
            background: #0066cc;
        }
        /* Centered top logo */
        .logo-overlay {
            position: absolute;
            top: 16px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10001;
            max-width: 160px;
            max-height: 64px;
            object-fit: contain;
            pointer-events: none;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            transition: opacity 0.3s ease;
        }
        .logo-overlay.hidden {
            display: none !important;
        }
        /* Custom Hotspot Preview Tooltip Styles */
        .custom-hotspot-container {
            position: relative;
            cursor: pointer;
        }
        .hotspot-image-preview {
            visibility: hidden;
            opacity: 0;
            position: absolute;
            bottom: 42px;
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            width: 240px;
            height: 160px;
            background: #000;
            border: 3px solid rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
            overflow: hidden;
            z-index: 10000;
            pointer-events: none;
            transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s;
        }
        .hotspot-image-preview::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            border-width: 10px 10px 0;
            border-style: solid;
            border-color: rgba(255, 255, 255, 0.9) transparent;
            display: block;
            width: 0;
            z-index: 10001;
        }
        .custom-hotspot-container:hover .hotspot-image-preview {
            visibility: visible;
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        .preview-title-banner {
            position: absolute;
            top: 8px;
            left: 8px;
            right: 8px;
            background: rgba(0, 0, 0, 0.65);
            color: #fff;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            z-index: 10002;
            text-align: center;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .preview-image-inner {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .hotspot-persistent-label {
            display: inline-block !important;
            visibility: visible !important;
            position: absolute;
            bottom: -24px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.75);
            color: #fff;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            pointer-events: none;
        }
    </style>
</head>
<body>

<div id="tour-container">
    <div id="panorama-container"></div>
    
    <!-- Centered Top Logo -->
    <img id="logo-overlay" class="logo-overlay hidden" alt="Logo" />
    
    <!-- Audio Permission Modal -->
    <div id="audio-modal" class="modal-overlay">
        <div class="modal-card">
            <h3>Tự động phát nhạc?</h3>
            <p>Cho phép phát nhạc nền để có trải nghiệm tour tốt nhất.</p>
            <div class="modal-buttons">
                <button id="btn-no" class="modal-btn btn-secondary">Không phát</button>
                <button id="btn-yes" class="modal-btn btn-primary">Cho phép</button>
            </div>
        </div>
    </div>

    <!-- Bottom Control Bar -->
    <div id="control-bar" class="control-bar hidden">
        <!-- Scenes list container -->
        <div id="thumbnails-container" class="thumbnails-container">
            <div id="thumbnails-list" class="thumbnails-list"></div>
        </div>
        
        <!-- Controls row -->
        <div class="controls-row">
            <div id="scene-title" class="scene-title"></div>
            <div class="control-buttons">
                <!-- Toggle Grid -->
                <button id="btn-grid" class="control-btn" title="Danh sách cảnh">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                </button>
                <!-- Home -->
                <button id="btn-home" class="control-btn" title="Cảnh đầu tiên">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </button>
                <!-- Audio Toggle -->
                <button id="btn-audio" class="control-btn hidden" title="Âm thanh">
                </button>
                <!-- Fullscreen Toggle -->
                <button id="btn-fullscreen" class="control-btn" title="Toàn màn hình">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                </button>
            </div>
        </div>
    </div>
</div>

<script>
    // Embedded base64 assets for offline fallback (when opened via file:// protocol)
    const base64Assets = ${JSON.stringify(base64Assets)};
    const base64Audio = "${base64Audio}";
    const base64Logo = "${base64Logo}";
    const base64Thumbnails = ${JSON.stringify(base64Thumbnails)};

    const setup = ${configJson};

    // Helper to convert base64 to Blob URL
    function base64ToBlobUrl(base64Data) {
        try {
            const parts = base64Data.split(',');
            const mime = parts[0].match(/:(.*?);/)[1];
            const binaryString = window.atob(parts[1]);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: mime });
            return URL.createObjectURL(blob);
        } catch (e) {
            console.error('Failed to convert base64 to blob:', e);
            return base64Data;
        }
    }

    const isLocalFile = window.location.protocol === 'file:';

    // Update panorama sources based on protocol
    for (const sceneId in setup.scenes) {
        if (setup.scenes.hasOwnProperty(sceneId)) {
            const scene = setup.scenes[sceneId];
            if (isLocalFile && base64Assets[sceneId]) {
                console.log('Loading scene "' + sceneId + '" offline via Blob URL');
                scene.panorama = base64ToBlobUrl(base64Assets[sceneId]);
            } else {
                console.log('Loading scene "' + sceneId + '" online via relative path');
                // panorama is already set to relative path './assets/[sceneId].[ext]'
            }
        }
    }

    // Update background sound source based on protocol
    if (setup.backgroundSound) {
        if (isLocalFile && base64Audio) {
            console.log('Loading background audio offline via Blob URL');
            setup.backgroundSound = base64ToBlobUrl(base64Audio);
        } else {
            console.log('Loading background audio online via relative path');
            // backgroundSound is already set to relative path './assets/background-audio.[ext]'
        }
    }

    // Update logo source based on protocol
    const logoOverlay = document.getElementById('logo-overlay');
    if (setup.logoImage) {
        logoOverlay.classList.remove('hidden');
        if (isLocalFile && base64Logo) {
            console.log('Loading logo offline via Blob URL');
            logoOverlay.src = base64ToBlobUrl(base64Logo);
        } else {
            console.log('Loading logo online via relative path');
            logoOverlay.src = setup.logoImage;
        }
    }

    // Audio & Toolbar Logic
    const showControlBar = setup.showControlBar !== false;
    const hasAudio = !!setup.backgroundSound;
    
    let audio = null;
    let audioMuted = true;
    let viewer = null;

    const audioModal = document.getElementById('audio-modal');
    const controlBar = document.getElementById('control-bar');
    const btnYes = document.getElementById('btn-yes');
    const btnNo = document.getElementById('btn-no');

    if (!hasAudio) {
        audioModal.classList.add('hidden');
        startTour();
    } else {
        audio = new Audio(setup.backgroundSound);
        audio.loop = true;
        
        btnYes.addEventListener('click', () => {
            audioMuted = false;
            audioModal.classList.add('hidden');
            audio.play().catch(e => console.log('Audio playback block:', e));
            startTour();
        });
        
        btnNo.addEventListener('click', () => {
            audioMuted = true;
            audioModal.classList.add('hidden');
            startTour();
        });
    }

    function toggleAudio() {
        if (!audio) return;
        const btnAudio = document.getElementById('btn-audio');
        if (audioMuted) {
            audio.play().catch(e => console.log('Audio playback block:', e));
            audioMuted = false;
            btnAudio.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pulse-icon"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
        } else {
            audio.pause();
            audioMuted = true;
            btnAudio.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>';
        }
    }

    function hotspotPreview(hotSpotDiv, args) {
        hotSpotDiv.classList.add('custom-hotspot-container');

        // Create the persistent label (always visible)
        if (args.text) {
            const label = document.createElement('span');
            label.classList.add('hotspot-persistent-label');
            label.innerText = args.text;
            hotSpotDiv.appendChild(label);
        }

        // Create flat image preview only for scene hotspots that point to a valid scene
        if (args.type === 'scene' && args.targetSceneId) {
            const targetScene = args.scenes[args.targetSceneId];
            if (!targetScene) return;

            const tooltip = document.createElement('div');
            tooltip.classList.add('hotspot-image-preview');

            const titleBanner = document.createElement('div');
            titleBanner.classList.add('preview-title-banner');
            titleBanner.innerText = targetScene.title ? targetScene.title : args.targetSceneId;
            tooltip.appendChild(titleBanner);

            const img = document.createElement('img');
            img.classList.add('preview-image-inner');
            img.src = targetScene.thumbnail || targetScene.panorama || '';
            img.alt = targetScene.title || args.targetSceneId;
            tooltip.appendChild(img);

            hotSpotDiv.appendChild(tooltip);
        }
    }

    function startTour() {
        // Inject preview and persistent tooltips into hotspots
        for (const sceneId in setup.scenes) {
            const scene = setup.scenes[sceneId];
            if (scene.hotSpots) {
                for (const hotspot of scene.hotSpots) {
                    hotspot.createTooltipFunc = hotspotPreview;
                    hotspot.createTooltipArgs = {
                        type: hotspot.type,
                        targetSceneId: hotspot.sceneId || '',
                        scenes: setup.scenes,
                        text: hotspot.text || ''
                    };
                }
            }
        }

        viewer = pannellum.viewer('panorama-container', setup);
        
        if (showControlBar) {
            controlBar.classList.remove('hidden');
            initControlBar();
        }
    }

    function initControlBar() {
        const btnAudio = document.getElementById('btn-audio');
        if (hasAudio) {
            btnAudio.classList.remove('hidden');
            btnAudio.innerHTML = audioMuted 
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pulse-icon"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
            btnAudio.addEventListener('click', toggleAudio);
        }

        const thumbnailsList = document.getElementById('thumbnails-list');
        thumbnailsList.innerHTML = '';
        
        for (const sceneId in setup.scenes) {
            if (setup.scenes.hasOwnProperty(sceneId)) {
                const sceneConfig = setup.scenes[sceneId];
                
                const btn = document.createElement('button');
                btn.className = 'thumb-btn';
                btn.id = 'thumb-' + sceneId;
                btn.title = sceneConfig.title || sceneId;
                
                const img = document.createElement('img');
                img.className = 'thumb-img';
                
                let thumbSrc = sceneConfig.thumbnail || sceneConfig.panorama;
                if (isLocalFile) {
                    if (sceneConfig.thumbnail && base64Thumbnails[sceneId]) {
                        thumbSrc = base64ToBlobUrl(base64Thumbnails[sceneId]);
                    } else if (base64Assets[sceneId]) {
                        thumbSrc = base64ToBlobUrl(base64Assets[sceneId]);
                    }
                }
                img.src = thumbSrc;
                img.alt = sceneConfig.title || sceneId;
                
                const titleSpan = document.createElement('span');
                titleSpan.className = 'thumb-title';
                titleSpan.innerText = sceneConfig.title || sceneId;
                
                btn.appendChild(img);
                btn.appendChild(titleSpan);
                
                btn.addEventListener('click', () => {
                    if (viewer) {
                        viewer.loadScene(sceneId);
                    }
                });
                
                thumbnailsList.appendChild(btn);
            }
        }

        viewer.on('scenechange', (sceneId) => {
            updateActiveScene(sceneId);
        });

        // Initialize active highlight
        updateActiveScene(viewer.getScene());

        // Grid toggle
        const btnGrid = document.getElementById('btn-grid');
        const thumbContainer = document.getElementById('thumbnails-container');
        btnGrid.addEventListener('click', () => {
            thumbContainer.classList.toggle('collapsed');
        });

        // Home button - loads firstScene and resets to defaults
        const btnHome = document.getElementById('btn-home');
        btnHome.addEventListener('click', () => {
            const firstSceneId = setup.firstScene;
            if (firstSceneId && setup.scenes[firstSceneId]) {
                const firstSceneConfig = setup.scenes[firstSceneId];
                const pitch = firstSceneConfig.pitch !== undefined ? firstSceneConfig.pitch : 0;
                const yaw = firstSceneConfig.yaw !== undefined ? firstSceneConfig.yaw : 0;
                const hfov = firstSceneConfig.hfov !== undefined ? firstSceneConfig.hfov : 100;
                viewer.loadScene(firstSceneId, pitch, yaw, hfov);
            }
        });

        // Fullscreen toggle
        const btnFullscreen = document.getElementById('btn-fullscreen');
        btnFullscreen.addEventListener('click', () => {
            const tourContainer = document.getElementById('tour-container');
            if (!document.fullscreenElement) {
                tourContainer.requestFullscreen()
                    .then(() => {
                        btnFullscreen.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M10 14l-7 7"/></svg>';
                    })
                    .catch(err => {
                        console.error('Error attempting to enable fullscreen:', err);
                    });
            } else {
                document.exitFullscreen()
                    .then(() => {
                        btnFullscreen.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>';
                    });
            }
        });

        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                btnFullscreen.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>';
            } else {
                btnFullscreen.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M10 14l-7 7"/></svg>';
            }
        });
    }

    function updateActiveScene(sceneId) {
        const titleElem = document.getElementById('scene-title');
        const sceneConfig = setup.scenes[sceneId];
        titleElem.innerText = sceneConfig ? (sceneConfig.title || sceneId) : sceneId;
        
        const buttons = document.querySelectorAll('.thumb-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        const activeBtn = document.getElementById('thumb-' + sceneId);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
<\/script>

</body>
</html>
`;

			// Add index.html to the ZIP
			zip.file('index.html', indexHtmlContent);
			zip.file('pannellum.config.json', configJson);

			// Generate the ZIP blob
			const zipBlob = await zip.generateAsync({ type: 'blob' });

			// Download the ZIP file
			downloadFile(zipBlob, 'panorama-tour.zip', 'application/zip');

			toast.success('ZIP file generated and download started!', { id: toastId });
		} catch (error: any) {
			console.error('ZIP export failed:', error);
			toast.error(`Export failed: ${error?.message || error || 'Unknown error'}`, { id: toastId });
		} finally {
			exportingZip = false;
		}
	}

	export let dialogOpen = false;
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
</svelte:head>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-[625px] max-h-[85vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Export to Pannellum</Dialog.Title>
			<Dialog.Description>Download your project configuration or export the entire tour as a portable ZIP.</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-4">
			<div class="flex items-center space-x-2">
				<Switch id="airplane-mode" bind:checked={keepTailwind} />
				<Label for="airplane-mode">Keep TailwindCSS classes</Label>
			</div>

			{#if !keepTailwind}
				<div class="space-y-2">
					<h3 class="text-md font-bold">
						<FileJson class="mr-1 inline h-4 w-4" /> pannellum.config.json
					</h3>
					<Textarea
						placeholder="Begin by setting up your first scene"
						value={$jsonConfigWithoutTailwind}
					/>
					<div class="flex flex-wrap gap-2">
						<Button on:click={downloadJsonConfig}>Download</Button>
						<Button variant="secondary" on:click={copyJsonConfig}>Copy</Button>
					</div>
				</div>

				<div class="space-y-2">
					<h3 class="text-md font-bold">
						<FileCode class="mr-1 inline h-4 w-4" />
						pannellum-hotspots.css <Badge variant="default" class="ml-2"
							><TriangleAlert class="mr-2 h-3 w-3" />Experimental</Badge
						>
					</h3>
					<Textarea placeholder="You dont have any custom hotspots." value={cssFile} />
					<div class="flex flex-wrap gap-2">
						<Button disabled={!cssFile} on:click={downloadCssFile}>Download</Button>
						<Button disabled={!cssFile} variant="secondary" on:click={copyCssFile}>Copy</Button>
					</div>
				</div>
			{:else}
				<div class="space-y-2">
					<h3 class="text-md font-bold">
						<FileJson class="mr-1 inline h-4 w-4" /> pannellum.config.json
					</h3>
					<Textarea
						placeholder="Begin by setting up your first scene"
						value={$jsonConfigWithTailwind}
					/>
					<div class="flex flex-wrap gap-2">
						<Button on:click={downloadJsonConfig}>Download</Button>
						<Button variant="secondary" on:click={copyJsonConfig}>Copy</Button>
					</div>
				</div>
			{/if}

			<div class="pt-4 border-t border-muted">
				<div class="space-y-2">
					<h3 class="text-md font-bold flex items-center">
						<FolderArchive class="mr-2 h-4 w-4 text-primary" /> Portable Tour (ZIP)
					</h3>
					<p class="text-xs text-muted-foreground">
						Export the entire tour as a ZIP file containing the `index.html` page and all panorama images. Extract the ZIP and open `index.html` to run the tour offline.
					</p>
					<Button on:click={exportToZip} disabled={exportingZip} class="w-full">
						{#if exportingZip}
							Generating ZIP...
						{:else}
							Export Tour as ZIP
						{/if}
					</Button>
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
