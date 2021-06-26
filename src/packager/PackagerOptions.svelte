<script>
  import {slide, fade} from 'svelte/transition';
  import Section from './Section.svelte';
  import Button from './Button.svelte';
  import Packager from './packager';
  import writablePersistentStore from './persistent-store';
  import {error, progress} from './stores';
  import Preview from './preview';
  import deepClone from './lib/deep-clone';
  import assetCache from './cache';
  import analytics from './analytics';

  export let projectData;

  // JSON can't easily parse Infinity, so we'll just store large numbers instead
  const ALMOST_INFINITY = 9999999999;

  const cloudVariables = Object.values(projectData.project.analysis.stageVariables)
    .filter(i => i.isCloud)
    .map(i => i.name);
  const canUseCloudVariableServer = !!projectData.projectId;

  const defaultOptions = Packager.DEFAULT_OPTIONS();
  defaultOptions.projectId = projectData.projectId;
  if (!canUseCloudVariableServer) {
    defaultOptions.cloudVariables.mode = 'local';
  }
  for (const variable of cloudVariables) {
    defaultOptions.cloudVariables.custom[variable] = canUseCloudVariableServer ? 'ws' : 'local';
  }
  defaultOptions.app.packageName = Packager.getDefaultPackageNameFromTitle(projectData.title);
  defaultOptions.app.windowTitle = Packager.getWindowTitleFromProjectTitle(projectData.title);
  const options = writablePersistentStore(`PackagerOptions.${projectData.uniqueId}`, defaultOptions);

  let result = null;
  let url = null;
  let previewer = null;
  let iconFiles = null;
  $: $options.app.icon = iconFiles ? iconFiles[0] : null;
  $: if (previewer) {
    previewer.setProgress($progress.progress, $progress.text);
  }

  const handleLargeAssetFetchProgress = ({detail}) => {
    if (detail.asset.startsWith('nwjs-')) {
      $progress.text = 'Loading NW.js';
    } else if (detail.asset === 'scaffolding') {
      $progress.text = 'Loading TurboWarp';
    } else if (detail.asset === 'addons') {
      $progress.text = 'Loading addons';
    } else {
      $progress.text = `Loading large asset ${detail.asset}`
    }
    $progress.progress = detail.progress;
  };

  const handleZipProgress = ({detail}) => {
    $progress.text = 'Compressing project';
    $progress.progress = detail.progress;
  };

  const downloadURL = (filename, url) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const runPackager = async (options) => {
    try {
      const packager = new Packager();
      packager.options = options;
      packager.project = projectData.project;

      $progress.visible = true;
      $progress.text = 'Packaging project';

      if (url) {
        URL.revokeObjectURL(url);
      }
      result = null;
      url = null;

      packager.addEventListener('large-asset-fetch', handleLargeAssetFetchProgress);
      packager.addEventListener('zip-progress', handleZipProgress);

      result = await packager.package();
      url = URL.createObjectURL(result.blob);
    } catch (e) {
      $error = e;
    }
    progress.reset();
  };

  const pack = async () => {
    await runPackager(deepClone($options));
    if (result) {
      downloadURL(result.filename, url);
    }
    analytics.sendEvent('Package');
  };

  const preview = async () => {
    previewer = new Preview();
    const optionsClone = deepClone($options);
    optionsClone.target = 'html';
    await runPackager(optionsClone);
    if (result) {
      previewer.setContent(result.blob);
    } else {
      previewer.close();
    }
    previewer = null;
    analytics.sendEvent('Preview');
  };

  const reset = async () => {
    if (confirm('Reset all settings to defaults and reload?')) {
      try {
        await assetCache.resetAll();
      } catch (e) {
        console.warn(e);
      }
      localStorage.clear();
      location.reload();
    }
  };
</script>

<style>
  label {
    display: block;
    margin-bottom: 4px;
  }
  input[type=number] {
    width: 60px;
  }
  input[type=text] {
    width: 150px;
  }
  textarea {
    display: block;
    height: 200px;
    width: 100%;
    box-sizing: border-box;
  }
  .environment-section {
    margin-bottom: 12px;
  }
  .downloads {
    text-align: center;
  }
</style>

