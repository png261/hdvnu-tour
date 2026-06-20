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
        #panorama-container {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>

<div id="panorama-container"></div>

<script>
    // Embedded base64 assets for offline fallback (when opened via file:// protocol)
    const base64Assets = ${JSON.stringify(base64Assets)};

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

    pannellum.viewer('panorama-container', setup);
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
