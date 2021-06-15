<script>
  import ProjectPackager from './packager';
  import downloadFile from './download-file';

  let projectId = '1';
  let turbo = false;
  let interpolation = false;
  let framerate = 30;
  let highQualityPen = false;
  let width = 480;
  let height = 360;
  let autoplay = false;
  let runtimeOptions = {
    maxClones: 300,
    fencing: true,
    miscLimits: true
  };
  let compilerOptions = {
    enabled: true,
    warpTimer: false
  };
  let backgroundColor = '#000000';
  let textColor = '#ffffff';
  let addons = false;

  const pack = async () => {
    const packager = new ProjectPackager();
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
    <li>Packaged projects can run slightly (in some cases, significantly) faster due to less Scratch overhead</li>
    <li>Things like monitors, ask prompts, etc. can look and function a bit different, we're working on it.</li>
    <li>Redesigned minimal loading screen. Easy to edit. Just open the HTML and look for the part that says "progress bar".</li>
  </ul>

  <h2>Project Options</h2>
  <label>
    Project ID
    <input type="number" bind:value={projectId}>
  </label>

  <h2>Runtime Options</h2>
  <label>
    <input type="checkbox" bind:checked={turbo}>
    Turbo Mode
  </label>
  <label>
    <input type="checkbox" bind:checked={interpolation}>
    Interpolation
  </label>
  <label>
    Framerate
    <input type="number" min="0" max="240" bind:value={framerate}>
  </label>
  <label>
    <input type="checkbox" bind:checked={highQualityPen}>
    High Quality Pen
  </label>
  <label>
    <input type="checkbox" checked={runtimeOptions.maxClones === Infinity} on:change={(e) => {
      runtimeOptions.maxClones = e.target.checked ? Infinity : 300;
    }}>
    Infinite Clones
  </label>
  <label>
    <input type="checkbox" checked={!runtimeOptions.fencing} on:change={(e) => {
      runtimeOptions.fencing = !e.target.checked;
    }}>
    Remove Fencing
  </label>
  <label>
    <input type="checkbox" checked={!runtimeOptions.miscLimits} on:change={(e) => {
      runtimeOptions.miscLimits = !e.target.checked;
    }}>
    Remove Miscellanous Limits
  </label>
  <label>
    Stage Size
    <input type="number" min="0" max="4096" step="1" bind:value={width}>
    &times;
    <input type="number" min="0" max="4096" step="1" bind:value={height}>
  </label>
  <label>
    <input type="checkbox" bind:checked={autoplay}>
    Autoplay
  </label>

  <h2>Compiler Options</h2>
  <label>
    <input type="checkbox" bind:checked={compilerOptions.enabled}>
    Enable compiler
  </label>
  <label>
    <input type="checkbox" bind:checked={compilerOptions.warpTimer}>
    Warp Timer
  </label>

  <h2>Appearance</h2>
  <label>
    <input type="color" bind:value={backgroundColor}>
    Background Color
  </label>
  <label>
    <input type="color" bind:value={textColor}>
    Text Color
  </label>

  <h2>Addons</h2>
  <label>
    <input type="checkbox" bind:checked={addons}>
    Include gamepad addon
  </label>

  <button on:click={pack}>Package</button>
</main>

