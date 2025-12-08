<script>
  import {_} from '../locales/';
  import {fade} from 'svelte/transition';
  import ComplexMessage from './ComplexMessage.svelte';
  import Section from './Section.svelte';
  import SelectProject from './SelectProject.svelte';
  import SelectLocale from './SelectLocale.svelte';
  import SelectTheme from './SelectTheme.svelte';
  import Progress from './Progress.svelte';
  import Modals from './Modals.svelte';
  import News from './News.svelte';
  import {progress, theme, error} from './stores';
  import {isSupported, isSafari, isStandalone, version} from './environment';
  import {
    APP_NAME,
    FEEDBACK_PRIMARY,
    FEEDBACK_SECONDARY,
    ACCENT_COLOR,
    SOURCE_CODE,
    WEBSITE,
    DONATE,
    PRIVACY_POLICY
  } from '../packager/brand';

  let projectData;

  const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');
  let systemTheme = darkMedia.matches ? 'dark' : 'light';
  if (darkMedia.addEventListener) {
    darkMedia.addEventListener('change', () => {
      systemTheme = darkMedia.matches ? 'dark' : 'light';
    });
  }
  $: document.documentElement.setAttribute('theme', $theme === 'system' ? systemTheme : $theme);

  let modalVisible = false;

  const defaultTitle = document.title;
  let title = '';
  $: document.title = projectData && title ? `${title} - ${APP_NAME}` : defaultTitle;

  const getPackagerOptionsComponent = () => import(
    /* webpackChunkName: "packager-options-ui" */
    './PackagerOptions.svelte'
  ).catch((err) => {
    $error = err;
  });

  // We know for sure we will need this component very soon, so start loading it immediately.
  getPackagerOptionsComponent();
</script>

