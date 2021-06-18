<script>
  import {fade} from 'svelte/transition';
  import Section from './Section.svelte';
  import SelectProject from './SelectProject.svelte';
  import PackagerOptions from './PackagerOptions.svelte';
  import {error} from './stores';
  import {UserError} from './errors';

  let projectData;

  const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');
  let theme = darkMedia.matches ? 'dark' : 'light';
  if (darkMedia.addEventListener) {
    darkMedia.addEventListener('change', () => {
      theme = darkMedia.matches ? 'dark' : 'light';
    });
  }
  $: document.body.setAttribute('theme', theme);
  document.body.setAttribute('p4-loaded', '');

  $: if ($error) {
    console.error($error);
  }

  const closeModal = () => {
    $error = null;
  };
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };
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
    padding-bottom: 10px;
  }
  footer {
    text-align: center;
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
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.75);
  }
</style>

<svelte:window on:keydown={onKeyDown} />

<main>
  <Section>
    <h1>TurboWarp Packager</h1>
    <p>Converts Scratch projects into standalone files.</p>
    <p>If you just want to embed a TurboWarp project into your website, see <a href="https://github.com/TurboWarp/scratch-gui/wiki/Embedding">Embedding</a> instead.</p>
  </Section>

  <Section>
    <p class="new-outer"><span class="new">New!</span> We've made a major update to the packager. Here's the highlights:</p>
    <ul>
      <li>Packaged projects are smaller, faster, and have a redesigned loading screen</li>
      <li>Things like loading screens are easy to edit by editing the simple HTML/CSS</li>
      <li>New features: Gamepad support addon, configuring cloud variables per-variable, better zip projects</li>
      <li>License changed from GPLv3 to LGPLv3, talk to a lawyer to learn what that means</li>
    </ul>
    <p>A lot of things that were previously difficult are now trivial -- let us know what features and customizations you're looking for.</p>
    <p>You can still use the <a href="TODO">old version</a> if you'd like, but it won't receive updates.</p>
  </Section>

  <SelectProject bind:projectData />

  {#if projectData}
    <div in:fade>
      <PackagerOptions projectData={projectData} />
    </div>
  {/if}

  {#if $error}
    <div class="modal" on:click|self={closeModal} on:key>
      <Section modal>
        <h2>Error</h2>
        {#if $error instanceof UserError}
          <p>{$error.message}</p>
          <p>
            <button on:click={closeModal}>Close</button>
          </p>
        {:else}
          <p>Message: {$error}</p>
          <p>
            <button on:click={closeModal}>Close</button>
            <a href="https://scratch.mit.edu/users/GarboMuffin/#comments">Report bug</a>
          </p>
        {/if}
      </Section>
    </div>
  {/if}

  <footer>
    <a href="https://scratch.mit.edu/users/GarboMuffin/#comments">Feedback & Bugs</a>
    -
    <a href="https://github.com/TurboWarp/p4">Source Code (LGPL3.0)</a>
  </footer>
</main>
