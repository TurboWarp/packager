<script>
  import ProjectPackager from './packager';
  import writablePersistentStore from './persistent-store';
  import {error} from './stores';

  export let projectData;
  export let packager;

  const options = writablePersistentStore(`PackagerOptions.${projectData.uniqueId}`, ProjectPackager.DEFAULT_OPTIONS());
  $: packager.options = $options;

  let result = null;
  let url = null;

  const downloadURL = (filename, url) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const runPackager = async (packager) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
    result = null;
    url = null;
    result = await packager.package();
    url = URL.createObjectURL(result.blob);
  };

  const withErrorHandling = (fn) => () => fn().catch((e) => {
    $error = e
  });

  const pack = withErrorHandling(async () => {
    await runPackager(packager.child());
    downloadURL(result.filename, url);
  });

  const preview = withErrorHandling(async () => {
    const child = packager.child();
    child.options.target = 'html';
    await runPackager(child);
    window.open(url);
  });
</script>

<style>
  label {
    display: block;
  }
</style>

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

<h2>Addons</h2>
<label>
  <input type="checkbox" bind:checked={$options.chunks.gamepad}>
  Gamepad support
</label>

<h2>Environment</h2>
<label>
  <input type="radio" bind:group={$options.target} value="html">
  Standalone HTML
</label>
<label>
  <input type="radio" bind:group={$options.target} value="zip">
  Zip (each asset gets separate file)
</label>

<div>
  <button on:click={pack}>Package</button>
  <button on:click={preview}>Preview</button>
</div>

{#if result && url}
  <div>
    <a href={url} download={result.filename}>Download {result.filename} ({(result.blob.size / 1024 / 1024).toFixed(2)}MiB)</a>
  </div>
{/if}
