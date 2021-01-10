/*
Copyright (c) 2020 Thomas Weber

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

window.Packager = (function() {
  // @ts-ignore
  const JSZip = window.JSZip;
  // @ts-ignore
  const Icns = window.Icns;

  const readAsDataURL = (blob) => new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('could not read as data url'));
    fr.readAsDataURL(blob);
  });

  const readAsArrayBuffer = (blob) => new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('could not read as arraybuffer'));
    fr.readAsArrayBuffer(blob);
  });

  const loadImage = (src) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${src}`));
    image.src = src;
  });

  const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Could not read <canvas> as blob'));
      }
    }); // png is default type, quality is ignored
  });

  const isObject = (obj) => typeof obj === 'object' && obj !== null;

  // TODO: load dynamically
  const assetManifest = {
    'nwjs-win64': {
      src: 'https://packagerdata.turbowarp.org/nwjs-v0.49.0-win-x64.zip',
      size: 97406745
    },
    'nwjs-mac': {
      src: 'https://packagerdata.turbowarp.org/nwjs-v0.49.0-osx-x64.zip',
      size: 128684835
    }
  };

  const LOAD_ASSETS_FROM_LOCALHOST = false;

  const fetchManifestAsset = (assetName, progressCallback) => {
    const manifestEntry = assetManifest[assetName];
    if (manifestEntry._data) {
      return Promise.resolve(manifestEntry._data);
    }
    return new Promise((resolve, reject) => {
      let {src, size} = manifestEntry;
      if (LOAD_ASSETS_FROM_LOCALHOST) {
        const srcURL = new URL(src);
        src = srcURL.pathname;
      }
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = () => {
        if (xhr.status === 200) {
          manifestEntry._data = xhr.response;
          resolve(xhr.response);
        } else {
          reject(new Error(`Unexpected status code ${xhr.status} while downloading ${src}`));
        }
      };
      xhr.onerror = () => reject(new Error('XHR failed'));
      xhr.onprogress = (e) => {
        progressCallback(e.loaded / size);
      };
      xhr.onloadend = () => progressCallback(1);
      xhr.open('GET', src);
      xhr.send();
    });
  };

  const fetch = (url) => window.fetch(url)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Unexpected status code ${response.status} while fetching ${url}`);
      }
      return response;
    });

  /**
   * @typedef {object} ProjectReference
   * @property {string} data
   * @property {string} type
   */

  class Project {
    constructor(blob, type) {
      this.blob = blob;
      this.type = type;
    }

    /**
     * @returns {Promise<ProjectReference>}
     */
    async asDataURL() {
      return {
        data: await readAsDataURL(this.blob),
        type: this.type
      };
    }

    /**
     * @returns {Promise<ProjectReference>}
     */
    async asFetchedFrom(path) {
      // Environment is responsible for making sure the file will be available at the given path.
      return {
        data: path,
        type: this.type
      };
    }
  }

  class ScriptOrStyleLoader {
    constructor(files, pathPrefix = '') {
      this.files = files;
      this.pathPrefix = pathPrefix;
    }

    async _loadInlineSource(source) {
      const response = await fetch(this.pathPrefix + source);
      const blob = await response.blob();
      const url = await readAsDataURL(blob);
      return url;
    }

    async _loadFile(file) {
      const response = await fetch(this.pathPrefix + file.src);
      let body = await response.text();

      if (file.inlineSources) {
        for (const source of file.inlineSources) {
          const sourceData = await this._loadInlineSource(source);
          // string.replace only does the first occurrence, but a source may appear multiple times in the file
          while (body.includes(source)) {
            body = body.replace(source, sourceData);
          }
        }
      }

      file.loaded = true;
      file.content = body;
    }

    async load() {
      const missingFiles = this.files.filter((i) => !i.loaded);
      if (missingFiles.length > 0) {
        await Promise.all(missingFiles.map((i) => this._loadFile(i)));
      }
      return this.files.map((i) => i.content).join('\n');
    }
  }

  class Runtime {
    setProgressTarget(progressTarget) {
      /** @type {EventTarget} */
      this.progressTarget = progressTarget;
    }
    /**
     * @param {ProjectReference} projectReference
     */
    package(projectReference) {
      throw new Error('Not implemented');
    }
  }

  class Environment {
    setRuntime(runtime) {
      /** @type {Runtime} */
      this.runtime = runtime;
    }
    setProgressTarget(progressTarget) {
      if (!this.runtime) {
        throw new Error('setRuntime should be run before setProgressTarget');
      }
      /** @type {EventTarget} */
      this.progressTarget = progressTarget;
      this.runtime.setProgressTarget(progressTarget);
    }
    setProjectData(projectData) {
      /** @type {Project} */
      this.projectData = projectData;
    }
    package() {
      throw new Error('Not implemented');
    }
  }

  class AssetLoader {
    constructor(files, pathPrefix = '') {
      this.files = files;
      this.pathPrefix = pathPrefix;
    }

    async _loadAsset(asset) {
      const response = await fetch(this.pathPrefix + asset.src);
      const blob = await response.blob();
      const data = await readAsDataURL(blob);
      asset.loaded = true;
      asset.blob = blob;
      asset.data = data;
    }

    async load() {
      const missing = this.files.filter((i) => !i.loaded);
      if (missing.length > 0) {
        await Promise.all(missing.map((i) => this._loadAsset(i)));
      }
      return this.files;
    }
  }

  class TurboWarp extends Runtime {
    constructor(options) {
      super();
      this.options = options;
    }
    async package(projectReference) {
      const script = await TurboWarp.scriptLoader.load();
      return `<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <!-- TODO: determine CSP -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    #splash {
      user-select: none;
      background-color: hsla(0, 100%, 65%, 1); color: white; font-family: sans-serif;
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center; text-align: center;
    }
    #splash h1 { font-size: 2rem; font-weight: bold; }
    .tw-loaded #splash { display: none; }
    @media (prefers-color-scheme: dark) { #splash { background-color: #333; color: #ddd; } }
  </style>
</head>

<body>

  <div id="splash" aria-hidden="true">
    <div>
      <h1>Loading scripts</h1>
      <p>This may take a while …</p>
    </div>
  </div>

  <script>
  window.__OPTIONS__ = ${JSON.stringify(this.options)}
  window.__PROJECT_DATA__ = "${projectReference.data}";
  </script>
  <script>
  ${script.replace(/<\/script>/g,"</scri'+'pt>")}
  </script>
</body>

</html>`;
    }
  }
  TurboWarp.scriptLoader = new ScriptOrStyleLoader([
    { src: 'packager.46043b616ed3367d019d.js' }
  ], 'https://packagerdata.turbowarp.org/');

  class Forkphorus extends Runtime {
    constructor(options) {
      super();
      this.playerOptions = options.playerOptions;
      this.controlsOptions = options.controlsOptions;
      this.loadingScreenText = options.loadingScreenText;
    }
    async package(projectReference) {
      const [ scripts, styles, assets ] = await Promise.all([
        Forkphorus.scriptLoader.load(),
        Forkphorus.styleLoader.load(),
        Forkphorus.assetLoader.load(),
      ]);
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'unsafe-inline' 'unsafe-eval' data: blob:">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
/* Forkphorus styles... */
${styles}

/* Player styles... */
body {
  background: #000;
  margin: 0;
  overflow: hidden;
}
.player {
  position: absolute;
}
.splash, .error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  display: table;
  color: #fff;
  cursor: default;
}
.error {
  display: none;
}
.splash > div,
.error > div {
  display: table-cell;
  height: 100%;
  text-align: center;
  vertical-align: middle;
}
.progress {
  width: 80%;
  height: 16px;
  border: 1px solid #fff;
  margin: 0 auto;
}
.progress-bar {
  background: #fff;
  width: 10%;
  height: 100%;
}
h1 {
  font: 300 72px Helvetica Neue, Helvetica, Arial, sans-serif;
  margin: 0 0 16px;
}
p {
  font: 300 24px/1.5 Helvetica Neue, Helvetica, Arial, sans-serif;
  margin: 0;
  color: rgba(255, 255, 255, .6);
}
.error a {
  color: #fff;
}
  </style>
</head>
<body>

  <div class="player"></div>
  <div class="splash">
    <div>
      ${this.loadingScreenText ? `<h1>${this.loadingScreenText}</h1>` : ''}
      <div class="progress">
        <div class="progress-bar"></div>
      </div>
    </div>
  </div>
  <div class="error">
    <div>
      <h1>Internal Error</h1>
      <p class="error-report"></p>
    </div>
  </div>

  <script>
// Forkphorus scripts...
${scripts}

// NW.js hook...
(function() {
  if (typeof nw !== 'undefined') {
    // open links in the browser
    var win = nw.Window.get();
    win.on('new-win-policy', (frame, url, policy) => {
      policy.ignore();
      nw.Shell.openExternal(url);
    });
    // fix the size of the window made by NW.js
    var package = nw.require('package.json');
    if (package.window && package.window.height && package.window.width) {
      win.resizeBy(package.window.width - window.innerWidth, package.window.height - window.innerHeight);
    }
  }
})();

// Player scripts...
(function () {
  'use strict';

  var splash = document.querySelector('.splash');
  var error = document.querySelector('.error');
  var progressBar = document.querySelector('.progress');
  var progressBarFill = document.querySelector('.progress-bar');

  var splash = document.querySelector('.splash');
  var error = document.querySelector('.error');
  var progressBar = document.querySelector('.progress');
  var progressBarFill = document.querySelector('.progress-bar');

  var player = new P.player.Player();
  player.setOptions({ theme: 'dark' });
  var errorHandler = new P.player.ErrorHandler(player, {
    container: document.querySelector('.error-report'),
  });
  player.onprogress.subscribe(function(progress) {
    progressBarFill.style.width = (10 + progress * 90) + '%';
  });
  player.onerror.subscribe(function(e) {
    player.exitFullscreen();
    error.style.display = 'table';
  });
  document.querySelector('.player').appendChild(player.root);

  document.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, { passive: false });

  P.io.setAssetManager(new class {
    constructor() {
      // Assets...
      this.data = {${assets.map((asset) => `"${asset.src}": "${asset.data}"`).join(', ')}};
    }

    loadSoundbankFile(src) {
      return this.fetch('soundbank/' + src).then(function(e) { return e.arrayBuffer(); });
    }

    loadFont(src) {
      return this.fetch(src).then(function(e) { return e.blob(); });
    }

    fetch(u) {
      return fetch(this.data[u]);
    }
  });

  // Project type...
  var type = '${projectReference.type}';
  // Project data...
  // Attribution Notice:
  var project = '${projectReference.data}';

  // Player options...
  var playerOptions = ${JSON.stringify(this.playerOptions)};
  // Controls options...
  var controlsOptions = ${JSON.stringify(this.controlsOptions)};

  player.setOptions(playerOptions);
  if (controlsOptions) {
    player.addControls(controlsOptions);
  }

  fetch(project)
    .then(function(request) { return request.arrayBuffer(); })
    .then(function(buffer) { return player.loadProjectFromBuffer(buffer, type); })
    .then(function() {
      player.enterFullscreen();
      splash.style.display = 'none';
    })
    .catch(function(e) {
      player.handleError(e);
    });
}());
  </script>
