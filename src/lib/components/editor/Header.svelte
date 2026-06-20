<script lang="ts">
	import * as Menubar from '$lib/components/ui/menubar/index';
	import { resetMode, setMode } from 'mode-watcher';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';

	import { viewerSettings, initialConfig } from '$lib/storedInfo';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Button } from '$lib/components/ui/button/index';
	import MenubarLabel from '$lib/components/ui/menubar/menubar-label.svelte';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Github } from 'lucide-svelte';
	import OrganizeHotSpots from './OrganizeHotSpots/Dialog.svelte';
	import Import from './Import.svelte';
	import Export from './Export.svelte';
	import { Item } from '../ui/accordion';
	import WipAlert from '../WipAlert.svelte';

	let mode: string | undefined;

	let organizeHotSpotsDialogOpen = false;
	let importDialogOpen = false;
	let exportDialogOpen = false;
	let tourSettingsDialogOpen = false;
	let wipDialogOpen = false;

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

	function handleLogoUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			const objectUrl = URL.createObjectURL(file);
			$initialConfig.logoImage = objectUrl;
			toast.success(`Logo image "${file.name}" uploaded successfully.`);
		}
	}
</script>

<OrganizeHotSpots bind:dialogOpen={organizeHotSpotsDialogOpen} />
<Import bind:dialogOpen={importDialogOpen} class="hidden" />
<Export bind:dialogOpen={exportDialogOpen} />
<Dialog.Root bind:open={tourSettingsDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Tour Settings</Dialog.Title>
			<Dialog.Description>Configure global options for this panorama tour.</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="bg-sound">Background Sound</Label>
				<Input id="bg-sound" bind:value={$initialConfig.backgroundSound} placeholder="Paste audio URL or upload file" />
				
				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm" class="flex-1 cursor-pointer relative">
						Choose Audio File
						<input type="file" accept="audio/*" class="absolute inset-0 opacity-0 cursor-pointer" on:change={handleAudioUpload} />
					</Button>
					{#if $initialConfig.backgroundSound}
						<Button variant="destructive" size="sm" on:click={() => ($initialConfig.backgroundSound = '')}>
							Remove
						</Button>
					{/if}
				</div>
			</div>

			<div class="space-y-2 pt-2 border-t">
				<Label for="logo-image">Logo Image</Label>
				<Input id="logo-image" bind:value={$initialConfig.logoImage} placeholder="Paste logo URL or upload file" />
				
				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm" class="flex-1 cursor-pointer relative">
						Choose Logo Image
						<input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" on:change={handleLogoUpload} />
					</Button>
					{#if $initialConfig.logoImage}
						<Button variant="destructive" size="sm" on:click={() => ($initialConfig.logoImage = '')}>
							Remove
						</Button>
					{/if}
				</div>
			</div>

			<div class="flex items-center space-x-2 pt-2 border-t">
				<Switch id="show-toolbar" bind:checked={$initialConfig.showControlBar} />
				<Label for="show-toolbar">Show Bottom Control Bar in Tour</Label>
			</div>
		</div>
		<Dialog.Footer>
			<Button on:click={() => (tourSettingsDialogOpen = false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
<WipAlert bind:dialogOpen={wipDialogOpen} />

<Menubar.Root class="flex w-full flex-row rounded-none border-0 border-b">
	<Menubar.Menu>
		<Menubar.Trigger>File</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item on:click={() => (importDialogOpen = true)}>Import</Menubar.Item>
			<Menubar.Item on:click={() => (exportDialogOpen = true)}>Export</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Item on:click={() => (wipDialogOpen = true)}>About</Menubar.Item>
			<Menubar.Item href="https://github.com/BramLeisink/visual-panorama-maker"
				><Github class="mr-2 h-4 w-4" /> Github</Menubar.Item
			>
		</Menubar.Content>
	</Menubar.Menu>
	<Menubar.Menu>
		<Menubar.Trigger>Edit</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item disabled>
				Undo <Menubar.Shortcut>⌘Z</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Item disabled>
				Redo <Menubar.Shortcut>⇧⌘Z</Menubar.Shortcut>
			</Menubar.Item>
			<Menubar.Separator />
			<Menubar.Item on:click={() => (organizeHotSpotsDialogOpen = true)}
				>Organize HotSpots</Menubar.Item
			>
			<Menubar.Separator />
			<Menubar.Item on:click={() => (tourSettingsDialogOpen = true)}
				>Tour Settings</Menubar.Item
			>
			<Menubar.Separator />
			<Menubar.Sub>
				<Menubar.SubTrigger>Precision</Menubar.SubTrigger>
				<Menubar.SubContent>
					<Menubar.RadioGroup bind:value={$viewerSettings.precision}>
						<Menubar.RadioItem value="0">0</Menubar.RadioItem>
						<Menubar.RadioItem value="1">1</Menubar.RadioItem>
						<Menubar.RadioItem value="2">2</Menubar.RadioItem>
						<Menubar.RadioItem value="3">3</Menubar.RadioItem>
					</Menubar.RadioGroup>
				</Menubar.SubContent>
			</Menubar.Sub>
		</Menubar.Content>
	</Menubar.Menu>
	<Menubar.Menu>
		<Menubar.Trigger>View</Menubar.Trigger>
		<Menubar.Content>
			<MenubarLabel>Panorama settings</MenubarLabel>
			<Menubar.CheckboxItem bind:checked={$viewerSettings.compass} disabled
				>Show compass</Menubar.CheckboxItem
			>
			<Menubar.CheckboxItem bind:checked={$viewerSettings.autoRotate} disabled
				>Rotate</Menubar.CheckboxItem
			>
			<Menubar.Separator />
			<MenubarLabel>Developer mode</MenubarLabel>
			<Menubar.CheckboxItem bind:checked={$viewerSettings.lookAtSelected}
				>Look at selected HotSpot</Menubar.CheckboxItem
			>

			<Menubar.Separator />
			<Menubar.Sub>
				<Menubar.SubTrigger>Switch color mode</Menubar.SubTrigger>
				<Menubar.SubContent>
					<Menubar.RadioGroup value={mode}>
						<Menubar.RadioItem
							on:click={function () {
								setMode('light');
								mode = 'light';
							}}
							value="light">Light</Menubar.RadioItem
						>
						<Menubar.RadioItem
							on:click={function () {
								setMode('dark');
								mode = 'dark';
							}}
							value="dark">Dark</Menubar.RadioItem
						>
						<Menubar.RadioItem
							on:click={function () {
								resetMode();
								mode = 'system';
							}}
							value="">System</Menubar.RadioItem
						>
					</Menubar.RadioGroup>
				</Menubar.SubContent>
			</Menubar.Sub>
		</Menubar.Content>
	</Menubar.Menu>
	<div class="flex-1"></div>
	<div class="flex items-center space-x-2 px-2">
		<Label for="devMode">Development Mode</Label>
		<Switch id="devMode" bind:checked={$viewerSettings.developmentMode} />
	</div>
</Menubar.Root>
