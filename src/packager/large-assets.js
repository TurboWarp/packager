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
    src: externalFile('nwjs-v0.80.0-win-x64.zip'),
    sha256: '447492c16573684f58656e6418d0794cea5e3c111fa2680bf2b4f2307d79eb91',
    estimatedSize: 133532391
  },
  'nwjs-win32': {
    src: externalFile('nwjs-v0.80.0-win-ia32.zip'),
    sha256: '641eeffe2b77cefe9b9636ec042285c7905d453f56aedaa55adde0e3f630e0a7',
    estimatedSize: 124391320
  },
  'nwjs-mac': {
    src: externalFile('nwjs-v0.80.0-osx-x64.zip'),
    sha256: '9c3170f03f63f97b2739e7e03140b1742fc52b3e5c91ec7d000e71bd83a43329',
    estimatedSize: 120496868
  },
  'nwjs-linux-x64': {
    src: externalFile('nwjs-v0.80.0-linux-x64.zip'),
    sha256: 'fa4fb50b9fcf4cb357e61a6c5454b525ca042d9081a9bc0829a113582d29c9f0',
    estimatedSize: 153808583
  },
  'electron-win32': {
    src: externalFile('electron-v22.3.25-win32-ia32.zip'),
    sha256: 'a0fa8192e8d33f8876bb3867bf58f72fdafb1d106a68eab3b04aef0fed91fb4a',
    estimatedSize: 90856612
  },
  'electron-win64': {
    src: externalFile('electron-v22.3.25-win32-x64.zip'),
    sha256: '2b77e0ef8974517b6add666630f8c425adec1861402099da0f9a63abb6c0721b',
    estimatedSize: 96605498
  },
  'electron-mac': {
    src: externalFile('electron-v22.3.25-macos-universal.zip'),
    sha256: '948a2e195add755c366bd759ebd6c0521d7f34936edd9c353bc9148e8380d8b4',
    estimatedSize: 160882083
  },
  'electron-linux64': {
    src: externalFile('electron-v22.3.25-linux-x64.zip'),
    sha256: 'f1d0f66b13d5b7b9e3f7d9b22891bf0b5b6f87e45c46054cd3fa74636c19e921',
    estimatedSize: 93426892
  },
  'electron-linux-arm32': {
    src: externalFile('electron-v22.3.25-linux-armv7l.zip'),
    sha256: 'd90184e22f9d57fa4f207d5e5006bbfb6df1b9e10760333c3f72353ffa5ef3d1',
    estimatedSize: 82722572
  },
  'electron-linux-arm64': {
    src: externalFile('electron-v22.3.25-linux-arm64.zip'),
    sha256: '08c4e127d06d73ad91fa308c811ace9d4f8607fe15ba0b2694261d32a2127a8c',
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