</body>
</html>`;
    }
  }
  Forkphorus.scriptLoader = new ScriptOrStyleLoader([
    { src: 'lib/scratch-sb1-converter.js', },
    { src: 'lib/canvg.min.js', },
    { src: 'lib/fontfaceobserver.standalone.js', },
    { src: 'lib/jszip.min.js', },
    { src: 'lib/purify.min.js', },
    { src: 'phosphorus.dist.js', inlineSources: ['icons.svg'] },  
  ], 'https://forkphorus.github.io/');
  Forkphorus.styleLoader = new ScriptOrStyleLoader([
    {
      src: 'phosphorus.css',
      inlineSources: [
        'icons.svg',
        'icons/click-to-play.svg',
        'fonts/DonegalOne-Regular.woff',
        'fonts/GloriaHallelujah.woff',
        'fonts/MysteryQuest-Regular.woff',
        'fonts/PermanentMarker-Regular.woff',
      ]    
    }
  ], 'https://forkphorus.github.io/');
  Forkphorus.assetLoader = new AssetLoader([
    { src: 'soundbank/sb2/instruments/AcousticGuitar_F3_22k.wav', },
    { src: 'soundbank/sb2/instruments/AcousticPiano(5)_A%233_22k.wav', },
    { src: 'soundbank/sb2/instruments/AcousticPiano(5)_C4_22k.wav', },
    { src: 'soundbank/sb2/instruments/AcousticPiano(5)_G4_22k.wav', },
    { src: 'soundbank/sb2/instruments/AcousticPiano(5)_F5_22k.wav', },
    { src: 'soundbank/sb2/instruments/AcousticPiano(5)_C6_22k.wav', },
    { src: 'soundbank/sb2/instruments/AcousticPiano(5)_D%236_22k.wav', },
    { src: 'soundbank/sb2/instruments/AcousticPiano(5)_D7_22k.wav', },
    { src: 'soundbank/sb2/instruments/AltoSax_A3_22K.wav', },
    { src: 'soundbank/sb2/instruments/AltoSax(3)_C6_22k.wav', },
    { src: 'soundbank/sb2/instruments/Bassoon_C3_22k.wav', },
    { src: 'soundbank/sb2/instruments/BassTrombone_A2(2)_22k.wav', },
    { src: 'soundbank/sb2/instruments/BassTrombone_A2(3)_22k.wav', },
    { src: 'soundbank/sb2/instruments/Cello(3b)_C2_22k.wav', },
    { src: 'soundbank/sb2/instruments/Cello(3)_A%232_22k.wav', },
    { src: 'soundbank/sb2/instruments/Choir(4)_F3_22k.wav', },
    { src: 'soundbank/sb2/instruments/Choir(4)_F4_22k.wav', },
    { src: 'soundbank/sb2/instruments/Choir(4)_F5_22k.wav', },
    { src: 'soundbank/sb2/instruments/Clarinet_C4_22k.wav', },
    { src: 'soundbank/sb2/instruments/ElectricBass(2)_G1_22k.wav', },
    { src: 'soundbank/sb2/instruments/ElectricGuitar(2)_F3(1)_22k.wav', },
    { src: 'soundbank/sb2/instruments/ElectricPiano_C2_22k.wav', },
    { src: 'soundbank/sb2/instruments/ElectricPiano_C4_22k.wav', },
    { src: 'soundbank/sb2/instruments/EnglishHorn(1)_D4_22k.wav', },
    { src: 'soundbank/sb2/instruments/EnglishHorn(1)_F3_22k.wav', },
    { src: 'soundbank/sb2/instruments/Flute(3)_B5(1)_22k.wav', },
    { src: 'soundbank/sb2/instruments/Flute(3)_B5(2)_22k.wav', },
    { src: 'soundbank/sb2/instruments/Marimba_C4_22k.wav', },
    { src: 'soundbank/sb2/instruments/MusicBox_C4_22k.wav', },
    { src: 'soundbank/sb2/instruments/Organ(2)_G2_22k.wav', },
    { src: 'soundbank/sb2/instruments/Pizz(2)_A3_22k.wav', },
    { src: 'soundbank/sb2/instruments/Pizz(2)_E4_22k.wav', },
    { src: 'soundbank/sb2/instruments/Pizz(2)_G2_22k.wav', },
    { src: 'soundbank/sb2/instruments/SteelDrum_D5_22k.wav', },
    { src: 'soundbank/sb2/instruments/SynthLead(6)_C4_22k.wav', },
    { src: 'soundbank/sb2/instruments/SynthLead(6)_C6_22k.wav', },
    { src: 'soundbank/sb2/instruments/SynthPad(2)_A3_22k.wav', },
    { src: 'soundbank/sb2/instruments/SynthPad(2)_C6_22k.wav', },
    { src: 'soundbank/sb2/instruments/TenorSax(1)_C3_22k.wav', },
    { src: 'soundbank/sb2/instruments/Trombone_B3_22k.wav', },
    { src: 'soundbank/sb2/instruments/Trumpet_E5_22k.wav', },
    { src: 'soundbank/sb2/instruments/Vibraphone_C3_22k.wav', },
    { src: 'soundbank/sb2/instruments/Violin(2)_D4_22K.wav', },
    { src: 'soundbank/sb2/instruments/Violin(3)_A4_22k.wav', },
    { src: 'soundbank/sb2/instruments/Violin(3b)_E5_22k.wav', },
    { src: 'soundbank/sb2/instruments/WoodenFlute_C5_22k.wav', },
    { src: 'soundbank/sb2/drums/BassDrum(1b)_22k.wav', },
    { src: 'soundbank/sb2/drums/Bongo_22k.wav', },
    { src: 'soundbank/sb2/drums/Cabasa(1)_22k.wav', },
    { src: 'soundbank/sb2/drums/Clap(1)_22k.wav', },
    { src: 'soundbank/sb2/drums/Claves(1)_22k.wav', },
    { src: 'soundbank/sb2/drums/Conga(1)_22k.wav', },
    { src: 'soundbank/sb2/drums/Cowbell(3)_22k.wav', },
    { src: 'soundbank/sb2/drums/Crash(2)_22k.wav', },
    { src: 'soundbank/sb2/drums/Cuica(2)_22k.wav', },
    { src: 'soundbank/sb2/drums/GuiroLong(1)_22k.wav', },
    { src: 'soundbank/sb2/drums/GuiroShort(1)_22k.wav', },
    { src: 'soundbank/sb2/drums/HiHatClosed(1)_22k.wav', },
    { src: 'soundbank/sb2/drums/HiHatOpen(2)_22k.wav', },
    { src: 'soundbank/sb2/drums/HiHatPedal(1)_22k.wav', },
    { src: 'soundbank/sb2/drums/Maracas(1)_22k.wav', },
    { src: 'soundbank/sb2/drums/SideStick(1)_22k.wav', },
    { src: 'soundbank/sb2/drums/SnareDrum(1)_22k.wav', },
    { src: 'soundbank/sb2/drums/Tambourine(3)_22k.wav', },
    { src: 'soundbank/sb2/drums/Tom(1)_22k.wav', },
    { src: 'soundbank/sb2/drums/Triangle(1)_22k.wav', },
    { src: 'soundbank/sb2/drums/Vibraslap(1)_22k.wav', },
    { src: 'soundbank/sb2/drums/WoodBlock(1)_22k.wav', },
    { src: 'fonts/Knewave-Regular.woff', },
    { src: 'fonts/Handlee-Regular.woff', },
    { src: 'fonts/Grand9K-Pixel.ttf', },
    { src: 'fonts/Griffy-Regular.woff', },
    { src: 'fonts/SourceSerifPro-Regular.woff', },
    { src: 'fonts/NotoSans-Regular.woff', },
  ], 'https://forkphorus.github.io/');

  class HTML extends Environment {
    async package() {
      const packagerData = await this.runtime.package(await this.projectData.asDataURL());
      return {
        data: packagerData,
        filename: 'project.html',
      };
    }
  }

  class Zip extends Environment {
    async package() {
      const zip = new JSZip();
      const packagerData = await this.runtime.package(await this.projectData.asFetchedFrom('project.zip'));
      zip.file('index.html', packagerData);
      zip.file('project.zip', this.projectData.blob);
      return {
        data: await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE'
        }),
        filename: 'project.zip',
      };
    }
  }

  /**
   * Convert a PNG to an Apple Icon Image (ICNS) file
   * @param {Blob} pngData PNG image data.
   */
  const pngToAppleICNS = async (pngData) => {
    const FORMATS = [
      { type: 'ic04', size: 16 },
      { type: 'ic07', size: 128 },
      { type: 'ic08', size: 256 },
      { type: 'ic09', size: 512 },
      { type: 'ic10', size: 1024 },
      { type: 'ic11', size: 32 },
      { type: 'ic12', size: 64 },
      { type: 'ic13', size: 256 },
      { type: 'ic14', size: 512 },
    ];

    // Read the Image.
    const url = URL.createObjectURL(pngData);
    const image = await loadImage(url);
    if (image.width !== image.height) {
      throw new Error('Image width and height do not match');
    }
    const size = image.width;

    // Determine the formats to create
    const eligibleFormats = FORMATS.filter((format) => {
      // Always include the smallest size so that tiny images will get at least 1 image.
      if (format.size === 16) {
        return true;
      }
      return size >= format.size;
    });

    // Create a single canvas to be used for conversion
    // Creating many canvases is prone to error in Safari
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('cannot get canvas rendering context');
    }

    const icns = new Icns.Icns();
    for (const format of eligibleFormats) {
      // Use the canvas to scale the image.
      const formatSize = format.size;
      canvas.width = formatSize;
      canvas.height = formatSize;
      ctx.drawImage(image, 0, 0, formatSize, formatSize);

      // Read the data off of the canvas
      const blob = await canvasToBlob(canvas);
      const arrayBuffer = await readAsArrayBuffer(blob);

      // The Icns library wants a Node Buffer, not an ArrayBuffer, so use the exposed Buffer to convert.
      const buffer = Icns.Buffer.from(arrayBuffer);
      const icnsImage = await Icns.IcnsImage.fromPNG(buffer, format.type);
      icns.append(icnsImage);
    }

    return icns.data;
  };

  class NWjs extends Environment {
    constructor({ platform, manifest, icon }) {
      super();
      try {
        this.manifest = JSON.parse(manifest);
      } catch (e) {
        throw new Error(`NW.js manifest is invalid JSON (${e}}`);
      }
      if (!isObject(this.manifest)) {
        throw new Error('NW.js manifest not an object');
      }
      if (typeof this.manifest.name !== 'string') {
        throw new Error('NW.js manifest is missing or has incorrect type for field: name');
      }
      if (/[\/\\]/g.test(this.manifest.name)) {
        throw new Error('NW.js manifest name contains invalid characters');
      }
      if (typeof this.manifest.main !== 'string') {
        throw new Error('NW.js manifest is missing or has incorrect type for field: main');
      }
      if (!isObject(this.manifest.window)) {
        throw new Error('NW.js manifest is missing or has incorrect type for field: window');
      }
      if (typeof this.manifest.window.icon !== 'string') {
        throw new Error('NW.js manifest is missing or has incorrect type for field: window.icon');
      }
      this.platform = platform;
      this.icon = icon;
    }
    async package() {
      const isWindows = this.platform === 'win64';
      const isMac = this.platform === 'mac';
      if (!(isWindows || isMac)) {
        throw new Error('invalid platform');
      }

      const packagerData = await this.runtime.package(await this.projectData.asFetchedFrom('project.zip'));

      const nwjsData = await fetchManifestAsset(`nwjs-${this.platform}`, (progress) => {
        this.progressTarget.dispatchEvent(new CustomEvent('nwjs-progress', {
          detail: progress
        }));
      });
      const nwjsZip = await JSZip.loadAsync(nwjsData);
      // NW.js Windows folder structure:
      // * (root)
      // +-- nwjs-v0.49.0-win-x64
      //   +-- nw.exe (executable)
      //   +-- credits.html
      //   +-- (project data)
      //
      // NW.js macOS folder structure:
      // * (root)
      // +-- nwjs-v0.49.0-osx-64
      //   +-- credits.html
      //   +-- nwjs.app
      //     +-- Contents
      //       +-- Resources
      //         +-- app.icns (icon)
      //         +-- app.nw
      //           +-- (project data)
      //       +-- MacOS
      //         +-- nwjs (executable)
      //       +-- ...

      // the first folder, something like "nwjs-v0.49.0-win-64"
      const nwjsPrefix = Object.keys(nwjsZip.files)[0].split('/')[0];

      // constructor checks to make this is reasonably safe
      const appName = this.manifest.name;

      const zip = new JSZip();
      for (const path of Object.keys(nwjsZip.files)) {
        const file = nwjsZip.files[path];

        let newPath = path.replace(nwjsPrefix, appName);

        if (isMac) {
          newPath = newPath.replace('nwjs.app', `${appName}.app`);
        } else if (isWindows) {
          newPath = newPath.replace('nw.exe', `${appName}.exe`);
        }

        // This internal hackery improves performance.
        // Without this, generating the zip would take a very long time.
        zip.files[newPath] = file;
      }

      let dataPrefix;
      if (isMac) {
        const icnsData = await pngToAppleICNS(this.icon);
        zip.file(`${appName}/${appName}.app/Contents/Resources/app.icns`, icnsData);
        dataPrefix = `${appName}/${appName}.app/Contents/Resources/app.nw/`;
      } else {
        dataPrefix = `${appName}/`;
      }

      zip.file(dataPrefix + this.manifest.main, packagerData);
      zip.file(dataPrefix + 'project.zip', this.projectData.blob);
      zip.file(dataPrefix + this.manifest.window.icon, this.icon);
      zip.file(dataPrefix + 'package.json', JSON.stringify(this.manifest));

      return {
        data: await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          // Use UNIX permissions so that executable bits are properly set, which matters for macOS
          platform: 'UNIX',
        }),
        filename: `${appName}.zip`,
      };
    }
  }

  return {
    Project,
    runtimes: {
      TurboWarp,
      Forkphorus,
    },
    environments: {
      HTML,
      Zip,
      NWjs,
    },
  };
}());
