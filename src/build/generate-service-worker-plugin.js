const RawSource = require('webpack-sources').RawSource;
const crypto = require('crypto');

const PLUGIN_NAME = 'GenerateServiceWorkerPlugin';
const SW_NAME = 'sw.js';

const CACHE_PAGES = [
  // The homepage
  ''
];

class GenerateServiceWorkerPlugin {
  apply(compiler) {
    const allAssetNames = new Set(CACHE_PAGES);
    compiler.hooks.emit.tap(PLUGIN_NAME, compilation => {
      compilation.getAssets()
        .map(i => i.name)
        .forEach((i) => allAssetNames.add(i));
      const assetNames = Array.from(allAssetNames)
        .filter((name) => {
          if (name.endsWith('.map')) return false;
          return name.startsWith('assets/') || name.startsWith('js/') || CACHE_PAGES.includes(name);
        });
      const stringifiedAssets = JSON.stringify(assetNames);
      const hash = crypto.createHash('sha256').update(stringifiedAssets).digest('hex');
      const workerFile = compilation.getAsset(SW_NAME);
      const workerSource = workerFile.source.source().toString();
      const newSource = workerSource
        .replace('__IS_PRODUCTION__', JSON.stringify(process.env.NODE_ENV === 'production'))
        .replace('[/* __ASSETS__ */]', stringifiedAssets)
        .replace('__CACHE_NAME__', JSON.stringify(`p4-${hash}`));
      compilation.updateAsset(SW_NAME, new RawSource(newSource));
    });
  }
}

module.exports = GenerateServiceWorkerPlugin;
