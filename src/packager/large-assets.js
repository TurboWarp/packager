// This defines where files are fetched from when the packager needs to download files.
// Files fetched from an external server have a SHA-256 checksum used to validate the download.

// src is the URL that will be fetched to download the asset. If it's an array of URLs, each URL
// will be tried in succession if the previous one fails, perhaps because it's blocked by a school
// network filter.

// estimatedSize is used for the download progress bar if the server or browser does not tell us
// automatically. It's size in bytes after decoding Content-Encoding. If the real size of the file
// does not exactly match, that's fine. This is just for the progress bar.
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
    src: externalFile('nwjs-v0.68.1-win-x64.zip'),
    sha256: '82527d29f060bad7ec041f7c0536b1376f8bad5e5584adf7e3cf7205755a106c',
    estimatedSize: 119821598
  },
  'nwjs-win32': {
    src: externalFile('nwjs-v0.68.1-win-ia32.zip'),
    sha256: '7dd3104c2726082a8acd8973af2b2b223bc97960b722ec141b9bf07d84a0281b',
    estimatedSize: 112613344
  },
  'nwjs-mac': {
    src: externalFile('nwjs-v0.68.1-osx-x64.zip'),
    sha256: '4b1356302738a45f7ee212f6ecb997eb5d31403bfc45a7dd58429c968a1f581a',
    estimatedSize: 119091132
  },
  'nwjs-linux-x64': {
    src: externalFile('nwjs-v0.68.1-linux-x64.zip'),
    sha256: '5f597add1a2b6f13592117cc955111cea8211c13b21165e29c6616f385df5b94',
    estimatedSize: 135854818
  },
  'electron-win32': {
    src: externalFile('electron-v20.2.0-win32-ia32.zip'),
    sha256: '6efb3db3b6cc64175c9e4aa7fd9cc5f4bfd5f55c178ab2dcea84a781b175b968',
    estimatedSize: 88630104
  },
  'electron-win64': {
    src: externalFile('electron-v20.2.0-win32-x64.zip'),
    sha256: '1957470df4cd29ccfc03c0b701a7b2949b6cf6e5c5eaebd9cf4e002ae40e97f0',
    estimatedSize: 93849388
  },
  'electron-mac': {
    src: externalFile('electron-v19.0.6-macos-universal.zip'),
    sha256: 'f38e3bc8c452631cf98516e940a3364aaba36e3e028599979f4fbf1d780eaacc',
    estimatedSize: 146890071
  },
  'electron-linux64': {
    src: externalFile('electron-v20.2.0-linux-x64.zip'),
    sha256: 'c0e3522de34819b838f4a35ddf30c6283c61be1bb8dff02089cda3f641938aad',
    estimatedSize: 88806533
  },
  'webview-mac': {
    src: externalFile('WebView-macos-4.zip'),
    sha256: '580489b789b020e900417fabbe192abe24974555923c9d9280a723d2ad104314'
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
