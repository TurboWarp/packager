<script>
  import ProjectPackager from './packager';
  import downloadFile from './download-file';

  const packager = new ProjectPackager();

  let projectId = '1';

  const pack = async () => {
    await packager.loadProjectById(projectId);
    await packager.loadResources();
    const result = await packager.package();
    downloadFile(result, 'project.html');
  };
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
  <h1>TurboWarp Packager</h1>

  <p>We're currently rewriting the packager to make it faster, more customizable, and more maintainable. Noteworthy changes:</p>
  <ul>
    <li>Packaged projects are now about a megabyte smaller</li>
    <li>Packaged projects load slightly faster</li>
    <li>Packaged projects can run slightly faster (in a few cases, significantly faster)</li>
    <li>Things like monitors, ask prompts, etc. can look and function a bit different, we're working on it</li>
    <li>Redesigned minimal loading screen</li>
    <li>HTML is easy to edit</li>
    <li>Completely removed TurboWarp's red color</li>
    <li>Also, if you think you have an idea to make this website look nice, please let us know :)</li>
  </ul>

  <h2>Project Options</h2>
  <label>
    Project ID
    <input type="number" bind:value={projectId}>
  </label>

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

  <button on:click={pack}>Package</button>
</main>

