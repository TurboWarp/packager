const RawSource = require('webpack-sources').RawSource;
const crypto = require('crypto');

const PLUGIN_NAME = 'GenerateServiceWorkerPlugin';
const SW_NAME = 'sw.js';

class GenerateServiceWorkerPlugin {
  apply(compiler) {
    const allAssetNames = new Set();
    allAssetNames.add('/');

    compiler.hooks.emit.tap(PLUGIN_NAME, compilation => {
      const newAssetNames = compilation.getAssets()
        .map(i => i.name);
      for (const name of newAssetNames) {
        allAssetNames.add(name);
      }
      const assetNames = Array.from(allAssetNames)
        .filter((name) => {
          if (name.endsWith('.map')) return false;
          return name.startsWith('assets/') || name.startsWith('js/')
        });
      const workerFile = compilation.getAsset(SW_NAME);
      const workerSource = workerFile.source.source().toString();
      const stringifiedAssets = JSON.stringify(assetNames);
      const hash = crypto.createHash('sha256');
      hash.update(stringifiedAssets);
      const newSource = workerSource
        .replace('__ENV__', process.env.NODE_ENV || 'development')
        .replace('[/* __ASSETS__ */]', stringifiedAssets)
        .replace('__CACHE_NAME__', `p4-${hash.digest('hex')}`);
      compilation.updateAsset(SW_NAME, new RawSource(newSource));
    });
  }
}

module.exports = GenerateServiceWorkerPlugin;
