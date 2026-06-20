<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import {
		selectedFile,
		hotSpotsList,
		viewport,
		selectedHotSpot,
		viewerSettings,
		clickedLocation,
		pannellumSetup,
		selectedScene,
		scenes,
		pannellumViewer,
		reinitViewerTrigger,
		initialConfig
	} from '$lib/storedInfo';

	import {
		Maximize,
		Minimize,
		ChevronRight,
		ChevronLeft,
		ChevronDown,
		ChevronUp,
		ZoomIn,
		ZoomOut,
		RefreshCcw,
		Orbit,
		Grid,
		Home,
		Volume2,
		VolumeX
	} from 'lucide-svelte';

	import { round } from '$lib/Pannellum';

	import Button from '$lib/components/ui/button/button.svelte';
	import { cn } from '$lib/utils';

	let panoElement: any;
	let currentScene: string = '';
	let containerElement: HTMLDivElement;
	let isFullscreen = false;

	let showThumbnails = true;
	let audioElement: HTMLAudioElement | null = null;
	let audioMuted = true;

	$: if ($initialConfig.backgroundSound && typeof window !== 'undefined') {
		if (!audioElement) {
			audioElement = new Audio($initialConfig.backgroundSound);
			audioElement.loop = true;
		} else if (audioElement.src !== $initialConfig.backgroundSound) {
			audioElement.src = $initialConfig.backgroundSound;
			if (!audioMuted) {
				audioElement.play().catch(e => console.log('Audio autoplay blocked or failed:', e));
			}
		}
	}

	function toggleAudio() {
		if (!audioElement) return;
		if (audioMuted) {
			audioElement.play().catch(e => console.log('Audio autoplay blocked or failed:', e));
			audioMuted = false;
		} else {
			audioElement.pause();
			audioMuted = true;
		}
	}

	function changeScene(sceneId: string) {
		$selectedScene = sceneId;
	}

	function goHome() {
		const first = $initialConfig.firstScene;
		if (first && $scenes[first]) {
			$selectedScene = first;
		}
	}

	onDestroy(() => {
		if (audioElement) {
			audioElement.pause();
			audioElement = null;
		}
	});

	function hotspotPreview(hotSpotDiv: HTMLElement, args: { type: string; targetSceneId?: string; scenes: Record<string, any>; text?: string }) {
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

	function initPanorama() {
		if ($pannellumViewer) {
			$pannellumViewer.destroy();
		}

		// Inject preview and persistent tooltips into hotspots
		const setupCopy = JSON.parse(JSON.stringify($pannellumSetup));
		for (const sceneId in setupCopy.scenes) {
			const scene = setupCopy.scenes[sceneId];
			if (scene.hotSpots) {
				for (const hotspot of scene.hotSpots) {
					hotspot.createTooltipFunc = hotspotPreview;
					hotspot.createTooltipArgs = {
						type: hotspot.type,
						targetSceneId: hotspot.sceneId || '',
						scenes: setupCopy.scenes,
						text: hotspot.text || ''
					};
				}
			}
		}

		$pannellumViewer = (window as any).pannellum.viewer('panorama', setupCopy);

		panoElement.addEventListener('click', (event: any) => {
			const [clickPitch, clickYaw] = $pannellumViewer.mouseEventToCoords(event);
			$clickedLocation = {
				yaw: round(clickYaw),
				pitch: round(clickPitch)
			};
			if ($viewerSettings.lookAtSelected && $viewerSettings.developmentMode)
				$selectedScene = $pannellumViewer.getScene() || $selectedScene;
		});
	}

	onMount(() => {
		// Ensure the Pannellum script is loaded before initializing the panorama
		if (window.pannellum) {
			initPanorama();
		} else {
			const script = document.createElement('script');
			script.src = 'https://cdn.pannellum.org/2.5/pannellum.js';
			script.onload = () => initPanorama();
			document.head.appendChild(script);
		}

		const unsubscribeReinit = reinitViewerTrigger.subscribe((val) => {
			if (val > 0 && window.pannellum) {
				reload();
			}
		});

		const handleFullscreenChange = () => {
			isFullscreen = !!document.fullscreenElement;
			if ($pannellumViewer) {
				setTimeout(() => {
					$pannellumViewer.resize();
				}, 100);
			}
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);

		// Clean up on component destroy
		return () => {
			unsubscribeReinit();
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			if ($pannellumViewer) {
				$pannellumViewer.destroy();
			}
		};
	});

	// Event handlers for controls
	function panUp() {
		if ($pannellumViewer) {
			$pannellumViewer.setPitch($pannellumViewer.getPitch() + 10);
		}
	}

	function panDown() {
		if ($pannellumViewer) {
			$pannellumViewer.setPitch($pannellumViewer.getPitch() - 10);
		}
	}

	function panLeft() {
		if ($pannellumViewer) {
			$pannellumViewer.setYaw($pannellumViewer.getYaw() - 10);
		}
	}

	function panRight() {
		if ($pannellumViewer) {
			$pannellumViewer.setYaw($pannellumViewer.getYaw() + 10);
		}
	}

	function zoomIn() {
		if ($pannellumViewer) {
			$pannellumViewer.setHfov($pannellumViewer.getHfov() - 10);
		}
	}

	function zoomOut() {
		if ($pannellumViewer) {
			$pannellumViewer.setHfov($pannellumViewer.getHfov() + 10);
		}
	}

	function toggleFullscreen() {
		if (!containerElement) return;
		if (!document.fullscreenElement) {
			containerElement.requestFullscreen()
				.catch(err => {
					console.error('Error attempting to enable fullscreen:', err);
				});
		} else {
			document.exitFullscreen();
		}
	}

	function reload() {
		if ($pannellumViewer) {
			$pannellumViewer.destroy();
		}
		initPanorama();
	}
</script>

<svelte:head>
	<script src="https://cdn.pannellum.org/2.5/pannellum.js"></script>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css" />
</svelte:head>

<div class="h-full w-full">
	<div
		bind:this={containerElement}
		class={cn(
			'flex h-full w-full relative bg-black',
			$pannellumViewer && $pannellumViewer.getScene() && Object.keys($scenes).length != 0
				? ''
				: 'hidden'
		)}
	>
		<div bind:this={panoElement} id="panorama" />

		<!-- Logo Overlay -->
		{#if $initialConfig.logoImage}
			<img 
				src={$initialConfig.logoImage} 
				alt="Tour Logo" 
				class="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] max-w-[160px] max-h-[64px] object-contain pointer-events-none drop-shadow-md" 
			/>
		{/if}
		<div id="controls" class="z-2 absolute flex flex-col gap-1 p-2">
			<div class="flex flex-col">
				<Button variant="outline" size="icon" class="rounded-b-none" on:click={zoomIn}
					><ZoomIn class="h-4 w-4" /></Button
				>
				<Button variant="outline" size="icon" class="rounded-t-none" on:click={zoomOut}
					><ZoomOut class="h-4 w-4" /></Button
				>
			</div>
			<Button variant="outline" size="icon" on:click={toggleFullscreen}>
				{#if isFullscreen}
					<Minimize class="h-4 w-4" />
				{:else}
					<Maximize class="h-4 w-4" />
				{/if}
			</Button>
			<Button variant="outline" size="icon" on:click={reload}><RefreshCcw class="h-4 w-4" /></Button
			>
		</div>

		<!-- Bottom Control Bar -->
		{#if $initialConfig.showControlBar}
			<div class="absolute bottom-4 left-1/2 z-[10] w-[90%] max-w-[800px] -translate-x-1/2 rounded-xl bg-background/95 border border-muted p-3 shadow-2xl flex flex-col gap-3">
				<!-- Scene thumbnails list -->
				{#if showThumbnails}
					<div class="flex flex-row gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
						{#each Object.entries($scenes) as [sceneId, scene]}
							<button 
								class="flex flex-col items-center gap-1 min-w-[120px] max-w-[120px] rounded-lg border p-1 transition-all hover:bg-accent/50 { $selectedScene === sceneId ? 'border-primary bg-primary/10' : 'border-transparent' }"
								on:click={() => changeScene(sceneId)}
							>
								{#if scene.thumbnail}
									<img src={scene.thumbnail} alt={scene.title || sceneId} class="h-14 w-full rounded object-cover" />
								{:else if scene.panorama}
									<img src={scene.panorama} alt={scene.title || sceneId} class="h-14 w-full rounded object-cover" />
								{:else}
									<div class="h-14 w-full rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">No Pano</div>
								{/if}
								<span class="text-[10px] truncate w-full text-center font-medium">{scene.title || sceneId}</span>
							</button>
						{/each}
					</div>
				{/if}

				<!-- Controls Row -->
				<div class="flex flex-row items-center justify-between">
					<!-- Title on the left -->
					<div class="text-xs font-semibold truncate pr-4 text-foreground/80">
						{$scenes[$selectedScene]?.title || $selectedScene}
					</div>

					<!-- Control icons on the right -->
					<div class="flex flex-row items-center gap-1">
						<!-- Toggle thumbnails -->
						<Button variant="ghost" size="icon" class="h-8 w-8" on:click={() => (showThumbnails = !showThumbnails)}>
							<Grid class="h-4.5 w-4.5" />
						</Button>

						<!-- Home -->
						<Button variant="ghost" size="icon" class="h-8 w-8" on:click={goHome}>
							<Home class="h-4.5 w-4.5" />
						</Button>

						<!-- Mute/Unmute toggle -->
						{#if $initialConfig.backgroundSound}
							<Button variant="ghost" size="icon" class="h-8 w-8" on:click={toggleAudio}>
								{#if audioMuted}
									<VolumeX class="h-4.5 w-4.5 text-muted-foreground" />
								{:else}
									<Volume2 class="h-4.5 w-4.5 text-primary animate-pulse" />
								{/if}
							</Button>
						{/if}

						<!-- Fullscreen -->
						<Button variant="ghost" size="icon" class="h-8 w-8" on:click={toggleFullscreen}>
							{#if isFullscreen}
								<Minimize class="h-4.5 w-4.5" />
							{:else}
								<Maximize class="h-4.5 w-4.5" />
							{/if}
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</div>
	{#if !$pannellumViewer || !$pannellumViewer.getScene() || Object.keys($scenes).length == 0}
		<div class="h-full w-full p-8">
			<div
				class="flex h-full w-full items-center justify-center rounded-2xl border border-2 border-dashed text-center"
			>
				<div class="flex flex-col items-center justify-center">
					<Orbit class="mb-2 h-10 w-10 text-accent" />
					<h2 class="text-xl font-bold">Panorama Preview</h2>
					<p class="text-muted-foreground">There are no scenes in your project.</p>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	#panorama {
		width: 100%;
		height: 100%;
	}
</style>