<style>
  :root {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    background: linear-gradient(135deg, #f7f9ff 0%, #f1f5ff 35%, #e9f5ff 100%);
    color: black;
  }
  :global([theme="dark"]) {
    background: radial-gradient(circle at 20% 20%, rgba(86, 148, 255, 0.05), transparent 35%),
      radial-gradient(circle at 80% 0%, rgba(86, 178, 255, 0.08), transparent 45%),
      #0c0d13;
    color: #eee;
    color-scheme: dark;
  }
  :global(a) {
    color: blue;
  }
  :global([theme="dark"] a) {
    color: #56b2ff;
  }
  :global(a:active) {
    color: red;
  }
  :global(input[type="text"]),
  :global(input[type="number"]),
  :global(textarea) {
    padding: 2px;
  }
  :global(input[type="text"]),
  :global(input[type="number"]),
  :global(textarea),
  :global(.is-not-safari select) {
    background-color: white;
    color: black;
    border: 1px solid rgb(160, 160, 160);
    border-radius: 2px;
  }
  :global(.is-not-safari select:hover) {
    border-color: rgb(30, 30, 30);
  }
  :global([theme="dark"] input[type="text"]),
  :global([theme="dark"] input[type="number"]),
  :global([theme="dark"] textarea),
  :global([theme="dark"] .is-not-safari select) {
    background-color: #333;
    color: white;
    border-color: #888;
  }
  :global([theme="dark"] .is-not-safari select:hover) {
    border-color: #bbb;
  }
  :global(p), :global(h1), :global(h2), :global(h3) {
    margin: 12px 0;
  }
  :global(summary) {
    cursor: pointer;
  }
  :global(input) {
    font-size: 0.8em;
  }
  :global(body) {
    margin: 0;
    min-height: 100vh;
    background: inherit;
  }
  main {
    padding: 28px 16px 26px;
    max-width: 1140px;
    margin: 0 auto;
  }
  .hero-intro {
    display: grid;
    gap: 6px;
  }
  .hero-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    color: #3c4a66;
  }
  :global([theme="dark"]) .hero-meta {
    color: #c7d3f1;
  }
  .hero-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 0.9em;
    background: linear-gradient(90deg, rgba(76, 151, 255, 0.2), rgba(76, 151, 255, 0.08));
    color: #1b2a44;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 700;
  }
  :global([theme="dark"]) .hero-pill {
    background: linear-gradient(90deg, rgba(86, 178, 255, 0.25), rgba(86, 178, 255, 0.12));
    color: #e9f3ff;
  }
  h1 {
    margin: 0;
    font-size: 2rem;
    letter-spacing: -0.02em;
  }
  .description-stack {
    display: grid;
    gap: 8px;
    margin-top: 8px;
    color: #26334d;
  }
  :global([theme="dark"]) .description-stack {
    color: #dce6ff;
  }
  footer {
    text-align: center;
    margin-top: 16px;
    padding-bottom: 20px;
    display: grid;
    gap: 8px;
  }
  footer > div {
    margin-top: 6px;
  }
  .footer-row {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .disclaimer {
    font-style: italic;
    color: #556280;
  }
  :global([theme="dark"]) .disclaimer {
    color: #c1cee8;
  }
  .version {
    font-size: small;
    opacity: 0.8;
  }
  .version a {
    color: inherit;
  }
</style>

<Modals bind:modalVisible={modalVisible} />

<main aria-hidden={modalVisible} class:is-not-safari={!isSafari}>
  <Section accent={ACCENT_COLOR}>
    <div>
      <div class="hero-intro">
        <div class="hero-pill">{$_('p4.feedback')}</div>
        <div class="hero-meta">
          <h1>{APP_NAME}</h1>
          {#if version}
            <p class="version">
              {version}
              {#if isStandalone}
                - <a href={WEBSITE}>{WEBSITE}</a>
              {/if}
            </p>
          {/if}
        </div>
        <div class="description-stack">
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
                // These placeholders are named this way for legacy reasons.
                onScratch: {
                  text: $_('p4.description3-on').replace('{brand}', FEEDBACK_PRIMARY.name),
                  href: FEEDBACK_PRIMARY.link
                },
                onGitHub: {
                  text: $_('p4.description3-on').replace('{brand}', FEEDBACK_SECONDARY.name),
                  href: FEEDBACK_SECONDARY.link
                }
              }}
            />
          </p>
        </div>
        <p class="disclaimer">
          {$_('p4.disclaimer')}
        </p>
      </div>
    </div>
  </Section>

  {#if !isStandalone}
    <News />
  {/if}

  {#if isSupported}
    <SelectProject bind:projectData />
  {:else}
    <Section accent="#4C97FF">
      <h2>{$_('p4.browserNotSupported')}</h2>
      <p>{$_('p4.browserNotSupportedDescription')}</p>
    </Section>
  {/if}

  {#if projectData}
    {#await getPackagerOptionsComponent()}
      <Section center>
        <Progress text={$_('p4.importingInterface')} />
      </Section>
    {:then { default: PackagerOptions }}
      <div in:fade>
        <PackagerOptions
          projectData={projectData}
          bind:title={title}
        />
      </div>
    {:catch}
      <Section center>
        <p>
          {$_('p4.unknownImportError')}
        </p>
      </Section>
    {/await}
  {/if}

  {#if $progress.visible}
    <Section center>
      <Progress progress={$progress.progress} text={$progress.text} />
    </Section>
  {/if}

  <footer>
    <div class="footer-row">
      {#if PRIVACY_POLICY && !isStandalone}
        <a href={PRIVACY_POLICY}>{$_('p4.privacy')}</a>
        <span>•</span>
      {/if}
      <a href={FEEDBACK_PRIMARY.link}>{$_('p4.feedback')}</a>
      {#if SOURCE_CODE}
        <span>•</span>
        <a href={SOURCE_CODE}>{$_('p4.sourceCode')}</a>
      {/if}
      {#if DONATE}
        <!-- Donation link needs to be wrapped in another element so we can hide it in the Mac App Store -->
        <span class="donate-link">
          <span>•</span>
          <a href={DONATE}>{$_('p4.donate')}</a>
        </span>
      {/if}
    </div>
    <div>
      <a href="https://docs.turbowarp.org/packager">{$_('p4.documentation')}</a>
    </div>
    <div>
      <SelectTheme />
    </div>
    <div>
      <SelectLocale />
    </div>
  </footer>
</main>
