// This defines where files are fetched from when the packager needs to download files.
// Files fetched from an external server have a SHA-256 checksum used to validate the download.

// src is the URL that will be fetched to download the asset. If it's an array of URLs, each URL
// will be tried in succession if the previous one fails, perhaps because it's blocked by a school
// network filter.

// estimatedSize is used for the download progress bar if the server or browser does not tell us
// automatically. It's size in bytes after decoding Content-Encoding.
// If you change these, use numbers from a production build, not a development build.

// useBuildId is used for various cache related things. It shouldn't be changed.

const externalFile = (name) => [
  // Hopefully one of these URLs will not be blocked.
  `https://packagerdata.turbowarp.org/${name}`,
  `https://blobs.turbowarp.xyz/${name}`
];

const relativeScaffolding = (name) => `scaffolding/${name}`;

export default {
  'nwjs-win64': {
    src: externalFile('nwjs-v0.54.0-win-x64.zip'),
    sha256: '0f082671b67b711f783d98cc989cf5aebacfc9bce3bef78875b57d08fc2a6e86'
  },
  'nwjs-win32': {
    src: externalFile('nwjs-v0.54.0-win-ia32.zip'),
    sha256: '7a1ed3a6a51b8cdf9280761b90cb4723cf9ee8050e3ed0b58451e8e4e694b203'
  },
  'nwjs-mac': {
    src: externalFile('nwjs-v0.54.0-osx-x64.zip'),
    sha256: '498c97a264f8feac504c4c2396c1fddc8290c15573aee2fc692e59ff9803cc40'
  },
  'nwjs-linux-x64': {
    src: externalFile('nwjs-v0.54.0-linux-x64.zip'),
    sha256: '53651a3a12d29ad096cff5b44d9f1e3aa09e9fad970bdcfe8bda07ea23d960d8'
  },
  'electron-win32': {
    src: externalFile('electron-v17.2.0-win32-ia32.zip'),
    sha256: '7216d0ae35c95fcdd488c720909d2320480288ef02d3f95bcb574c9ef38169b8'
  },
  'electron-win64': {
    src: externalFile('electron-v17.2.0-win32-x64.zip'),
    sha256: '64451d98e574d8f78754aeb73258814b4fd1a9ef4266bae5e53cdd09273a0b23'
  },
  'electron-mac': {
    src: externalFile('electron-v19.0.6-macos-universal.zip'),
    sha256: 'f38e3bc8c452631cf98516e940a3364aaba36e3e028599979f4fbf1d780eaacc'
  },
  'electron-linux64': {
    src: externalFile('electron-v17.2.0-linux-x64.zip'),
    sha256: '2d56903d91635ca7117723b5a2bc926d7f5b391c989da4233c8babf73e6e6584'
  },
  'webview-mac': {
    src: externalFile('WebView-macos-3.zip'),
    sha256: '5d4086894f10549c61c20e5f770c808afc25c2e4793da75b5b1cede294449fac'
  },
  scaffolding: {
    src: relativeScaffolding('scaffolding-full.js'),
    estimatedSize: 4564032,
    useBuildId: true
  },
  'scaffolding-min': {
    src: relativeScaffolding('scaffolding-min.js'),
    estimatedSize: 2530463,
    useBuildId: true
  },
  addons: {
    src: relativeScaffolding('addons.js'),
    estimatedSize: 19931,
    useBuildId: true
  }
};