<Section accent="#FFAB19">
  <h2>Runtime Options</h2>

  <!-- TODO: this is not ideal, the help should be in here -->
  <!-- especially as not all of these options are actually in advanced settings on the main site -->
  <p>See the advanced settings menu in <a href="https://turbowarp.org/">TurboWarp</a> for more information about some of these settings.</p>

  <label>
    <input type="checkbox" bind:checked={$options.turbo}>
    Turbo Mode
  </label>
  <label>
    Framerate
    <input type="number" min="0" max="240" bind:value={$options.framerate}>
  </label>
  <label>
    <input type="checkbox" bind:checked={$options.interpolation}>
    Interpolation
  </label>
  <label>
    <input type="checkbox" bind:checked={$options.highQualityPen}>
    High Quality Pen
  </label>
  <label>
    <input type="checkbox" checked={$options.maxClones === ALMOST_INFINITY} on:change={(e) => {
      $options.maxClones = e.target.checked ? ALMOST_INFINITY : 300;
    }}>
    Infinite Clones
  </label>
  <label>
    <input type="checkbox" checked={!$options.fencing} on:change={(e) => {
      $options.fencing = !e.target.checked;
    }}>
    Remove Fencing
  </label>
  <label>
    <input type="checkbox" checked={!$options.miscLimits} on:change={(e) => {
      $options.miscLimits = !e.target.checked;
    }}>
    Remove Miscellanous Limits
  </label>
  <label>
    Stage Size
    <input type="number" min="0" max="4096" step="1" bind:value={$options.stageWidth}>
    &times;
    <input type="number" min="0" max="4096" step="1" bind:value={$options.stageHeight}>
  </label>
  <label>
    Username (each "#" gets replaced with a random number)
    <input type="text" bind:value={$options.username}>
  </label>
  <label>
    <input type="checkbox" bind:checked={$options.autoplay}>
    Autoplay
  </label>
</Section>

