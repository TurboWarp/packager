import downloadProject from './downloader';

const readAsDataURL = (buffer) => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(fr.result);
  fr.onerror = () => reject(new Error('Cannot read as URL'));
  fr.readAsDataURL(buffer);
});

export class Packager {
  constructor () {
    this.projectSource = null;

    this.turbo = false;
    this.interpolation = false;
    this.framerate = 30;
    this.highQualityPen = false;
    this.maxClones = 300;
    this.fencing = true;
    this.miscLimits = true;
    this.stageWidth = 480;
    this.stageHeight = 360;
    this.autoplay = false;
  }

  async loadProjectById (id) {
    const project = await downloadProject(id);
    const blob = await project.asBlob();
    this.projectSource = blob;
  }

  async loadProjectFromFile (blob) {
    this.projectSource = blob;
  }

  async loadResources () {
    const requests = await Promise.all([
      fetch('scaffolding.js'),
      fetch('addons.js')
    ]);
    if (!requests.every(i => i.ok)) {
      throw new Error('Resource loading failed');
    }
    const texts = await Promise.all(requests.map(i => i.text()));
    this.script = texts.join('\n').replace(/<\/script>/g,"</scri'+'pt>");
  }

  async package () {
    return `<!DOCTYPE html>
<!-- -->
<html>
<head>
  <meta charset="utf8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
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
      <svg viewBox="0 0 16.63 17.5">
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

    scaffolding.width = ${JSON.stringify(this.stageWidth)};
    scaffolding.height = ${JSON.stringify(this.stageHeight)};

    scaffolding.setup();
    scaffolding.appendTo(appElement);
    ScaffoldingAddons.run(scaffolding);

    const {storage, vm} = scaffolding;
    const setProgress = (progress) => {
      loadingInner.style.width = progress * 100 + "%";
    }
    storage.onprogress = (total, loaded) => {
      setProgress(0.2 + (loaded / total) * 0.8)
    };

    vm.setTurboMode(${JSON.stringify(this.turbo)});
    vm.setInterpolation(${JSON.stringify(this.interpolation)});
    vm.setFramerate(${JSON.stringify(this.framerate)});
    vm.renderer.setUseHighQualityRender(${JSON.stringify(this.highQualityPen)});
    vm.setRuntimeOptions({
      fencing: ${JSON.stringify(this.fencing)},
      miscLimits: ${JSON.stringify(this.miscLimits)},
      maxClones: ${JSON.stringify(this.maxClones)},
    });
    vm.setCompilerOptions({

    });

    setProgress(0.1);

    const getProjectJSON = async () => {
      const res = await fetch(${JSON.stringify(await readAsDataURL(this.projectSource))});
      return res.arrayBuffer();
    };

    const run = async () => {
      const projectJSON = await getProjectJSON();
      setProgress(0.1);
      await scaffolding.loadProject(projectJSON);
      setProgress(1);
      loadingScreen.hidden = true;
      if (${JSON.stringify(this.autoplay)}) {
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
  }
}

export default Packager;
