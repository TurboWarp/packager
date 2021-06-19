<script>
  import {slide, fade} from 'svelte/transition';
  import Section from './Section.svelte';
  import Button from './Button.svelte';
  import Packager from './packager';
  import writablePersistentStore from './persistent-store';
  import {error, progress} from './stores';
  import Preview from './preview';

  export let projectData;

  // JSON can't easily parse Infinity, so we'll just store large numbers instead
  const ALMOST_INFINITY = 9999999999;

  const packager = new Packager();
  packager.vm = projectData.vm;
  packager.serialized = projectData.serialized;

  const cloudVariables = Object.values(projectData.vm.runtime.getTargetForStage().variables)
    .filter(i => i.isCloud)
    .map(i => i.name);
  const canUseCloudVariableServer = !!projectData.projectId;

  packager.options.projectId = projectData.projectId;
  if (!canUseCloudVariableServer) {
    packager.options.cloudVariables.mode = 'local';
  }
  for (const variable of cloudVariables) {
    packager.options.cloudVariables.custom[variable] = canUseCloudVariableServer ? 'ws' : 'local';
  }
  packager.options.app.packageName = Packager.getDefaultPackageNameFromTitle(projectData.title);
  packager.options.app.windowTitle = Packager.getWindowTitleFromProjectTitle(projectData.title);

  const options = writablePersistentStore(`PackagerOptions.${projectData.uniqueId}`, packager.options);
  $: packager.options = $options;

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

  const runPackager = async (packager) => {
    try {
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
    await runPackager(packager.child());
    if (result) {
      downloadURL(result.filename, url);
    }
  };

  const preview = async () => {
    previewer = new Preview();
    const child = packager.child();
    child.options.target = 'html';
    await runPackager(child);
    if (result) {
      previewer.setContent(result.blob);
    } else {
      previewer.close();
    }
    previewer = null;
  };

  const reset = () => {
    if (confirm('Reset all settings to defaults and reload?')) {
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
  <p>If all controls are disabled, there will be no controls at all. If only fullscreen is enabled, it will be displayed as its own button always in the top left corner, not in a header above the player.</p>

  <h3>Colors</h3>
  <label>
    <input type="color" bind:value={$options.appearance.background}>
    Background color
  </label>
  <label>
    <input type="color" bind:value={$options.appearance.foreground}>
    Progress bar color
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
    <p>"Connect to cloud variable server" will use TurboWarp's cloud variable server to sync the variables with other users. This is the default behavior. It can not be used on projects packaged from files.</p>
    <p>"Store in local storage" stores the variables on the user's computer and restores them when the project is restarted.</p>
    <p>"Ignore" treats cloud variables like normal variables.</p>
    <p>"Advanced" lets you configure a different mode for each variable, so you can have some sync with other users but have others be remembered locally.</p>
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
  <label>
    <input type="radio" bind:group={$options.target} value="html">
    Standalone HTML
  </label>
  <label>
    <input type="radio" bind:group={$options.target} value="zip">
    Zip (each asset gets separate file)
  </label>
  <label>
    <input type="radio" bind:group={$options.target} value="nwjs-win64">
    NW.js Windows (64-bit)
  </label>
  <label>
    <input type="radio" bind:group={$options.target} value="nwjs-win32">
    NW.js Windows (32-bit)
  </label>
  <label>
    <input type="radio" bind:group={$options.target} value="nwjs-mac">
    NW.js macOS
  </label>

  {#if $options.target.startsWith('nwjs-')}
    <div transition:slide|local>
      <label>
        Package Name
        <input type="text" bind:value={$options.app.packageName}>
      </label>
      <label>
        Icon
        <input type="file" bind:files={iconFiles} accept=".png">
      </label>
    </div>
  {/if}
</Section>

{#if $options.target.startsWith('nwjs-')}
  <div transition:fade|local>
    <Section accent="#FF661A">
      {#if $options.target.startsWith('nwjs-win')}
        <div>
          <h2>Further steps for Windows</h2>
          <p>To change the icon of the executable and generate installers, see <a href="https://docs.nwjs.io/en/latest/For%20Users/Package%20and%20Distribute/#windows">NW.js Documentation</a>.</p>
        </div>
      {:else if $options.target === 'nwjs-mac'}
        <h2>Further steps for macOS</h2>
        <p>Due to Apple policy, packaging for their platforms is rather troublesome. You either have to:</p>
        <ul>
          <li>Pay Apple $100/year for a developer account, or</li>
          <li>Instruct users to ignore Gatekeeper by opening Finder > Navigating to the application > Right click > Open > Open again</li>
        </ul>
        <p>For further help and steps, see <a href="https://docs.nwjs.io/en/latest/For%20Users/Package%20and%20Distribute/#mac-os-x">NW.js Documentation</a>.</p>
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
