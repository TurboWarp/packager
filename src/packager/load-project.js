const loadProject = async (data, progressCallback) => {
  const {
    VirtualMachine,
    Storage
  } = await import(/* webpackChunkName: "large" */ './large-dependencies');

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
