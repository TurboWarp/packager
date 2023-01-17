// This defines where files are fetched from when the packager needs to download files.
// Files fetched from an external server have a SHA-256 checksum used to validate the download.

// src is the URL that will be fetched to download the asset. If it's an array of URLs, each URL
// will be tried in succession if the previous one fails, perhaps because it's blocked by a school
// network filter.

// estimatedSize is used for the asset download progress bar if the server doesn't specify a
// Content-Length. It's size in bytes after decoding Content-Encoding. Real size does not need to
// match; this is just for the progress bar. estimatedSize is optional and can be omitted.
// Make sure to use size estimates from production builds, not development ones.

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
    src: externalFile('electron-v21.2.3-win32-ia32.zip'),
    sha256: 'ee813a8dc4050c7d3a3cc80233bf5f4ddd0483e1c934eb69d735a3b3563ce3bf',
    estimatedSize: 89317110
  },
  'electron-win64': {
    src: externalFile('electron-v21.2.3-win32-x64.zip'),
    sha256: 'b1695f0528567ecc1f7e667520c7770321df35d058841e24c4e9793f4e43e56a',
    estimatedSize: 95073928
  },
  'electron-mac': {
    src: externalFile('electron-v21.0.1-macos-universal.zip'),
    sha256: 'c31d1ef26f7b6230881a11308ebf8f4487a1a3fb7a151da0972fad77bc9e6acf',
    estimatedSize: 154789837
  },
  'electron-linux64': {
    src: externalFile('electron-v21.0.1-linux-x64.zip'),
    sha256: '4fd6d7b5a65f44a43165ae77d0484db992b30d6efba478a192e984506fbd52b6',
    estimatedSize: 90635371
  },
  'webview-mac': {
    src: externalFile('WebView-macos-5.zip'),
    sha256: 'b5636571cd9be2aae2f6dac1ab090fdf829c8fdfe91f462cc2feb2d324705f9f',
    estimatedSize: 3425601
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
