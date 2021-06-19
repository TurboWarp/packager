<script>
  import {slide} from 'svelte/transition';
  import Section from './Section.svelte';
  import Progress from './Progress.svelte';
  import Packager from './packager';
  import writablePersistentStore from './persistent-store';
  import {error} from './stores';
  import Preview from './preview';

  export let projectData;

  // JSON can't easily parse Infinity, so we'll just store large numbers instead
  const ALMOST_INFINITY = 9999999999;

  const packager = new Packager();
  packager.vm = projectData.vm;

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

  const options = writablePersistentStore(`PackagerOptions.${projectData.uniqueId}`, packager.options);
  $: packager.options = $options;

  let result = null;
  let url = null;
  let progressVisible = false;
  let progress = 0;
  let progressText = '';
  let iconFiles = null;
  $: $options.app.icon = iconFiles ? iconFiles[0] : null;

  const handleLargeAssetFetchProgress = ({detail}) => {
    if (detail.asset.startsWith('nwjs-')) {
      progressText = 'Loading NW.js';
    } else if (detail.asset === 'scaffolding') {
      progressText = 'Loading TurboWarp';
    } else if (detail.asset === 'addons') {
      progressText = 'Loading addons';
    } else {
      progressText = `Loading large asset ${detail.asset}`
    }
    progress = detail.progress;
  };

  const handleZipProgress = ({detail}) => {
    progressText = 'Compressing project';
    progress = detail.progress;
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
      progressVisible = true;
      progressText = 'Compressing project';
      progress = 0;
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
    progressVisible = false;
  };

  const pack = async () => {
    await runPackager(packager.child());
    if (result) {
      downloadURL(result.filename, url);
    }
  };

  const preview = async () => {
    const preview = new Preview();
    const child = packager.child();
    child.options.target = 'html';
    await runPackager(child);
    if (result) {
      preview.setContent(result.blob);
    } else {
      preview.close();
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

<Section>
  <h2>Runtime Options</h2>

  <!-- TODO: this is not ideal, the help should be in here -->
  <!-- especially as not all of these options are actually in advanced settings on the main site -->
  <p>See the advanced settings menu in <a href="https://turbowarp.org/">TurboWarp</a> for more information about these settings.</p>

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
    Username (# will be replaced with random number)
    <input type="text" bind:value={$options.username}>
  </label>
  <label>
    <input type="checkbox" bind:checked={$options.autoplay}>
    Autoplay
  </label>
</Section>

<Section>
  <h2>Player Options</h2>

  <label>
    <input type="checkbox" bind:checked={$options.controls.greenFlag.enabled}>
    Green Flag
  </label>
  <label>
    <input type="checkbox" bind:checked={$options.controls.stopAll.enabled}>
    Stop All
  </label>
  <label>
    <input type="checkbox" bind:checked={$options.controls.fullscreen.enabled}>
    Fullscreen
  </label>

  {#if $options.controls.greenFlag.enabled || $options.controls.stopAll.enabled}
    <label transition:slide>
      <input type="color" bind:value={$options.appearance.accent}>
      Accent color (background of controls)
    </label>
  {/if}
  <label>
    <input type="color" bind:value={$options.appearance.background}>
    Background color
  </label>
  <label>
    <input type="color" bind:value={$options.appearance.foreground}>
    Progress bar color
  </label>

  <label>
    <input type="checkbox" bind:checked={$options.chunks.gamepad}>
    Gamepad support (no settings modal)
  </label>
</Section>

{#if cloudVariables.length > 0}
  <Section>
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
      <div transition:slide>
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

<Section>
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

<Section>
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
    <div transition:slide>
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

<Section>
  <button on:click={pack}>Package</button>
  <button on:click={preview}>Preview</button>
</Section>

{#if result && url}
  <Section>
    <div class="downloads">
      <a href={url} download={result.filename}>Download {result.filename} ({(result.blob.size / 1024 / 1024).toFixed(2)}MiB)</a>
    </div>
  </Section>
{:else if progressVisible}
  <Section>
    <Progress progress={progress} text={progressText} />
  </Section>
{:else}
  <Section caption>
    <p>Downloads will appear here</p>
  </Section>
{/if}
