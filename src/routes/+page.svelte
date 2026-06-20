<script context="module" lang="ts">
	// Import necessary dependencies
	import { onMount } from 'svelte';

	// Define the current version and last modified date
	const version: string = __VERSION__;
	const lastMod = __LASTMOD__;

	// Function to check and save version to local storage
	function checkAndSaveVersion() {
		const storedVersion = localStorage.getItem('appVersion');
		if (storedVersion !== version) {
			// Version has changed, update local storage and show dialog
			localStorage.setItem('appVersion', version);
			return true; // Indicate change for showing dialog
		}
		return false; // No change, no need to show dialog
	}
</script>

<script lang="ts">
	// Import necessary components and libraries
	import EditHotSpot2 from '$lib/components/editor/EditHotSpot.svelte';
	import HotSpotsList from '$lib/components/editor/HotSpotsList.svelte';
	import PanoramaPreview2 from '$lib/components/editor/PanoramaPreview.svelte';
	import SceneSelector from '$lib/components/editor/SceneSelector.svelte';
	import SceneList from '$lib/components/editor/SceneList.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import Separator from '$lib/components/ui/separator/separator.svelte';

	import {
		pannellumSetup,
		pannellumViewer,
		selectedHotSpot,
		viewerSettings,
		scenes,
		initialConfig
	} from '$lib/storedInfo';
	import WipAlert from '$lib/components/WipAlert.svelte';
	import Header from '$lib/components/editor/Header.svelte';
	import * as Accordion from '$lib/components/ui/accordion/index';
	import { Input } from '$lib/components/ui/input/index';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { toast } from 'svelte-sonner';

	function handleAudioUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			const objectUrl = URL.createObjectURL(file);
			$initialConfig.backgroundSound = objectUrl;
			toast.success(`Audio file "${file.name}" uploaded successfully.`);
		}
	}

	// Define types for panorama and scene data
	type PanoramaData = {
		yaw: number;
		pitch: number;
	};

	type SceneData = {
		imageSrc: string;
	};

	// Initialize variables for panorama and scene data
	let panoramaData: PanoramaData = { yaw: 0, pitch: 0 };
	let sceneData: SceneData[] = [];

	// Function to handle updates to panorama data
	function handlePanoramaDataUpdate(event: CustomEvent<PanoramaData>) {
		panoramaData = event.detail;
	}

	// Function to handle updates to scene data
	function handleScenes(event: CustomEvent<SceneData>) {
		sceneData = [...sceneData, event.detail];
	}

	// Function to handle resizing
	function handleResize(newSize: number, prevSize: number | undefined) {
		if ($pannellumViewer || !$pannellumViewer.getScene() || Object.keys($scenes).length == 0) {
			$pannellumViewer.resize();
		} else {
			console.warn('pannellumViewer is not initialized or does not have a resize function.');
		}
	}

	// Initialize local state for dialog visibility
	let showDialog = false;

	// On component mount, check and save version to local storage
	onMount(() => {
		showDialog = checkAndSaveVersion();
	});
</script>

<!-- Display the WipAlert dialog based on showDialog state -->
<WipAlert dialogOpen={showDialog} {version} {lastMod}></WipAlert>

<!-- HTML structure with resizable panes and components -->
<div class="h-[2.5rem]">
	<Header />
</div>
<div id="body">
	<Resizable.PaneGroup direction="horizontal" class="h-full w-full">
		<Resizable.Pane defaultSize={25} class="">
			<div class="h-full w-full overflow-y-auto p-3">
				<Accordion.Root value={["scenes", "hotspots", "more"]} type="multiple" class="w-full space-y-2">
					<Accordion.Item value="scenes" class="border rounded-lg px-3 py-1">
						<Accordion.Trigger class="hover:no-underline font-semibold text-sm py-2">Scenes</Accordion.Trigger>
						<Accordion.Content class="pt-2 pb-3">
							<SceneSelector />
							<Separator class="my-3" />
							<SceneList />
						</Accordion.Content>
					</Accordion.Item>
					
					<Accordion.Item value="hotspots" class="border rounded-lg px-3 py-1">
						<Accordion.Trigger class="hover:no-underline font-semibold text-sm py-2">Hotspots</Accordion.Trigger>
						<Accordion.Content class="pt-2 pb-3">
							<HotSpotsList />
						</Accordion.Content>
					</Accordion.Item>
					
					<Accordion.Item value="more" class="border rounded-lg px-3 py-1">
						<Accordion.Trigger class="hover:no-underline font-semibold text-sm py-2">More</Accordion.Trigger>
						<Accordion.Content class="pt-2 pb-3 space-y-4">
							<div class="space-y-2">
								<Label for="sidebar-bg-sound" class="text-xs text-muted-foreground">Background Sound</Label>
								<Input id="sidebar-bg-sound" bind:value={$initialConfig.backgroundSound} placeholder="Paste audio URL or upload file" class="h-8 text-xs" />
								
								<div class="flex items-center gap-2">
									<Button variant="outline" size="sm" class="h-7 text-xs flex-1 cursor-pointer relative">
										Choose Audio File
										<input type="file" accept="audio/*" class="absolute inset-0 opacity-0 cursor-pointer" on:change={handleAudioUpload} />
									</Button>
									{#if $initialConfig.backgroundSound}
										<Button variant="destructive" size="sm" class="h-7 text-xs px-2" on:click={() => ($initialConfig.backgroundSound = '')}>
											Remove
										</Button>
									{/if}
								</div>
							</div>
							<div class="flex items-center space-x-2 pt-1">
								<Switch id="sidebar-show-toolbar" bind:checked={$initialConfig.showControlBar} />
								<Label for="sidebar-show-toolbar" class="text-xs font-medium cursor-pointer">Show Bottom Control Bar</Label>
							</div>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion.Root>
			</div>
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane defaultSize={50}>
			<Resizable.PaneGroup direction="vertical">
				<div class="flex flex-col gap-2 overflow-y-auto p-2">
					<EditHotSpot2 />
				</div>
			</Resizable.PaneGroup>
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane
			defaultSize={50}
			onResize={(size, prevSize) => {
				$pannellumViewer.resize();
			}}
		>
			<Resizable.PaneGroup direction="vertical">
				<Resizable.Pane defaultSize={75} onResize={handleResize}>
					<PanoramaPreview2 />
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>

<style>
	#body {
		width: 100%;
		height: calc(100vh - 2.5rem);
	}
</style>
