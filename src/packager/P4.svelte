<script>
  import {_} from '../locales/';
  import ComplexMessage from './ComplexMessage.svelte';
  import {fade} from 'svelte/transition';
  import Section from './Section.svelte';
  import SelectProject from './SelectProject.svelte';
  import PackagerOptions from './PackagerOptions.svelte';
  import Progress from './Progress.svelte';
  import Button from './Button.svelte';
  import SelectLocale from './SelectLocale.svelte';
  import {error, progress} from './stores';
  import {UserError} from './errors';
  import isSupported from './lib/browser-support';
  import {APP_NAME, FEEDBACK_GITHUB, FEEDBACK_SCRATCH, SOURCE_CODE} from './brand';

  let projectData;

  const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');
  let theme = darkMedia.matches ? 'dark' : 'light';
  if (darkMedia.addEventListener) {
    darkMedia.addEventListener('change', () => {
      theme = darkMedia.matches ? 'dark' : 'light';
    });
  }
  $: document.documentElement.setAttribute('theme', theme);
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
  :global(summary) {
    cursor: pointer;
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
    <h1>{APP_NAME}</h1>
    <p>{$_('p4.description1')}</p>
    <p>
      <ComplexMessage
        message={$_('p4.description2')}
        values={{
          embedding: {
            text: $_('p4.description2-embedding'),
            href: 'https://docs.turbowarp.org/embedding'
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
            href: FEEDBACK_SCRATCH
          },
          onGitHub: {
            text: $_('p4.description3-github'),
            href: FEEDBACK_GITHUB
          }
        }}
      />
    </p>
  </Section>

  {#if !isSupported}
    <Section accent="#4C97FF">
      <h2>Browser not supported</h2>
      <p>Please update your browser to use this site.</p>
    </Section>
  {:else}
    <SelectProject bind:projectData />
  {/if}

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
            <Button on:click={closeModal} text={$_('p4.close')} />
          </p>
        {:else}
          <p>
            {$_('p4.errorMessage').replace('{error}', $error)}
          </p>
          <p>
            <Button on:click={closeModal} text={$_('p4.close')} />
            <a href={FEEDBACK_SCRATCH}>{$_('p4.reportBug')}</a>
          </p>
        {/if}
      </Section>
    </div>
  {/if}

  {#if $progress.visible}
    <Section center>
      <Progress progress={$progress.progress} text={$progress.text} />
    </Section>
  {/if}

  <footer>
    <div>
      <a href="privacy.html">{$_('p4.privacy')}</a>
      -
      <a href={FEEDBACK_SCRATCH}>{$_('p4.feedback')}</a>
      -
      <a href={SOURCE_CODE}>{$_('p4.sourceCode')}</a>
    </div>
    <div>
      <a href="https://fosshost.org/">{$_('p4.fosshost')}</a>
    </div>
    <div>
      <SelectLocale />
    </div>
  </footer>
</main>
