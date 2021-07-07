<script>
  import {_} from '../locales/';
  import ComplexMessage from './ComplexMessage.svelte';
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
    <!-- don't translate "TurboWarp Packager" -->
    <h1>TurboWarp Packager</h1>
    <p>{$_('p4.description1')}</p>
    <p>
      <ComplexMessage
        message={$_('p4.description2')}
        values={{
          embedding: {
            text: $_('p4.description2-embedding'),
            href: 'https://github.com/TurboWarp/scratch-gui/wiki/Embedding'
          }
        }}
      />
    </p>
    <p>
      <ComplexMessage
        message={$_('p4.description3')}
        values={{
          onScratch: {
            text: $_('p4.description3-scratch'),
            href: 'https://scratch.mit.edu/users/GarboMuffin/#comments'
          },
          onGitHub: {
            text: $_('p4.description3-github'),
            href: 'https://github.com/TurboWarp/packager/issues'
          }
        }}
      />
    </p>
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
        <h2>{$_('p4.error')}</h2>
        {#if $error instanceof UserError}
          <p>{$error.message}</p>
          <p>
            <Button on:click={closeModal}>{$_('p4.close')}</Button>
          </p>
        {:else}
          <p>
            {$_('p4.errorMessage').replace('{error}', error)}
          </p>
          <p>
            <Button on:click={closeModal}>{$_('p4.close')}</Button>
            <a href="https://scratch.mit.edu/users/GarboMuffin/#comments">{$_('p4.reportBug')}</a>
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
      <a href="privacy.html">{$_('p4.privacy')}</a>
      -
      <a href="https://scratch.mit.edu/users/GarboMuffin/#comments">{$_('p4.feedback')}</a>
      -
      <a href="https://github.com/TurboWarp/packager">{$_('p4.sourceCode')}</a>
    </div>
    <div>
      <a href="https://fosshost.org/">{$_('p4.fosshost')}</a>
    </div>
  </footer>
</main>
