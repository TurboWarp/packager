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

