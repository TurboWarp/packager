// Defined by webpack
const LARGE_ASSET_BASE = process.env.LARGE_ASSET_BASE;

// Use old nodejs exports so that this can be referenced easily from node
module.exports = {
  'nwjs-win64': {
    src: LARGE_ASSET_BASE + 'nwjs-v0.54.0-win-x64.zip',
    size: 97406745,
    sha256: '0f082671b67b711f783d98cc989cf5aebacfc9bce3bef78875b57d08fc2a6e86'
  },
  'nwjs-win32': {
    src: LARGE_ASSET_BASE + 'nwjs-v0.54.0-win-ia32.zip',
    sha256: '7a1ed3a6a51b8cdf9280761b90cb4723cf9ee8050e3ed0b58451e8e4e694b203'
  },
  'nwjs-mac': {
    src: LARGE_ASSET_BASE + 'nwjs-v0.54.0-osx-x64.zip',
    size: 97406745,
    sha256: '498c97a264f8feac504c4c2396c1fddc8290c15573aee2fc692e59ff9803cc40'
  },
  scaffolding: {
    src: 'scaffolding.js',
    as: 'text'
  },
  addons: {
    src: 'addons.js',
    as: 'text'
  }
};
