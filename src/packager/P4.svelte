<script>
  import {fade} from 'svelte/transition';
  import Section from './Section.svelte';
  import SelectProject from './SelectProject.svelte';
  import PackagerOptions from './PackagerOptions.svelte';
  import {error} from './stores';

  let projectData;

  const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');
  let theme = darkMedia.matches ? 'dark' : 'light';
  if (darkMedia.addEventListener) {
    darkMedia.addEventListener('change', () => {
      theme = darkMedia.matches ? 'dark' : 'light';
    });
  }
  $: document.body.setAttribute('theme', theme);

  $: if ($error) {
    console.error($error);
    alert($error);
    $error = null;
  }
</script>

<style>
  :global([theme="dark"]) {
    background: #111;
    color: #eee;
    color-scheme: dark;
  }
  :global(a) {
    color: blue;
  }
  :global(a:active) {
    color: red;
  }
  :global([theme="dark"]) :global(a) {
    color: #4af;
  }
  main {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    max-width: 700px;
    margin: auto;
  }
  .new-outer {
    display: flex;
    align-items: center;
  }
  .new {
    border-radius: 4px;
    border-bottom: 2px solid #111;
    padding: 1px 5px;
    margin-right: 4px;
    color: white;
    background: #b117f8;
    border-color: #6f0073;
  }
</style>

<main>
  <Section>
    <h1>TurboWarp Packager</h1>
    <p>Converts Scratch projects into standalone files.</p>
    <p>If you just want to embed a TurboWarp project into your website, see <a href="https://github.com/TurboWarp/scratch-gui/wiki/Embedding">Embedding</a> instead.</p>
  </Section>

  <Section>
    <p class="new-outer"><span class="new">New!</span> We've made a major update to the packager. Here's the highlights:</p>
    <ul>
      <li>Packaged projects are smaller and faster</li>
      <li>Complete redesign of packaged projects, including a brand new loading screen</li>
      <li>Packaged projects are easy to edit (just simple HTML)</li>
      <li>Added option to include the "gamepad support" addon from TurboWarp</li>
      <li>Variable monitors and ask prompts might look a bit different, we're working on it</li>
      <li>A lot of things that were previously difficult are now trivial -- let us know what features and customizations you're looking for.</li>
    </ul>
    <p>The <a href="TODO">old version</a> can still be used indefinitely, but it will not be receiving updates.</p>
  </Section>

  <SelectProject bind:projectData />

  {#if projectData}
    <div in:fade>
      <PackagerOptions projectData={projectData} />
    </div>
  {/if}
</main>
