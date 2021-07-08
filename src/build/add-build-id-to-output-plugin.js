const RawSource = require('webpack-sources').RawSource;

const PLUGIN_NAME = 'AddBuildIDToOutputPlugin';

class AddBuildIDToOutputPlugin {
  constructor (id) {
    this.magic = `\n// ${id} =^..^=`;
  }
  apply(compiler) {
    compiler.hooks.emit.tap(PLUGIN_NAME, (compilation) => {
      for (const assetName of Object.keys(compilation.assets)) {
        if (assetName.endsWith('.js')) {
          const asset = compilation.getAsset(assetName);
          const source = asset.source.source().toString();
          const newSource = `${source}${this.magic}`;
          compilation.updateAsset(assetName, new RawSource(newSource));
        }
      }
    });
  }
}

module.exports = AddBuildIDToOutputPlugin;
