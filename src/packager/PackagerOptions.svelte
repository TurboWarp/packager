<script>
  import Section from './Section.svelte';
  import Progress from './Progress.svelte';
  import ProjectPackager from './packager';
  import writablePersistentStore from './persistent-store';
  import {error} from './stores';
  import Preview from './preview';

  export let projectData;

  const packager = new ProjectPackager();
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

  const options = writablePersistentStore(`PackagerOptions.${projectData.uniqueId}`, packager.options);
  $: packager.options = $options;

  let result = null;
  let url = null;
  let progressVisible = false;
  let progress = 0;
  let progressText = '';

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
      progressText = 'Loading';
      progress = 0;
      if (url) {
        URL.revokeObjectURL(url);
      }
      result = null;
      url = null;
      result = await packager.package();
      url = URL.createObjectURL(result.blob);
    } catch (e) {
      $error = e;
    }
    progressVisible = false;
  };

  const pack = async () => {
    await runPackager(packager.child());
    downloadURL(result.filename, url);
  };

  const preview = async () => {
    const preview = new Preview();
    const child = packager.child();
    child.options.target = 'html';
    await runPackager(child);
    preview.setContent(result.blob);
  };
</script>

<style>
  label {
    display: block;
  }
  .downloads {
    text-align: center;
  }
</style>

<Section>
  <h2>Runtime Options</h2>
  
  <label>
    <input type="checkbox" bind:checked={$options.turbo}>
    Turbo Mode
  </label>
  <label>
    <input type="checkbox" bind:checked={$options.interpolation}>
    Interpolation
  </label>
  <label>
    Framerate
    <input type="number" min="0" max="240" bind:value={$options.framerate}>
  </label>
  <label>
    <input type="checkbox" bind:checked={$options.highQualityPen}>
    High Quality Pen
  </label>
  <label>
    <input type="checkbox" checked={$options.maxClones === Infinity} on:change={(e) => {
      $options.maxClones = e.target.checked ? Infinity : 300;
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
    <input type="checkbox" bind:checked={$options.autoplay}>
    Autoplay
  </label>
</Section>

<!-- <h2>Compiler Options</h2>
<label>
  <input type="checkbox" bind:checked={$options.enabled}>
  Enable compiler
</label>
<label>
  <input type="checkbox" bind:checked={$options.warpTimer}>
  Warp Timer
</label> -->

<!-- <h2>Appearance</h2>
<label>
  <input type="color" bind:value={backgroundColor}>
  Background Color
</label>
<label>
  <input type="color" bind:value={textColor}>
  Text Color
</label> -->

<Section>
  <h2>Cloud Variables</h2>
  {#if cloudVariables.length > 0}
    <div>
      <select bind:value={$options.cloudVariables.mode}>
        {#if canUseCloudVariableServer}
          <option value="ws">Cloud variable server</option>
        {:else}
          <option disabled>Can not use cloud variable server on this project</option>
        {/if}
        <option value="local">Local Storage</option>
        <option value="custom">Custom</option>
        <option value="">Ignore</option>
      </select>
    </div>
    {#if $options.cloudVariables.mode === "custom"}
      {#each cloudVariables as variable}
        <div>
          <select bind:value={$options.cloudVariables.custom[variable]}>
            {#if canUseCloudVariableServer}
              <option value="ws">Cloud variable server</option>
            {:else}
              <option disabled>Can not use cloud variable server on this project</option>
            {/if}
            <option value="local">Local Storage</option>
            <option value="">Ignore</option>
          </select>
          {variable}
        </div>
      {/each}
    {/if}
  {:else}
    <p>This project does not contain cloud variables.</p>
  {/if}
</Section>

<Section>
  <h2>Addons</h2>
  <label>
    <input type="checkbox" bind:checked={$options.chunks.gamepad}>
    Gamepad support
  </label>
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
