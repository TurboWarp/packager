// This defines where files are fetched from when the packager needs to download files.
// Files fetched from an external server have a SHA-256 checksum used to validate the download.
// src is the URL that will be fetched to download the asset. If it's an array of URLs, each URL
// will be tried in succession if the previous one fails, perhaps because it's blocked by a school
// network filter.

const externalFile = (name) => [
  // Hopefully one of these URLs will not be blocked.
  `https://packagerdata.turbowarp.org/${name}`,
  `https://blobs.turbowarp.xyz/${name}`
];

const relativeScaffolding = (name) => `scaffolding/${name}`;

export default {
  'nwjs-win64': {
    src: externalFile('nwjs-v0.54.0-win-x64.zip'),
    sha256: '0f082671b67b711f783d98cc989cf5aebacfc9bce3bef78875b57d08fc2a6e86',
    type: 'arraybuffer'
  },
  'nwjs-win32': {
    src: externalFile('nwjs-v0.54.0-win-ia32.zip'),
    sha256: '7a1ed3a6a51b8cdf9280761b90cb4723cf9ee8050e3ed0b58451e8e4e694b203',
    type: 'arraybuffer'
  },
  'nwjs-mac': {
    src: externalFile('nwjs-v0.54.0-osx-x64.zip'),
    sha256: '498c97a264f8feac504c4c2396c1fddc8290c15573aee2fc692e59ff9803cc40',
    type: 'arraybuffer'
  },
  'nwjs-linux-x64': {
    src: externalFile('nwjs-v0.54.0-linux-x64.zip'),
    sha256: '53651a3a12d29ad096cff5b44d9f1e3aa09e9fad970bdcfe8bda07ea23d960d8',
    type: 'arraybuffer'
  },
  'electron-win32': {
    src: externalFile('electron-v15.0.0-win32-ia32.zip'),
    sha256: '5b69112b91010d78abf6012f387ea3fe5c0e36657c5f386a4c2bb42138aa1a8e',
    type: 'arraybuffer'
  },
  'electron-win64': {
    src: externalFile('electron-v15.0.0-win32-x64.zip'),
    sha256: '3d95422d9f2fccb07b745b31007548231d80ff63e3640f49a5f8591498a3afa2',
    type: 'arraybuffer'
  },
  'electron-linux64': {
    src: externalFile('electron-v15.1.1-linux-x64.zip'),
    sha256: '70de2da51c6a8591b88f08366c82166a51b1719243f67ef1a14eddbb806a115f',
    type: 'arraybuffer'
  },
  'webview-mac': {
    src: externalFile('WebView-macos-3.zip'),
    sha256: '5d4086894f10549c61c20e5f770c808afc25c2e4793da75b5b1cede294449fac',
    type: 'arraybuffer'
  },
  scaffolding: {
    src: relativeScaffolding('scaffolding.js'),
    estimatedSize: 4775503,
    useBuildId: true,
    type: 'text'
  },
  'scaffolding-min': {
    src: relativeScaffolding('scaffolding-min.js'),
    estimatedSize: 2540321,
    useBuildId: true,
    type: 'text'
  },
  addons: {
    src: relativeScaffolding('addons.js'),
    estimatedSize: 14339,
    useBuildId: true,
    type: 'text'
  }
};
