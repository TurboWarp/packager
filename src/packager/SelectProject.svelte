<script>
  import Progress from './Progress.svelte';
  import writablePersistentStore from './persistent-store';
  import {error} from './stores';

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

  const readAsArrayBuffer = blob => new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('Can not read blob'));
    fr.readAsArrayBuffer(blob);
  });

  const load = async () => {
    try {
      reset();
      progressVisible = true;
      progress = 0;
      progressText = 'Loading Scratch';

      const {
        VirtualMachine,
        Storage
      } = await import(/* webpackChunkName: "scratch" */ './large-scratch-packages');

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
        newProjectData.uniqueId = `#${$projectId}`;
        newProjectData.projectId = $projectId;
        const res = await fetch('https://projects.scratch.mit.edu/' + $projectId);
        const data = await res.arrayBuffer();
        await vm.loadProject(data);
      } else {
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

<div>
  <button on:click={load} disabled={progressVisible}>Load Project</button>
</div>

{#if progressVisible}
  <Progress progress={progress} text={progressText} />
{/if}
