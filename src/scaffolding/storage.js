import ScratchStorage from 'scratch-storage';

class Storage extends ScratchStorage {
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
      assetType === ScratchStorage.AssetType.ImageBitmap ||
      assetType === ScratchStorage.AssetType.ImageVector ||
      assetType === ScratchStorage.AssetType.Sound
    );
    if (isAsset) {
      this._totalAssets++;
      this._updateProgress();
      return super.load(assetType, asset, assetFormat)
        .then((asset) => {
          this._loadedAssets++;
          this._updateProgress();
          return asset;
        });
    }
    return super.load(assetType, asset, assetFormat);
  }
}

export default Storage;
