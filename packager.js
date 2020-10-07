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
  const runtimes = Object.create(null);
  const environments = Object.create(null);

  const readAsDataURL = (blob) => {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject('could not read');
      fr.readAsDataURL(blob);
    });
  };

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

  runtimes.turbowarp = {
    async package({projectSource}) {
      const res = await fetch('_tw.js');
      const text = await res.text();
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
  window.__PROJECT_DATA__ = "${projectSource}";
  </script>
  <script>
  ${text.replace(/<\/script>/g,"</scri'+'pt>")}
  </script>
</body>

</html>`;
    }
  };

  runtimes.forkphorus = {
    scriptLoader: new ScriptOrStyleLoader([
      { type: 'script', src: 'lib/scratch-sb1-converter.js', },
      { type: 'script', src: 'lib/canvg.min.js', },
      { type: 'script', src: 'lib/fontfaceobserver.standalone.js', },
      { type: 'script', src: 'lib/jszip.min.js', },
      { type: 'script', src: 'lib/rgbcolor.js', },
      { type: 'script', src: 'lib/stackblur.min.js', },
      { type: 'script', src: 'phosphorus.dist.js', inlineSources: ['icons.svg'] },  
    ], 'forkphorus/'),
    styleLoader: new ScriptOrStyleLoader([
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
    ], 'forkphorus/'),
    assetLoader: new AssetLoader([
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
    ], 'forkphorus/'),
    async package(projectSource) {
      const [ scripts, styles, assets ] = await Promise.all([
        runtimes.forkphorus.scriptLoader.load(),
        runtimes.forkphorus.styleLoader.load(),
        runtimes.forkphorus.assetLoader.load(),
      ]);
      const assetManagerData = '{' + assets.map((asset) => `"${asset.src}": "${asset.data}"`).join(', ') + '}';
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
      ${O.forkphorus.loadingScreenText ? `<h1>${O.forkphorus.loadingScreenText}</h1>` : ''}
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
      this.data = ${assetManagerData};
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
  var type = 'sb3';
  // Project data...
  // Attribution Notice:
  var project = '${projectSource}';

  // Player options...
  var playerOptions = ${JSON.stringify(O.forkphorus.playerOptions)};
  // Controls options...
  var controlsOptions = {};

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

  environments.html = {
    async package(runtime, projectData) {
      const packagerData = await runtime.package(await readAsDataURL(projectData));
      return {
        data: packagerData,
        filename: 'project.html',
      };
    }
  };

  environments.zip = {
    async package(runtime, projectData) {
      const zip = new JSZip();
      const packagerData = await runtime.package('project.zip');
      zip.file('index.html', packagerData);
      zip.file('project.zip', projectData);
      return {
        data: await zip.generateAsync({
          type: 'arraybuffer',
          compression: 'DEFLATE'
        }),
        filename: 'project.zip',
      };
    }
  };

  return {
    runtimes,
    environments,
  }
}());
