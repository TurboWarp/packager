<script>
  import SelectProject from './SelectProject.svelte';
  import PackagerOptions from './PackagerOptions.svelte';
  import {error} from './stores';

  let projectData;

  $: if ($error) {
    console.error($error);
    alert($error);
    $error = null;
  }
</script>

<style>
  main {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    max-width: 700px;
    margin: auto;
  }
</style>

<main>
  <h1>TurboWarp Packager 4.0 staging</h1>

  <p>Converts Scratch projects into standalone files.</p>
  <p>If you just want to embed a TurboWarp project into your website, see <a href="https://github.com/TurboWarp/scratch-gui/wiki/Embedding">Embedding</a> instead.</p>

  <p>We're rewriting the packager to make it faster, more customizable, and more maintainable. Noteworthy changes:</p>
  <ul>
    <li>Packaged projects are significantly smaller and run slightly faster</li>
    <li>Complete redesign of packaged projects</li>
    <li>HTML is easy to edit</li>
    <li>Things like monitors, ask prompts, etc. might look a bit different, we're working on it</li>
    <li>If you have an idea to make this website look nice, please let us know</li>
    <li>We want to know what customizations people are lookinng for</li>
    <li>Option to include the "gamepad support" addon from TurboWarp and other third-party Scratch tools</li>
  </ul>

  <h2>Choose Project</h2>
  <SelectProject bind:projectData />

  {#if projectData}
    <PackagerOptions projectData={projectData} />
  {/if}
</main>
