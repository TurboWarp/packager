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

export class Packager extends EventTarget {
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
    if (this.options.target === 'zip') {
      const zip = await (await getJSZip()).loadAsync(serialized);
      for (const file of Object.keys(zip.files)) {
        zip.files[`assets/${file}`] = zip.files[file];
        delete zip.files[file];
      }
      zip.file('index.html', html);
      return {
        blob: await zip.generateAsync({
          type: 'blob'
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
  chunks: {
    gamepad: false
  },
  cloudVariables: {
    mode: 'ws',
    id: 0,
    custom: {}
  }
});

export default Packager;
