<script>
  import {fade} from 'svelte/transition';
  import Section from './Section.svelte';
  import SelectProject from './SelectProject.svelte';
  import PackagerOptions from './PackagerOptions.svelte';
  import Progress from './Progress.svelte';
  import Button from './Button.svelte';
  import {error, progress} from './stores';
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
    document.body.setAttribute('modal-visible', '');
    console.error($error);
  } else {
    document.body.removeAttribute('modal-visible');
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
  :global([modal-visible]) {
    overflow: hidden;
  }
  :global(p), :global(h1), :global(h2) {
    margin: 12px 0;
  }
  main {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    padding-bottom: 10px;
  }
  footer {
    text-align: center;
  }
  .new {
    border-radius: 4px;
    border-bottom: 2px solid #111;
    padding: 1px 5px;
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
  footer > div {
    margin-top: 8px;
  }
</style>

<svelte:window on:keydown={onKeyDown} />

<main>
  <Section accent="#ff4c4c">
    <h1>TurboWarp Packager</h1>
    <p>Converts Scratch projects into standalone files.</p>
    <p>If you just want an easy way to embed a TurboWarp project into your website, you may be interested in <a href="https://github.com/TurboWarp/scratch-gui/wiki/Embedding">Embedding</a>.</p>
    <p>Report bugs, give feedback, and suggest ideas <a href="https://scratch.mit.edu/users/GarboMuffin/#comments">on Scratch</a> or <a href="https://github.com/TurboWarp/packager/issues">on GitHub</a>.</p>
  </Section>

  <Section accent="#b117f8">
    <p><span class="new">New!</span> We rewrote the packager to bring improved performance, file size, customizability, simple-to-edit HTML, a new loading screen, more options for cloud variables, optional gamepad support, and more.</p>
    <p>A lot of features that were previously difficult are now trivial. <a href="https://scratch.mit.edu/users/GarboMuffin/#comments">Let us know</a> what features and customizations you're looking for.</p>
    <p>The old packager <a href="https://packager-legacy.turbowarp.org/">can still be used indefinitely</a> for the few niche use-cases that are no longer possible. It's not actively maintained so we wouldn't recommend it.</p>
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
            <Button on:click={closeModal}>Close</Button>
          </p>
        {:else}
          <p>Message: {$error}</p>
          <p>
            <Button on:click={closeModal}>Close</Button>
            <a href="https://scratch.mit.edu/users/GarboMuffin/#comments">Report bug</a>
          </p>
        {/if}
      </Section>
    </div>
  {/if}

  {#if $progress.visible}
    <Section>
      <Progress progress={$progress.progress} text={$progress.text} />
    </Section>
  {/if}

  <footer>
    <div>
      <a href="privacy.html">Privacy Policy</a>
      -
      <a href="https://scratch.mit.edu/users/GarboMuffin/#comments">Feedback & Bugs</a>
      -
      <a href="https://github.com/TurboWarp/p4">Source Code (LGPL3.0)</a>
    </div>
    <div>
      <a href="https://fosshost.org/">File hosting provided by Fosshost</a>
    </div>
  </footer>
</main>
