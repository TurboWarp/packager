import assetCache from './cache';

class WebAdapter {
  getCachedAsset (asset) {
    return assetCache.get(asset)
  }

  async cacheAsset (asset, result) {
    await assetCache.set(asset, result);
  }
}

export default WebAdapter;
