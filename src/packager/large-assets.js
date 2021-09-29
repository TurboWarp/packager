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
    src: LARGE_ASSET_BASE + 'electron-v15.0.0-win32-ia32.zip',
    sha256: '5b69112b91010d78abf6012f387ea3fe5c0e36657c5f386a4c2bb42138aa1a8e',
    type: 'arraybuffer'
  },
  'electron-win64': {
    src: LARGE_ASSET_BASE + 'electron-v15.0.0-win32-x64.zip',
    sha256: '3d95422d9f2fccb07b745b31007548231d80ff63e3640f49a5f8591498a3afa2',
    type: 'arraybuffer'
  },
  'electron-linux64': {
    src: LARGE_ASSET_BASE + 'electron-v15.0.0-linux-x64.zip',
    sha256: '4f0c95f27402b1b39a7ef0d540940b99b5e3088624569607d6aa56276b43fcad',
    type: 'arraybuffer'
  },
  'webview-mac': {
    src: LARGE_ASSET_BASE + 'WebView-macos-3.zip',
    sha256: '5d4086894f10549c61c20e5f770c808afc25c2e4793da75b5b1cede294449fac',
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
