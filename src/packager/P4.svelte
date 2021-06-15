<script>
  import ProjectPackager from './packager';

  const packager = new ProjectPackager();

  let projectSource = 'id';
  let projectId = '1';
  let projectFileList;

  const toURL = (obj) => {
    const blob = new Blob([obj]);
    const url = URL.createObjectURL(blob);
    return url;
  };

  const downloadURL = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return url;
  };

  const runPackager = async () => {
    if (projectSource === 'id') {
      await packager.loadProjectById(projectId);
    } else {
      await packager.loadProjectFromFile(projectFileList[0]);
    }
    await packager.loadResources();
    const result = await packager.package();
    return result;
  };

  const handleError = (fn) => () => fn()
    .catch((err) => {
      console.error(err);
      alert(err);
    });

  const pack = handleError(async () => {
    const result = await runPackager();
    const url = toURL(result);
    downloadURL(url, 'project.html');
  });

  const preview = handleError(async () => {
    const result = await runPackager();
    const url = toURL(result);
    window.open(url);
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
    <li>Packaged projects are now about a megabyte smaller, load slightly faster, and can run slightly faster</li>
    <li>Complete redesign of packaged projects</li>
    <li>HTML is easy to edit</li>
    <li>Things like monitors, ask prompts, etc. might look a bit different, we're working on it</li>
    <li>If you have an idea to make this website look nice, please let us know</li>
    <li>If you have an idea for a possible "theme" for packaged projects, let us know. We want to know what customizations people want now that we're free from the Scratch loading screen.</li>
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

  <div>
    <button on:click={pack}>Package</button>
    <button on:click={preview}>Preview</button>
  </div>
</main>
