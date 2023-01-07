import ScratchStorage from 'scratch-storage';

class StorageWithProgress extends ScratchStorage {
  constructor () {
    super();

    this._totalAssets = 0;
    this._loadedAssets = 0;
  }

  _updateProgress () {
    if (this.onprogress) {
      this.onprogress(this._totalAssets, this._loadedAssets);
    }
  }

  load (assetType, asset, assetFormat) {
    const isAsset = (
      assetType === this.AssetType.ImageBitmap ||
      assetType === this.AssetType.ImageVector ||
      assetType === this.AssetType.Sound
    );
    if (isAsset) {
      this._totalAssets++;
      this._updateProgress();
      return super.load(assetType, asset, assetFormat)
        .then((loadedAsset) => {
          this._loadedAssets++;
          this._updateProgress();
          return loadedAsset;
        });
    }
    return super.load(assetType, asset, assetFormat);
  }
}

export default StorageWithProgress;
