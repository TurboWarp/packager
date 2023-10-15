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
    src: externalFile('electron-v22.3.27-win32-ia32.zip'),
    sha256: '47bd498e5513529c5e141394fc9fd610cba1dcdea9e6dbb165edf929cbfd9af2',
    estimatedSize: 90856612
  },
  'electron-win64': {
    src: externalFile('electron-v22.3.27-win32-x64.zip'),
    sha256: '1a02c0f7af9664696f790dcce05948f0458a2f4f2d48c685f911d2eb99a4c9da',
    estimatedSize: 96605498
  },
  'electron-win-arm': {
    src: externalFile('electron-v22.3.27-win32-arm64.zip'),
    sha256: '0e4ad218018c0881ef4de363107a94dd2ced40367a0e18ca7d0dde1f40da0531',
    estimatedSize: 94065344
  },
  'electron-mac': {
    src: externalFile('electron-v22.3.27-macos-universal.zip'),
    sha256: '598b35f9030fe30f81b4041be048cd0374f675bd1bc0f172c26cf2808e80a3d9',
    estimatedSize: 160882083
  },
  'electron-linux64': {
    src: externalFile('electron-v22.3.27-linux-x64.zip'),
    sha256: '631d8eb08098c48ce2b29421e74c69ac0312b1e42f445d8a805414ba1242bf3a',
    estimatedSize: 93426892
  },
  'electron-linux-arm32': {
    src: externalFile('electron-v22.3.27-linux-armv7l.zip'),
    sha256: '9f8372606e5ede83cf1c73a3d8ff07047e4e3ef614aa89a76cd497dc06cf119d',
    estimatedSize: 82722572
  },
  'electron-linux-arm64': {
    src: externalFile('electron-v22.3.27-linux-arm64.zip'),
    sha256: '60279395a5ce4eaf3c08f1e717771b203830902d3fe3a7c311bc37deb1a0e15e',
    estimatedSize: 93932512
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
