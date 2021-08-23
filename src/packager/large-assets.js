const LARGE_ASSET_BASE = 'https://packagerdata.turbowarp.org/';
const SCAFFOLDING_ROOT = 'scaffolding/';

export default {
  'nwjs-win64': {
    src: LARGE_ASSET_BASE + 'nwjs-v0.54.0-win-x64.zip',
    sha256: '0f082671b67b711f783d98cc989cf5aebacfc9bce3bef78875b57d08fc2a6e86',
    type: 'arraybuffer'
  },
  'nwjs-win32': {
    src: LARGE_ASSET_BASE + 'nwjs-v0.54.0-win-ia32.zip',
    sha256: '7a1ed3a6a51b8cdf9280761b90cb4723cf9ee8050e3ed0b58451e8e4e694b203',
    type: 'arraybuffer'
  },
  'nwjs-mac': {
    src: LARGE_ASSET_BASE + 'nwjs-v0.54.0-osx-x64.zip',
    sha256: '498c97a264f8feac504c4c2396c1fddc8290c15573aee2fc692e59ff9803cc40',
    type: 'arraybuffer'
  },
  'nwjs-linux-x64': {
    src: LARGE_ASSET_BASE + 'nwjs-v0.54.0-linux-x64.zip',
    sha256: '53651a3a12d29ad096cff5b44d9f1e3aa09e9fad970bdcfe8bda07ea23d960d8',
    type: 'arraybuffer'
  },
  'electron-win32': {
    src: LARGE_ASSET_BASE + 'electron-v13.1.6-win32-ia32.zip',
    sha256: 'bb6f34548879c9813897e2b023d195bf8b735198687db4448e19a13f71d77766',
    type: 'arraybuffer'
  },
  'electron-linux64': {
    src: LARGE_ASSET_BASE + 'electron-v13.1.6-linux-x64.zip',
    sha256: '6f28af0a3ccb20b0d2e4f26ea4698d5b89b81e860cbd40a446c2a8223fdf0101',
    type: 'arraybuffer'
  },
  'webview-mac': {
    src: LARGE_ASSET_BASE + 'WebView-macos-1.zip',
    sha256: '16f3ba73c025598248bb64163d45001b9eb7b1b9780a9417596ca52019bd3057',
    type: 'arraybuffer'
  },
  scaffolding: {
    src: SCAFFOLDING_ROOT + 'scaffolding.js',
    estimatedSize: 4775503,
    useBuildId: true,
    type: 'text'
  },
  'scaffolding-min': {
    src: SCAFFOLDING_ROOT + 'scaffolding-min.js',
    estimatedSize: 2540321,
    useBuildId: true,
    type: 'text'
  },
  addons: {
    src: SCAFFOLDING_ROOT + 'addons.js',
    estimatedSize: 14339,
    useBuildId: true,
    type: 'text'
  }
};
