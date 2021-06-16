<script>
  import ProjectPackager from './packager';

  const packager = new ProjectPackager();

  let projectSource = 'id';
  let projectId = '1';
  let projectFileList;
  let url;

  let hasRunOnce = false;
  let progress = 0;
  let progressText = '';

  packager.addEventListener('data-progress', (e) => {
    progressText = 'Downloading project';
    progress = e.detail;
  });

  let totalAssets = 0;
  let finishedAssets = 0;
  packager.addEventListener('asset-fetch', (e) => {
    totalAssets++;
    progress = finishedAssets / totalAssets;
    progressText = `Downloading assets (${finishedAssets}/${totalAssets})`;
  });
  packager.addEventListener('asset-fetched', (e) => {
    finishedAssets++;
    progress = finishedAssets / totalAssets;
    progressText = `Downloading assets (${finishedAssets}/${totalAssets})`;
  });

  const displayURL = (name, blob) => {
    const href = URL.createObjectURL(blob);
    url = {
      href,
      size: blob.size,
      name
    };
  };

  const downloadURL = (filename, url) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    if (url) {
      URL.revokeObjectURL(url.href);
      url = null;
    }
    hasRunOnce = true;
    progressText = 'Loading';
    progress = 0;
    totalAssets = 0;
    finishedAssets = 0;
  };

  const runPackager = async () => {
    reset();
    if (projectSource === 'id') {
      await packager.loadProjectById(projectId);
    } else {
      await packager.loadProjectFromFile(projectFileList[0]);
    }
    await packager.loadResources();
    const result = await packager.package();
    return new Blob([result]);
  };

  const handleError = (fn) => () => fn()
    .catch((err) => {
      console.error(err);
      alert(err);
    });

  const pack = handleError(async () => {
    const result = await runPackager();
    displayURL('project.zip', result);
    downloadURL('project.zip', url.href);
  });

  const preview = handleError(async () => {
    const result = await runPackager();
    displayURL('project.html', result);
    window.open(url.href);
  });
</script>

<style>
  main {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    max-width: 700px;
    margin: auto;
  }
  label {
    display: block;
  }
</style>

<main>
  <h1>TurboWarp Packager 4.0 staging</h1>

  <p>We're rewriting the packager to make it faster, more customizable, and more maintainable. Noteworthy changes:</p>
  <ul>
    <li>Packaged projects are significantly smaller and run slightly faster</li>
    <li>Complete redesign of packaged projects</li>
    <li>HTML is easy to edit</li>
    <li>Things like monitors, ask prompts, etc. might look a bit different, we're working on it</li>
    <li>If you have an idea to make this website look nice, please let us know</li>
    <li>We want to know what customizations people are lookinng for</li>
    <li>Includes the "gamepad support" addon from TurboWarp or other third-party Scratch tools</li>
  </ul>

  <h2>Project Options</h2>

  <div>
    <label>
      <input type="radio" value="id" bind:group={projectSource}>
      Project ID
    </label>
    <label>
      <input type="radio" value="file" bind:group={projectSource}>
      Project File
    </label>
  </div>
  {#if projectSource === 'id'}
    <label>
      Project ID
      <input type="number" bind:value={projectId}>
    </label>
  {:else}
    <label>
      Project File
      <input type="file" bind:files={projectFileList} accept=".sb,.sb2,.sb3">
    </label>  
  {/if}

  <h2>Runtime Options</h2>
  <label>
    <input type="checkbox" bind:checked={packager.turbo}>
    Turbo Mode
  </label>
  <label>
    <input type="checkbox" bind:checked={packager.interpolation}>
    Interpolation
  </label>
  <label>
    Framerate
    <input type="number" min="0" max="240" bind:value={packager.framerate}>
  </label>
  <label>
    <input type="checkbox" bind:checked={packager.highQualityPen}>
    High Quality Pen
  </label>
  <label>
    <input type="checkbox" checked={packager.maxClones === Infinity} on:change={(e) => {
      packager.maxClones = e.target.checked ? Infinity : 300;
    }}>
    Infinite Clones
  </label>
  <label>
    <input type="checkbox" checked={!packager.fencing} on:change={(e) => {
      packager.fencing = !e.target.checked;
    }}>
    Remove Fencing
  </label>
  <label>
    <input type="checkbox" checked={!packager.miscLimits} on:change={(e) => {
      packager.miscLimits = !e.target.checked;
    }}>
    Remove Miscellanous Limits
  </label>
  <label>
    Stage Size
    <input type="number" min="0" max="4096" step="1" bind:value={packager.stageWidth}>
    &times;
    <input type="number" min="0" max="4096" step="1" bind:value={packager.stageHeight}>
  </label>
  <label>
    <input type="checkbox" bind:checked={packager.autoplay}>
    Autoplay
  </label>

  <!-- <h2>Compiler Options</h2>
  <label>
    <input type="checkbox" bind:checked={compilerOptions.enabled}>
    Enable compiler
  </label>
  <label>
    <input type="checkbox" bind:checked={compilerOptions.warpTimer}>
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

  <!-- <h2>Addons</h2>
  <label>
    <input type="checkbox" bind:checked={addons}>
    Include gamepad addon
  </label> -->

  <h2>Environment</h2>
  <label>
    <input type="radio" bind:group={packager.target} value="html">
    Standalone HTML
  </label>
  <label>
    <input type="radio" bind:group={packager.target} value="zip">
    Zip
  </label>

  <div>
    <button on:click={pack}>Package</button>
    <button on:click={preview}>Preview</button>
  </div>

  {#if hasRunOnce}
    <div>
      <div>
        {progressText}
      </div>
      <div>
        <progress value={progress}></progress>
      </div>
      {#if url}
        <div>
          <a download={url.name} href={url.href}>Download {url.name}</a>
        </div>
      {/if}
    </div>
  {/if}
</main>