<Section accent="#9966FF">
  <h2>Player Options</h2>

  <label>
    Page Title
    <input type="text" bind:value={$options.app.windowTitle}>
  </label>
  <label>
    Loading Screen Text
    <input type="text" bind:value={$options.loadingScreen.text} placeholder="(Nothing)">
  </label>
  <label>
    Icon
    <input type="file" bind:files={iconFiles} accept=".png">
  </label>

  <h3>Controls</h3>
  <label>
    <input type="checkbox" bind:checked={$options.controls.greenFlag.enabled}>
    Show green flag button in controls
  </label>
  <label>
    <input type="checkbox" bind:checked={$options.controls.stopAll.enabled}>
    Show stop sign button in controls
  </label>
  <label>
    <input type="checkbox" bind:checked={$options.controls.fullscreen.enabled}>
    Show fullscreen button in controls
  </label>
  {#if $options.controls.greenFlag.enabled || $options.controls.stopAll.enabled}
    <label transition:slide|local>
      <input type="color" bind:value={$options.appearance.accent}>
      Accent color (background color of controls when active or hovered)
    </label>
  {/if}
  <p>If all controls are disabled, the controls bar is removed entirely. If only fullscreen is enabled, it will always be located in the top left corner, not in the controls header.</p>

  <h3>Colors</h3>
  <label>
    <input type="color" bind:value={$options.appearance.background}>
    Background color
  </label>
  <label>
    <input type="color" bind:value={$options.appearance.foreground}>
    Foreground color (progress bar, some icons, some text)
  </label>

  <h3>Addons</h3>
  <label>
    <input type="checkbox" bind:checked={$options.chunks.gamepad}>
    Gamepad support addon (no settings button or modal for now)
  </label>
</Section>

{#if cloudVariables.length > 0}
  <Section accent="#FF8C1A">
    <h2>Cloud Variables</h2>
    <label>
      Mode
      <select bind:value={$options.cloudVariables.mode}>
        {#if canUseCloudVariableServer}
          <option value="ws">Connect to cloud variable server</option>
        {:else}
          <option disabled>Can not use cloud variable server on this project</option>
        {/if}
        <option value="local">Store in local storage</option>
        <option value="">Ignore</option>
        <option value="custom">Advanced</option>
      </select>
    </label>
    {#if $options.cloudVariables.mode === "custom"}
      <div transition:slide|local>
        {#each cloudVariables as variable}
          <label>
            <select bind:value={$options.cloudVariables.custom[variable]}>
              {#if canUseCloudVariableServer}
                <option value="ws">Connect to cloud variable server</option>
              {:else}
                <option disabled>Can not use cloud variable server on this project</option>
              {/if}
              <option value="local">Store in local storage</option>
              <option value="">Ignore</option>
            </select>
            {variable}
          </label>
        {/each}
      </div>
    {/if}
    <p>"Connect to cloud variable server" uses TurboWarp's cloud variable server to sync the variables with other users. Can not be used on projects loaded from files.</p>
    <p>"Store in local storage" stores the variables on the user's computer and restores them when the project is restarted.</p>
    <p>"Ignore" treats cloud variables like normal variables.</p>
    <p>"Advanced" uses a different mode for each variable, so some variables can sync with other users but others can be stored locally, for example.</p>
  </Section>
{/if}

<Section accent="#FF6680">
  <h2>Advanced Options</h2>
  <details>
    <summary>You probably don't want to change these. (Click to open)</summary>
    <label>
      <input type="checkbox" bind:checked={$options.compiler.enabled}>
      Enable compiler
    </label>
    <label>
      <input type="checkbox" bind:checked={$options.compiler.warpTimer}>
      Warp Timer
    </label>
    <label>
      Custom JS (Don't change if you don't know what you're doing!)
      <textarea bind:value={$options.custom.js}></textarea>
    </label>
  </details>
</Section>

<Section accent="#0FBD8C">
  <h2>Environment</h2>
  <div class="environment-section">
    <label>
      <input type="radio" bind:group={$options.target} value="html">
      Plain HTML (standalone, works anywhere)
    </label>
  </div>
  <div class="environment-section">
    <label>
      <input type="radio" bind:group={$options.target} value="zip">
      Zip, each asset in separate file (ideal for websites)
    </label>
    <label>
      <input type="radio" bind:group={$options.target} value="zip-one-asset">
      Zip, combine assets into single file (not recommended)
    </label>
  </div>
  <div class="environment-section">
    <label>
      <input type="radio" bind:group={$options.target} value="nwjs-win32">
      NW.js Windows executable (32-bit or 64-bit)
    </label>
    <label>
      <input type="radio" bind:group={$options.target} value="nwjs-win64">
      NW.js Windows executable (64-bit only, not recommended)
    </label>
    <label>
      <input type="radio" bind:group={$options.target} value="nwjs-mac">
      NW.js macOS application (Beta)
    </label>
    <label>
      <input type="radio" bind:group={$options.target} value="nwjs-linux-x64">
      NW.js Linux application (64-bit only) (Beta)
    </label>
  </div>
</Section>

{#if $options.target.startsWith('nwjs-')}
  <div transition:fade|local>
    <Section accent="#FF661A">
      <h2>NW.js</h2>
      <label>
        Package Name
        <input type="text" bind:value={$options.app.packageName}>
      </label>

      {#if $options.target.startsWith('nwjs-win')}
        <div>
          <h2>Further steps for Windows</h2>
          <p>To change the icon of the executable and generate installers, see <a href="https://docs.nwjs.io/en/latest/For%20Users/Package%20and%20Distribute/#windows">NW.js Documentation</a>.</p>
        </div>
      {:else if $options.target === 'nwjs-mac'}
        <h2>Further steps for macOS</h2>
        <p>macOS support is still experimental.</p>
        <p>Due to Apple policy, packaging for their platforms is rather troublesome. You either have to:</p>
        <ul>
          <li>Pay Apple $100/year for a developer account to sign and notarize the app (we do not have a tutorial for this as we can't afford that and don't want to support such practices), or</li>
          <li>Instruct users to ignore Gatekeeper by opening Finder > Navigating to the application > Right click > Open > Open again</li>
        </ul>
        <p>NW.js runs natively on Intel Macs but will use Rosetta on Apple silicon Macs.</p>
        <p>For further help and steps, see <a href="https://docs.nwjs.io/en/latest/For%20Users/Package%20and%20Distribute/#mac-os-x">NW.js Documentation</a>.</p>
      {:else if $options.target.startsWith('nwjs-linux')}
        <h2>Further steps for Linux</h2>
        <p>Linux support is still experimental.</p>
        <p>For further help and steps, see <a href="https://docs.nwjs.io/en/latest/For%20Users/Package%20and%20Distribute/#linux">NW.js Documentation</a>.</p>
      {/if}
    </Section>
  </div>
{/if}

<Section>
  <Button on:click={pack} disabled={$progress.visible}>Package</Button>
  <Button on:click={preview} disabled={$progress.visible} secondary>Preview</Button>
  <Button on:click={reset} danger>Reset</Button>
</Section>

{#if result && url}
  <Section>
    <div class="downloads">
      <a href={url} download={result.filename}>Download {result.filename} ({(result.blob.size / 1024 / 1024).toFixed(2)}MiB)</a>
    </div>
  </Section>
{:else if !$progress.visible}
  <Section caption>
    <p>Downloads will appear here</p>
  </Section>
{/if}
