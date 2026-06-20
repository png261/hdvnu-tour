<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import {
		hotSpotsList,
		viewport,
		selectedHotSpot,
		scenes,
		selectedScene,
		pannellumViewer,
		viewerSettings,
		initialConfig,
		reinitViewerTrigger
	} from '$lib/storedInfo';
	import { get } from 'svelte/store';
	import type { HotSpot, PannellumSetup } from '$lib/types';
	import { toast } from 'svelte-sonner';
	import JSZip from 'jszip';

	import Dropzone from 'svelte-file-dropzone';
	import { Button, buttonVariants } from '$lib/components/ui/button/index';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import { cn } from '$lib/utils.js';
	import { addScene } from '$lib/Pannellum';
	import { ImageUp, PackagePlus, Trash2 } from 'lucide-svelte';
	import Separator from '../ui/separator/separator.svelte';
	import Badge from '../ui/badge/badge.svelte';

	import { isPannellumSetup } from '$lib/types';

	let jsonConfig: File | null = null;
	let jsonData: PannellumSetup | null = null;

	function handleFilesSelect(e: any) {
		const { acceptedFiles, fileRejections } = e.detail;
		jsonConfig = acceptedFiles[0];
		console.log(jsonConfig);
	}

	function formatFileSize(size: number): string {
		if (size === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(size) / Math.log(k));
		return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	async function saveConfig() {
		if (!jsonConfig) {
			toast.error('No file selected');
			return;
		}

		const toastId = toast.loading('Importing project...');

		try {
			if (jsonConfig.name.endsWith('.zip')) {
				// Process ZIP file
				const zip = await JSZip.loadAsync(jsonConfig);
				
				// Try to find pannellum.config.json
				const configFile = zip.file('pannellum.config.json');
				if (!configFile) {
					throw new Error('Could not find pannellum.config.json inside the ZIP file');
				}

				const configText = await configFile.async('text');
				const parsedData: unknown = JSON.parse(configText);

				if (!isPannellumSetup(parsedData)) {
					throw new Error('Invalid configuration format');
				}

				const importedSetup = parsedData as PannellumSetup;

				// Process scenes and extract images as local Blob URLs
				for (const sceneId in importedSetup.scenes) {
					if (importedSetup.scenes.hasOwnProperty(sceneId)) {
						const scene = importedSetup.scenes[sceneId];
						const panoramaPath = scene.panorama;

						if (panoramaPath && (panoramaPath.startsWith('./assets/') || panoramaPath.startsWith('assets/'))) {
							// Find the file in assets
							const relativePath = panoramaPath.startsWith('./') ? panoramaPath.substring(2) : panoramaPath;
							const imageFile = zip.file(relativePath);
							if (imageFile) {
								const blob = await imageFile.async('blob');
								// Create local object URL
								const localUrl = URL.createObjectURL(blob);
								scene.panorama = localUrl;
							}
						}
					}
				}

				// Apply settings to stores
				const settings = importedSetup.default || importedSetup;
				initialConfig.set({
					firstScene: settings.firstScene ?? 'circle',
					autoLoad: settings.autoLoad ?? true,
					sceneFadeDuration: settings.sceneFadeDuration ?? 1000,
					showControls: settings.showControls ?? false
				});
				scenes.set(importedSetup.scenes);
				
				// Set selectedScene to firstScene to trigger viewer reload
				const firstSceneId = settings.firstScene && importedSetup.scenes[settings.firstScene]
					? settings.firstScene
					: Object.keys(importedSetup.scenes)[0];
					
				if (firstSceneId) {
					selectedScene.set(firstSceneId);
				}

				// Trigger Pannellum viewer reload
				reinitViewerTrigger.update((n) => n + 1);

				toast.success('ZIP Project imported successfully!', { id: toastId });
				dialogOpen = false;
			} else {
				// Standalone JSON file import (original behavior)
				const fileText = await jsonConfig.text();
				const parsedData: unknown = JSON.parse(fileText);

				if (isPannellumSetup(parsedData)) {
					const importedSetup = parsedData as PannellumSetup;
					const settings = importedSetup.default || importedSetup;
					initialConfig.set({
						firstScene: settings.firstScene ?? 'circle',
						autoLoad: settings.autoLoad ?? true,
						sceneFadeDuration: settings.sceneFadeDuration ?? 1000,
						showControls: settings.showControls ?? false
					});
					scenes.set(importedSetup.scenes);
					
					// Set selectedScene to firstScene
					const firstSceneId = settings.firstScene && importedSetup.scenes[settings.firstScene]
						? settings.firstScene
						: Object.keys(importedSetup.scenes)[0];
						
					if (firstSceneId) {
						selectedScene.set(firstSceneId);
					}

					// Trigger Pannellum viewer reload
					reinitViewerTrigger.update((n) => n + 1);
					
					toast.success('Configuration loaded successfully', { id: toastId });
					dialogOpen = false;
				} else {
					toast.error('Invalid Pannellum configuration format', { id: toastId });
				}
			}
		} catch (error: any) {
			console.error('Import failed:', error);
			toast.error(`Import failed: ${error.message || error || 'Unknown error'}`, { id: toastId });
		}
	}

	let className = '';
	export { className as class };

	export let dialogOpen = false;
</script>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Trigger class={cn(className)}><slot /></Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Import pannellum config <Badge class="ml-2">beta</Badge></Dialog.Title>
			<Dialog.Description>Import a previously exported configuration file.</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-2 py-4">
			<div class="space-y-1">
				<Label for="id" class="">Configuration File</Label>
				{#if jsonConfig}
					<div class="flex flex-row rounded-lg border p-2 pl-4">
						<div>
							<h2 class="text-lg font-bold">
								{jsonConfig.name}
							</h2>
							<p class="text-sm text-muted-foreground">
								{formatFileSize(jsonConfig.size)} -
								<button
									type="button"
									class="text-primary underline-offset-4 hover:underline"
									on:click={() => (jsonConfig = null)}
								>
									Remove
								</button>
							</p>
						</div>
					</div>
				{:else}
					<Dropzone
						disableDefaultStyles
						multiple={false}
						accept=".json,.zip"
						on:drop={handleFilesSelect}
					>
						<div
							class="flex min-h-40 w-full items-center justify-center rounded-2xl border border-2 border-dashed text-center hover:border-muted-foreground"
						>
							<div>
								<div class="flex flex-col items-center justify-center">
									<PackagePlus class="mb-1 h-8 w-8 text-primary" />

									<h2 class="text-md">
										<span class="font-bold">Click to upload</span> or drag and drop
									</h2>

									<p class="text-sm text-muted-foreground">JSON or ZIP</p>
								</div>
							</div>
						</div>
					</Dropzone>
				{/if}
			</div>
		</div>
		<Dialog.Footer>
			<Button on:click={saveConfig}>Import</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
