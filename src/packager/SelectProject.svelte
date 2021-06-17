<script>
  import writablePersistentStore from './persistent-store';
  import {error} from './stores';

  export let projectData = null
  export let progress;
  const type = writablePersistentStore('SelectProject.type', 'id');
  const projectId = writablePersistentStore('SelectProject.id', '1');
  let files = null;

  const withErrorHandling = (fn) => () => fn().catch((e) => {
    $error = e
  });

  const load = withErrorHandling(async () => {
    const [
      VirtualMachine,
      Storage
    ] = await Promise.all([
      import('scratch-vm'),
      import('scratch-storage')
    ]);

    projectData = null;

    let vm = new (VirtualMachine.default)();

    class StorageWithProgress extends Storage.default {
      constructor (...args) {
        super(...args);
        this.totalAssets = 0;
        this.loadedAssets = 0;
      }
      load (...args) {
        this.totalAssets++;
        progress.text = `Downloading assets (${this.loadedAssets}/${this.totalAssets})`;
        progress.visible = true
        progress.value = this.loadedAssets / this.totalAssets;
        return super.load(...args)
          .then((r) => {
            this.loadedAssets++;
            progress.text = `Downloading assets (${this.loadedAssets}/${this.totalAssets})`;
            progress.value = this.loadedAssets / this.totalAssets;
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

    const readAsArrayBuffer = blob => new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(new Error('Can not read blob'));
      fr.readAsArrayBuffer(blob);
    });

    const newProjectData = {
      vm
    };
    if ($type === 'id') {
      newProjectData.uniqueId = `#${$projectId}`;
      const res = await fetch('https://projects.scratch.mit.edu/' + $projectId);
      const data = await res.arrayBuffer();
      await vm.loadProject(data);
    } else {
      const file = files[0];
      newProjectData.uniqueId = `@${file.name}`;
      const data = await readAsArrayBuffer(file);
      await vm.loadProject(data);
    }
    projectData = newProjectData
  });
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
  <button on:click={load}>Load Project</button>
</div>
