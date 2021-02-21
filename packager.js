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

  class TurboWarp extends Runtime {
    constructor(options) {
      super();
      this.options = options;
    }
    async getJS () {
      const res = await fetch('https://packagerdata.turbowarp.org/packager.4ad979aa88298563f439.js');
      const src = await res.text();
      return src;
    }
    async package(projectReference) {
      const stringify = (v) => {
        if (typeof v === 'undefined') {
          throw new Error('undefined value');
        }
        return JSON.stringify(v);
      };
      const script = await this.getJS();
      // While this project is generally licensed under the GPLv3.0, the following text is an exception.
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
  window.__PACKAGER__ = {
    projectData: ${stringify(projectReference.data)},
    id: ${stringify(this.options.projectId)},
    username: ${stringify(this.options.username)},
    handleVmInit: function (vm) {
      vm.setCompilerOptions(${stringify(this.options.compilerOptions)});
      vm.setFramerate(${stringify(this.options.framerate)});
      if (${stringify(this.options.highQualityPen)}) vm.renderer.setUseHighQualityRender(true);
      if (${stringify(this.options.turbo)}) vm.setTurboMode(true);
    },
    stageWidth: 480, // TODO
    stageHeight: 360, // TODO
    noControls: false, // TODO
  };
  </script>
  <script>
  ${script.replace(/<\/script>/g,"</scri'+'pt>")}
  </script>
</body>

</html>`;
    }
  }

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
      TurboWarp
    },
    environments: {
      HTML,
      Zip,
      NWjs,
    },
  };
}());
