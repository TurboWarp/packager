const loadScratch = () => new Promise((resolve, reject) => {
  // Loading Scratch like this is a terrible hack, yes, but its the fastest
  // as we'll need scaffolding later anyways (this should get it in the cache)
  const script = document.createElement('script');
  document.body.appendChild(script);
  script.onload = () => resolve({
    VirtualMachine: window.Scaffolding.VM,
    Storage: window.Scaffolding.Storage
  });
  script.onerror = () => reject(new Error('Could not load scaffolding'));
  script.src = 'scaffolding.js';
});

const loadProject = async (data, progressCallback) => {
  const {
    VirtualMachine,
    Storage
  } = await loadScratch();

  const vm = new VirtualMachine();

  // Loading extensions like music can cause Scratch to try to load some extra files that won't work because
  // some parts of the VM are not connected such as music.
  vm.extensionManager.loadExtensionURL = () => Promise.resolve();

  class StorageWithProgress extends Storage {
    constructor (...args) {
      super(...args);
      this.totalAssets = 0;
      this.loadedAssets = 0;
    }
    load (...args) {
      this.totalAssets++;
      progressCallback(this.loadedAssets, this.totalAssets);
      return super.load(...args)
        .then((r) => {
          this.loadedAssets++;
          progressCallback(this.loadedAssets, this.totalAssets);
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

  await vm.loadProject(data);

  return vm;
};

export default loadProject;
