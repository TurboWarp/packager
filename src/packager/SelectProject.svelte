<script>
  import Section from './Section.svelte';
  import Progress from './Progress.svelte';
  import writablePersistentStore from './persistent-store';
  import {error} from './stores';
  import {UserError} from './errors';
  import {readAsArrayBuffer} from './lib/readers';

  export let projectData = null;
  const type = writablePersistentStore('SelectProject.type', 'id');
  const projectId = writablePersistentStore('SelectProject.id', '1');
  let files = null;

  const reset = () => {
    projectData = null;
  };

  let progressVisible = false;
  let progress = 0;
  let progressText = '';

  // Reset project whenever an input changes
  $: files, $projectId, $type, reset();

  const load = async () => {
    try {
      reset();
      progressVisible = true;
      progress = 0;
      progressText = 'Loading Scratch';

      const {
        VirtualMachine,
        Storage
      } = await import(/* webpackChunkName: "large" */ './large-dependencies');

      progressText = 'Loading project';
      let vm = new VirtualMachine();
      vm.extensionManager.loadExtensionURL = () => Promise.resolve();
      class StorageWithProgress extends Storage {
        constructor (...args) {
          super(...args);
          this.totalAssets = 0;
          this.loadedAssets = 0;
        }
        load (...args) {
          this.totalAssets++;
          progress = this.loadedAssets / this.totalAssets;
          progressText = `Loading assets (${this.loadedAssets}/${this.totalAssets})`;
          return super.load(...args)
            .then((r) => {
              this.loadedAssets++;
              progress = this.loadedAssets / this.totalAssets;
              progressText = `Loading assets (${this.loadedAssets}/${this.totalAssets})`;
              return r;
            });
        }
      }
      const storage = new StorageWithProgress();
      storage.addWebStore(
        [storage.AssetType.ImageVector, storage.AssetType.ImageBitmap, storage.AssetType.Sound],
        (asset) => `https://assets.scratch.mit.edu/internalapi/asset/${asset.assetId}.${asset.dataFormat}/get/`
      );
      vm.attachStorage(storage);

      const newProjectData = {
        vm
      };
      if ($type === 'id') {
        const match = $projectId.match(/\d+/);
        if (!match) {
          throw new UserError('Invalid project ID');
        }
        const id = match[0];
        newProjectData.uniqueId = `#${id}`;
        newProjectData.projectId = id;
        const res = await fetch('https://projects.scratch.mit.edu/' + id);
        const data = await res.arrayBuffer();
        await vm.loadProject(data);
      } else {
        if (!files) {
          throw new UserError('No file selected');
        }
        const file = files[0];
        newProjectData.projectId = null;
        newProjectData.uniqueId = `@${file.name}`;
        const data = await readAsArrayBuffer(file);
        await vm.loadProject(data);
      }
      projectData = newProjectData
    } catch (e) {
      $error = e;
    }

    progressVisible = false;
  };
</script>

<style>

</style>

<Section>
  <h2>Choose Project</h2>
  <p>You can package projects from the Scratch website by copying their URL or from files from your computer. If you're using someone else's project, make sure to give them proper credit.</p>
  <div>
    <label>
      <input type="radio" bind:group={$type} value="id">
      Project ID or URL
    </label>
    {#if $type === "id"}
      <input type="text" bind:value={$projectId}>
    {/if}
  </div>
  <div>
    <label>
      <input type="radio" bind:group={$type} value="file">
      File
    </label>
    {#if $type === "file"}
      <input bind:files={files} type="file" accept=".sb,.sb2,.sb3">
    {/if}
  </div>

  <p>
    <button on:click={load} disabled={progressVisible}>Load New Project</button>
  </p>
</Section>

{#if progressVisible}
  <Section>
    <Progress progress={progress} text={progressText} />
  </Section>
{:else if !projectData}
  <Section caption>
    <p>Load a project to continue</p>
  </Section>
{/if}
