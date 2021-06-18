import fetchLargeAsset from './large-assets';
import defaultIcon from './default-icon.png';

const readAsURL = (buffer) => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(fr.result);
  fr.onerror = () => reject(new Error('Cannot read as URL'));
  fr.readAsDataURL(buffer);
});

const getJSZip = async () => {
  const {JSZip} = await import('./large-dependencies');
  return JSZip;
};

const setFileFast = (zip, path, data) => {
  zip.files[path] = data;
};

const getIcon = async (icon) => {
  if (!icon) {
    const res = await fetch(defaultIcon);
    return {
      data: res.arrayBuffer(),
      name: 'icon.png'
    };
  }
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve({
      data: fr.result,
      name: icon.name || 'icon.png'
    });
    fr.onerror = () => reject(new Error('Cannot read as array buffer'));
    fr.readAsArrayBuffer(icon);
  });
};

const addNwJS = async (projectZip, packagerOptions) => {
  const nwjsBuffer = await fetchLargeAsset('nwjs-win64');
  const nwjsZip = await (await getJSZip()).loadAsync(nwjsBuffer);

  const isMac = false;
  const isWindows = true;

  // NW.js Windows folder structure:
  // * (root)
  // +-- nwjs-v0.49.0-win-x64
  //   +-- nw.exe (executable)
  //   +-- credits.html
  //   +-- (project data)
  //   +-- ...

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

  const zip = new (await getJSZip());

  const packageName = packagerOptions.app.packageName;

  // Copy NW.js files to the right place
  for (const path of Object.keys(nwjsZip.files)) {
    const file = nwjsZip.files[path];

    let newPath = path.replace(nwjsPrefix, packageName);
    if (isMac) {
      newPath = newPath.replace('nwjs.app', `${packageName}.app`);
    } else if (isWindows) {
      newPath = newPath.replace('nw.exe', `${packageName}.exe`);
    }

    setFileFast(zip, newPath, file);
  }

  let dataPrefix;
  if (isMac) {
    const icnsData = await pngToAppleICNS(this.icon);
    zip.file(`${packageName}/${packageName}.app/Contents/Resources/app.icns`, icnsData);
    dataPrefix = `${packageName}/${packageName}.app/Contents/Resources/app.nw/`;
  } else {
    dataPrefix = `${packageName}/`;
  }

  // Copy project files to the right place
  for (const path of Object.keys(projectZip.files)) {
    setFileFast(zip, dataPrefix + path, projectZip.files[path]);
  }  

  const icon = await getIcon(packagerOptions.app.icon);
  const manifest = {
    name: packageName,
    main: 'index.html',
    window: {
      width: packagerOptions.stageWidth,
      height: packagerOptions.stageHeight,
      icon: icon.name
    }
  };
  zip.file(dataPrefix + icon.name, icon.data);
  zip.file(dataPrefix + 'package.json', JSON.stringify(manifest, null, 4));

  return zip;
};

class Packager extends EventTarget {
  constructor () {
    super();
    this.vm = null;
    this.options = Packager.DEFAULT_OPTIONS();
  }

  child () {
    const packager = new Packager();
    packager.options = Object.assign({}, this.options);
    packager.vm = this.vm;
    return packager;
  }

  async loadResources () {
    const chunks = [
      fetch('scaffolding.js')
    ];
    if (this.options.chunks.gamepad) {
      chunks.push(fetch('addons.js'))
    }
    const requests = await Promise.all(chunks);
    if (!requests.every(i => i.ok)) {
      throw new Error('Resource loading failed');
    }
    const texts = await Promise.all(requests.map(i => i.text()));
    this.script = texts.join('\n').replace(/<\/script>/g,"</scri'+'pt>");
  }

  makeWebSocketProvider () {
    return `new Scaffolding.Cloud.WebSocketProvider("wss://clouddata.turbowarp.org", "${this.options.projectId}")`;
  }

  makeLocalStorageProvider () {
    return `new Scaffolding.Cloud.LocalStorageProvider()`;
  }

  makeCustomProvider () {
    const variables = this.options.cloudVariables.custom;
    let result = '{const providers = {};\n';
    for (const provider of new Set(Object.values(variables))) {
      if (provider === 'ws') {
        result += `providers.ws = ${this.makeWebSocketProvider()};\n`;
      } else if (provider === 'local') {
        result += `providers.local = ${this.makeLocalStorageProvider()};\n`;
      }
    }
    result += 'for (const provider of Object.values(providers)) scaffolding.addCloudProvider(provider);\n';
    for (const variableName of Object.keys(variables)) {
      const providerToUse = variables[variableName];
      result += `scaffolding.addCloudProviderOverride(${JSON.stringify(variableName)}, providers[${JSON.stringify(providerToUse)}] || null);\n`;
    }
    result += '}';
    return result;
  }

  async package () {
    await this.loadResources();
    const serialized = await this.vm.saveProjectSb3();
    const html = `<!DOCTYPE html>
<!-- -->
<html>
<head>
  <meta charset="utf8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * data: blob:">
  <title>Packaged Project</title>
  <style>
    body {
      background-color: black;
      color: white;
      font-family: sans-serif;
      overflow: hidden;
    }
    [hidden] {
      display: none !important;
    }
    h1 {
      font-weight: normal;
    }
    a {
      color: inherit;
      text-decoration: underline;
      cursor: pointer;
    }

    #app, #loading, #error, #launch {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    .screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      cursor: default;
      user-select: none;
      background-color: black;
    }
    #launch {
      background-color: rgba(0, 0, 0, 0.7);
      cursor: pointer;
    }
    .green-flag {
      width: 80px;
      height: 80px;
      padding: 16px;
      border-radius: 100%;
      background: rgba(255, 255, 255, 0.75);
      border: 3px solid hsla(0, 100%, 100%, 1);
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
    }
    .progress-bar-outer {
      border: 1px solid currentColor;
      height: 10px;
      width: 200px;
      max-width: 200px;
    }
    .progress-bar-inner {
      height: 100%;
      width: 0;
      background-color: currentColor;
    }
  </style>
</head>
<body>
  <noscript>Enable JavaScript</noscript>

  <div id="app"></div>

  <div id="launch" class="screen" hidden title="Click to start" tabindex="0">
    <div class="green-flag">
      <svg viewBox="0 0 16.63 17.5" width="42" height="44">
        <defs><style>.cls-1,.cls-2{fill:#4cbf56;stroke:#45993d;stroke-linecap:round;stroke-linejoin:round;}.cls-2{stroke-width:1.5px;}</style></defs>
        <path class="cls-1" d="M.75,2A6.44,6.44,0,0,1,8.44,2h0a6.44,6.44,0,0,0,7.69,0V12.4a6.44,6.44,0,0,1-7.69,0h0a6.44,6.44,0,0,0-7.69,0"/>
        <line class="cls-2" x1="0.75" y1="16.75" x2="0.75" y2="0.75"/>
      </svg>
    </div>
  </div>

  <div id="loading" class="screen">
    <div class="progress-bar-outer"><div class="progress-bar-inner" id="loading-inner"></div></div>
  </div>

  <div id="error" class="screen" hidden>
    <h1>Error</h1>
    <p>See console for more information</p>
  </div>

  <script>${this.script}</script>
  <script>
    const appElement = document.getElementById('app');
    const launchScreen = document.getElementById('launch');
    const loadingScreen = document.getElementById('loading');
    const loadingInner = document.getElementById('loading-inner');
    const errorScreen = document.getElementById('error');

    const scaffolding = new Scaffolding.Scaffolding();
    scaffolding.width = ${this.options.stageWidth};
    scaffolding.height = ${this.options.stageHeight};
    scaffolding.setup();
    scaffolding.appendTo(appElement);

    if (typeof ScaffoldingAddons !== "undefined") ScaffoldingAddons.run(scaffolding);

    const {storage, vm} = scaffolding;
    storage.addWebStore(
      [storage.AssetType.ImageVector, storage.AssetType.ImageBitmap, storage.AssetType.Sound],
      (asset) => new URL("./assets/" + asset.assetId + "." + asset.dataFormat, location).href
    );
    const setProgress = (progress) => {
      loadingInner.style.width = progress * 100 + "%";
    }
    storage.onprogress = (total, loaded) => {
      setProgress(0.2 + (loaded / total) * 0.8);
    };
    setProgress(0.1);

    scaffolding.setUsername("123");

    ${this.options.cloudVariables.mode === 'ws' ?
      `scaffolding.addCloudProvider(${this.makeWebSocketProvider()})` :
      this.options.cloudVariables.mode === 'local' ?
      `scaffolding.addCloudProvider(${this.makeLocalStorageProvider()})` :
      this.options.cloudVariables.mode === 'custom' ?
      this.makeCustomProvider() :
      '/* no-op */'
    };

    vm.setTurboMode(${this.options.turbo});
    vm.setInterpolation(${this.options.interpolation});
    vm.setFramerate(${this.options.framerate});
    vm.renderer.setUseHighQualityRender(${this.options.highQualityPen});
    vm.setRuntimeOptions({
      fencing: ${this.options.fencing},
      miscLimits: ${this.options.miscLimits},
      maxClones: ${this.options.maxClones},
    });
    vm.setCompilerOptions({});

    const getProjectJSON = async () => {
      const res = await fetch(${JSON.stringify(
        this.options.target === 'html' ? await readAsURL(serialized) : './assets/project.json'
      )});
      return res.arrayBuffer();
    };

    const run = async () => {
      const projectJSON = await getProjectJSON();
      setProgress(0.1);
      await scaffolding.loadProject(projectJSON);
      setProgress(1);
      loadingScreen.hidden = true;
      if (${this.options.autoplay}) {
        scaffolding.start();
      } else {
        launchScreen.hidden = false;
        launchScreen.addEventListener('click', () => {
          launchScreen.hidden = true;
          scaffolding.start();
        });
        launchScreen.focus();
      }
    };

    const handleError = (error) => {
      console.error(error);
      errorScreen.hidden = false;
    };

    run().catch(handleError);

  </script>
</body>
</html>
`;

    if (this.options.target !== 'html') {
      let zip = await (await getJSZip()).loadAsync(serialized);
      for (const file of Object.keys(zip.files)) {
        zip.files[`assets/${file}`] = zip.files[file];
        delete zip.files[file];
      }
      zip.file('index.html', html);

      if (this.options.target === 'nwjs-win64') {
        zip = await addNwJS(zip, this.options);
      }

      return {
        blob: await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE'
        }),
        filename: 'project.zip'
      };
    }
    return {
      blob: new Blob([html], {
        type: 'text/html'
      }),
      filename: 'project.html'
    };
  }
}

Packager.DEFAULT_OPTIONS = () => ({
  turbo: false,
  interpolation: false,
  framerate: 30,
  highQualityPen: false,
  maxClones: 300,
  fencing: true,
  miscLimits: true,
  stageWidth: 480,
  stageHeight: 360,
  autoplay: false,
  target: 'html',
  app: {
    icon: null,
    packageName: 'p4-project'
  },
  chunks: {
    gamepad: false
  },
  cloudVariables: {
    mode: 'ws',
    id: 0,
    custom: {}
  }
});

export {
  Packager
};
