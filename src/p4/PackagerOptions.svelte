<script>
  import {onDestroy} from 'svelte';
  import {_} from '../locales/';
  import {slide, fade} from 'svelte/transition';
  import Section from './Section.svelte';
  import Button from '../p4/Button.svelte';
  import ImageInput from './ImageInput.svelte';
  import CustomExtensions from '../p4/CustomExtensions.svelte';
  import LearnMore from './LearnMore.svelte';
  import ColorPicker from './ColorPicker.svelte';
  import writablePersistentStore from './persistent-store';
  import fileStore from './file-store';
  import {progress, currentTask} from './stores';
  import Preview from './preview';
  import deepClone from './deep-clone';
  import Packager from '../packager/packager';
  import Task from './task';

  export let projectData;

  // JSON can't easily parse Infinity, so we'll just store large numbers instead
  const ALMOST_INFINITY = 9999999999;

  const cloudVariables = projectData.project.analysis.stageVariables
    .filter(i => i.isCloud)
    .map(i => i.name);

  const defaultOptions = Packager.DEFAULT_OPTIONS();
  defaultOptions.projectId = projectData.projectId || `p4-${projectData.uniqueId}`;
  for (const variable of cloudVariables) {
    defaultOptions.cloudVariables.custom[variable] = 'ws';
  }
  defaultOptions.app.packageName = Packager.getDefaultPackageNameFromFileName(projectData.title);
  defaultOptions.app.windowTitle = Packager.getWindowTitleFromFileName(projectData.title);
  const options = writablePersistentStore(`PackagerOptions.${projectData.uniqueId}`, defaultOptions);

  const hasMagicComment = (magic) => projectData.project.analysis.stageComments.find(
    (text) => text.split('\n').find((line) => line.endsWith(magic))
  );
  const hasSettingsStoredInProject = hasMagicComment(' // _twconfig_');

  let result = null;
  let previewer = null;
  const resetResult = () => {
    previewer = null;
    if (result) {
      URL.revokeObjectURL(result.url);
    }
    result = null;
  }
  $: if (previewer) {
    previewer.setProgress($progress.progress, $progress.text);
  }
  $: $options, resetResult(), currentTask.abort();

  const icon = fileStore.writableFileStore(`PackagerOptions.icon.${projectData.uniqueId}`);
  $: $options.app.icon = $icon;

  const customCursorIcon = fileStore.writableFileStore(`PackagerOptions.customCursorIcon.${projectData.uniqueId}`);
  $: $options.cursor.custom = $customCursorIcon;

  const loadingScreenImage = fileStore.writableFileStore(`PackagerOptions.loadingScreenImage.${projectData.uniqueId}`);
  $: $options.loadingScreen.image = $loadingScreenImage;

  const otherEnvironmentsInitiallyOpen = ![
    'html',
    'zip',
    'electron-win32',
    'webview-mac',
    'electron-linux64'
  ].includes($options.target);

  const downloadURL = (filename, url) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const runPackager = async (task, options) => {
    const packager = new Packager();
    packager.options = options;
    packager.project = projectData.project;

    task.addEventListener('abort', () => {
      packager.abort();
    });

    task.setProgressText($_('progress.loadingScripts'));

    packager.addEventListener('large-asset-fetch', ({detail}) => {
      let thing;
      if (detail.asset.startsWith('nwjs-')) {
        thing = 'NW.js';
      } else if (detail.asset.startsWith('electron-')) {
        thing = 'Electron';
      } else if (detail.asset === 'webview-mac') {
        thing = 'WKWebView';
      }
      if (thing) {
        task.setProgressText($_('progress.loadingLargeAsset').replace('{thing}', thing));
      }
      task.setProgress(detail.progress);
    });
    packager.addEventListener('zip-progress', ({detail}) => {
      task.setProgressText($_('progress.compressingProject'));
      task.setProgress(detail.progress);
    });

    const result = await packager.package();
    result.url = URL.createObjectURL(result.blob);
    return result;
  };

  const pack = async () => {
    resetResult();
    const task = new Task();
    result = await task.do(runPackager(task, deepClone($options)));
    task.done();
    downloadURL(result.filename, result.url);
  };

  const preview = async () => {
    resetResult();
    previewer = new Preview();
    const task = new Task();
    const optionsClone = deepClone($options);
    optionsClone.target = 'html';
    try {
      result = await task.do(runPackager(task, optionsClone));
      task.done();
      previewer.setContent(result.blob);
    } catch (e) {
      previewer.close();
    }
  };

  const resetOptions = (properties) => {
    for (const key of properties) {
      $options[key] = deepClone(defaultOptions[key]);
    }
  };

  onDestroy(() => {
    if (result) {
      URL.revokeObjectURL(result.url);
    }
  });
</script>

<style>
  label {
    display: block;
    margin-bottom: 4px;
  }
  input[type=number] {
    width: 60px;
  }
  input[type=text] {
    width: 150px;
  }
  textarea {
    box-sizing: border-box;
    width: 100%;
    min-width: 100%;
    height: 150px;
  }
  .option-group {
    margin-bottom: 12px;
  }
  input:invalid {
    outline: 2px solid red;
  }
  .warning {
    font-weight: bold;
    background: yellow;
    color: black;
    padding: 10px;
    border-radius: 10px;
  }
</style>

<Section
  accent="#FFAB19"
  reset={() => {
    resetOptions([
      'turbo',
      'framerate',
      'interpolation',
      'highQualityPen',
      'maxClones',
      'fencing',
      'miscLimits',
      'stageWidth',
      'stageHeight',
      'username'
    ]);
  }}
>
  <div>
    <h2>{$_('options.runtimeOptions')}</h2>

    {#if hasSettingsStoredInProject}
      <div class="option-group">
        {$_('options.storedWarning')}
      </div>
    {/if}

    <label>
      <input type="checkbox" bind:checked={$options.turbo}>
      {$_('options.turbo')}
    </label>
    <label>
      {$_('options.framerate')}
      <input type="number" min="0" max="240" bind:value={$options.framerate}>
      <LearnMore slug="custom-fps" />
    </label>
    <label>
      <input type="checkbox" bind:checked={$options.interpolation}>
      {$_('options.interpolation')}
      <LearnMore slug="interpolation" />
    </label>
    <label>
      <input type="checkbox" bind:checked={$options.highQualityPen}>
      {$_('options.highQualityPen')}
      <LearnMore slug="high-quality-pen" />
    </label>
    <label>
      <input type="checkbox" checked={$options.maxClones === ALMOST_INFINITY} on:change={(e) => {
        $options.maxClones = e.target.checked ? ALMOST_INFINITY : 300;
      }}>
      {$_('options.infiniteClones')}
      <LearnMore slug="infinite-clones" />
    </label>
    <label>
      <input type="checkbox" checked={!$options.fencing} on:change={(e) => {
        $options.fencing = !e.target.checked;
      }}>
      {$_('options.removeFencing')}
      <LearnMore slug="remove-fencing" />
    </label>
    <label>
      <input type="checkbox" checked={!$options.miscLimits} on:change={(e) => {
        $options.miscLimits = !e.target.checked;
      }}>
      {$_('options.removeMiscLimits')}
      <LearnMore slug="remove-misc-limits" />
    </label>
    <label>
      {$_('options.stageSize')}
      <input type="number" min="1" max="4096" step="1" bind:value={$options.stageWidth}>
      &times;
      <input type="number" min="1" max="4096" step="1" bind:value={$options.stageHeight}>
      <LearnMore slug="custom-stage-size" />
    </label>
    <label>
      {$_('options.username')}
      <input type="text" bind:value={$options.username}>
    </label>
  </div>
</Section>

<Section
  accent="#9966FF"
  reset={() => {
    $icon = null;
    $loadingScreenImage = null;
    $customCursorIcon = null;
    resetOptions([
      'app',
      'loadingScreen',
      'autoplay',
      'controls',
      'appearance',
      'monitors',
      'cursor',
      'chunks'
    ]);
  }}
>
  <div>
    <h2>{$_('options.playerOptions')}</h2>

    <label>
      {$_('options.pageTitle')}
      <input type="text" bind:value={$options.app.windowTitle}>
    </label>
    <div>
      {$_('options.icon')}
      <ImageInput bind:file={$icon} previewSizes={[[64, 64], [32, 32], [16, 16]]} />
    </div>

    <h3>{$_('options.loadingScreen')}</h3>
    <label>
      <input type="checkbox" bind:checked={$options.loadingScreen.progressBar}>
      {$_('options.showProgressBar')}
    </label>
    <label>
      {$_('options.loadingScreenText')}
      <input type="text" bind:value={$options.loadingScreen.text} placeholder={$_('options.loadingScreenTextPlaceholder')}>
    </label>
    <div class="option-group">
      {$_('options.loadingScreenImage')}
      <!-- Display preview at image's native size -->
      <ImageInput bind:file={$loadingScreenImage} previewSizes={[['', '']]} />
    </div>
    {#if $loadingScreenImage}
      <label>
        <input type="radio" name="loading-screen-mode" value="normal" bind:group={$options.loadingScreen.imageMode}>
        {$_('options.sizeNormal')}
      </label>
      <label>
        <input type="radio" name="loading-screen-mode" value="stretch" bind:group={$options.loadingScreen.imageMode}>
        {$_('options.sizeStretch')}
      </label>
    {/if}

    <h3>{$_('options.controls')}</h3>
    <div class="option-group">
      <label>
        <input type="checkbox" bind:checked={$options.autoplay}>
        {$_('options.autoplay')}
      </label>
      {#if $options.autoplay}
        <div>
          {$_('options.autoplayHint')}
        </div>
      {/if}
    </div>
    <label>
      <input type="checkbox" bind:checked={$options.controls.greenFlag.enabled}>
      {$_('options.showFlag')}
    </label>
    <label>
      <input type="checkbox" bind:checked={$options.controls.stopAll.enabled}>
      {$_('options.showStop')}
    </label>
    <label>
      <input type="checkbox" bind:checked={$options.controls.pause.enabled}>
      {$_('options.showPause')}
    </label>
    <label>
      <input type="checkbox" bind:checked={$options.controls.fullscreen.enabled}>
      {$_('options.showFullscreen')}
    </label>
    <p>{$_('options.controlsHelp')}</p>

    <h3>{$_('options.colors')}</h3>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label>
      <ColorPicker bind:value={$options.appearance.background} />
      {$_('options.backgroundColor')}
    </label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label>
      <ColorPicker bind:value={$options.appearance.foreground} />
      {$_('options.foregroundColor')}
    </label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label>
      <ColorPicker bind:value={$options.appearance.accent} />
      {$_('options.accentColor')}
    </label>

    <h3>{$_('options.monitors')}</h3>
    <label>
      <input type="checkbox" bind:checked={$options.monitors.editableLists}>
      {$_('options.editableLists')}
    </label>

    <h3>{$_('options.interaction')}</h3>
    <div class="option-group">
      <label>
        <input type="radio" name="cursor-type" bind:group={$options.cursor.type} value="auto">
        {$_('options.normalCursor')}
      </label>
      <label>
        <input type="radio" name="cursor-type" bind:group={$options.cursor.type} value="none">
        {$_('options.noCursor')}
      </label>
      <label>
        <input type="radio" name="cursor-type" bind:group={$options.cursor.type} value="custom">
        {$_('options.customCursor')}
      </label>
    </div>
    {#if $options.cursor.type === 'custom'}
      <div in:slide|self>
        <ImageInput bind:file={$customCursorIcon} previewSizes={[[32, 32], [16, 16]]} />
        <p>{$_('options.cursorHelp')}</p>
      </div>
    {/if}

    <div class="option-group">
      <label>
        <input type="checkbox" bind:checked={$options.chunks.pointerlock}>
        {$_('options.pointerlock')}
      </label>
      <div>
        <a href="https://experiments.turbowarp.org/pointerlock/" target="_blank" rel="noopener">
          {$_('options.pointerlockHelp')}
        </a>
      </div>
    </div>

    <div class="option-group">
      <label>
        <input type="checkbox" bind:checked={$options.chunks.gamepad}>
        {$_('options.gamepad')}
      </label>
      <div>
        <a href="https://turbowarp.org/addons#gamepad" target="_blank" rel="noopener">
          {$_('options.gamepadHelp')}
        </a>
      </div>
    </div>
  </div>
</Section>

{#if cloudVariables.length > 0}
  <Section
    accent="#FF8C1A"
    reset={() => {
      resetOptions([
        'cloudVariables'
      ]);
    }}
  >
    <div>
      <h2>{$_('options.cloudVariables')}</h2>
      <label>
        {$_('options.mode')}
        <select bind:value={$options.cloudVariables.mode}>
          <option value="ws">{$_('options.cloudVariables-ws')}</option>
          <option value="local">{$_('options.cloudVariables-local')}</option>
          <option value="">{$_('options.cloudVariables-ignore')}</option>
          <option value="custom">{$_('options.cloudVariables-custom')}</option>
        </select>
      </label>
      {#if $options.cloudVariables.mode === "custom"}
        <div transition:slide|local>
          {#each cloudVariables as variable}
            <label>
              <select bind:value={$options.cloudVariables.custom[variable]}>
                <option value="ws">{$_('options.cloudVariables-ws')}</option>
                <option value="local">{$_('options.cloudVariables-local')}</option>
                <option value="">{$_('options.cloudVariables-ignore')}</option>
              </select>
              {variable}
            </label>
          {/each}
        </div>
      {/if}
      {#if $options.cloudVariables.mode === 'ws' || $options.cloudVariables.mode === 'custom'}
        <label transition:slide|local>
          {$_('options.cloudVariablesHost')}
          <input type="text" bind:value={$options.cloudVariables.cloudHost}>
        </label>
      {/if}
      <p>{$_('options.cloudVariables-ws-help')}</p>
      <p>{$_('options.cloudVariables-local-help')}</p>
      <p>{$_('options.cloudVariables-ignore-help')}</p>
      <p>{$_('options.cloudVariables-custom-help')}</p>
      <label>
        <input type="checkbox" bind:checked={$options.cloudVariables.specialCloudBehaviors}>
        {$_('options.specialCloudBehaviors')}
        <LearnMore slug="packager/special-cloud-behaviors" />
      </label>
    </div>
  </Section>
{/if}

<Section
  accent="#FF6680"
  reset={() => {
    resetOptions([
      'compiler',
      'resizeToFill',
      'extensions',
      'custom'
    ]);
  }}
>
  <div>
    <h2>{$_('options.advancedOptions')}</h2>
    <details>
      <summary>{$_('options.advancedSummary')}</summary>
      <label>
        <input type="checkbox" bind:checked={$options.compiler.enabled}>
        {$_('options.enableCompiler')}
        <LearnMore slug="disable-compiler" />
      </label>
      <label>
        <input type="checkbox" bind:checked={$options.compiler.warpTimer}>
        {$_('options.warpTimer')}
        <LearnMore slug="warp-timer" />
      </label>
      <label>
        <input type="checkbox" bind:checked={$options.resizeToFill}>
        {$_('options.dynamicResize')}
        <LearnMore slug="packager/dynamic-stage-resize" />
      </label>
      <!-- Ignore because CustomExtensions will have a <textarea> inside it -->
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label>
        {$_('options.customExtensions')}
        <!-- TODO: use the user-facing documentation when that becomes available -->
        <LearnMore slug="development/custom-extensions" />
        <CustomExtensions bind:extensions={$options.extensions} />
      </label>
      <label>
        {$_('options.customCSS')}
        <textarea bind:value={$options.custom.css}></textarea>
      </label>
      <label>
        {$_('options.customJS')}
        <textarea bind:value={$options.custom.js}></textarea>
      </label>
    </details>
  </div>
</Section>

<Section
  accent="#0FBD8C"
  reset={() => {
    resetOptions([
      'target'
    ])
  }}
>
  <div>
    <h2>{$_('options.environment')}</h2>
    <div class="option-group">
      <label>
        <input type="radio" name="environment" bind:group={$options.target} value="html">
        {$_('options.html')}
      </label>
      <label>
        <input type="radio" name="environment" bind:group={$options.target} value="zip">
        {$_('options.zip')}
      </label>
    </div>
    <div class="option-group">
      <label>
        <input type="radio" name="environment" bind:group={$options.target} value="electron-win32">
        {$_('options.application-win32').replace('{type}', 'Electron')}
      </label>
      <label>
        <input type="radio" name="environment" bind:group={$options.target} value="webview-mac">
        {$_('options.application-mac').replace('{type}', 'WKWebView')}
      </label>
      <label>
        <input type="radio" name="environment" bind:group={$options.target} value="electron-linux64">
        {$_('options.application-linux64').replace('{type}', 'Electron')}
      </label>
    </div>
    <details open={otherEnvironmentsInitiallyOpen}>
      <summary>{$_('options.otherEnvironments')}</summary>
      <p>{$_('options.otherEnvironmentsHelp')}</p>
      <div class="option-group">
        <label>
          <input type="radio" name="environment" bind:group={$options.target} value="zip-one-asset">
          {$_('options.zip-one-asset')}
        </label>
      </div>
      <div class="option-group">
        <label>
          <input type="radio" name="environment" bind:group={$options.target} value="electron-win64">
          {$_('options.application-win64').replace('{type}', 'Electron')}
        </label>
      </div>
      <div class="option-group">
        <label>
          <input type="radio" name="environment" bind:group={$options.target} value="nwjs-win32">
          {$_('options.application-win32').replace('{type}', 'NW.js')}
        </label>
        <label>
          <input type="radio" name="environment" bind:group={$options.target} value="nwjs-win64">
          {$_('options.application-win64').replace('{type}', 'NW.js')}
        </label>
        <label>
          <input type="radio" name="environment" bind:group={$options.target} value="nwjs-mac">
          {$_('options.application-mac').replace('{type}', 'NW.js')}
        </label>
        <label>
          <input type="radio" name="environment" bind:group={$options.target} value="nwjs-linux-x64">
          {$_('options.application-linux64').replace('{type}', 'NW.js')}
        </label>
      </div>
    </details>
  </div>
</Section>

{#if $options.target !== 'html'}
  <div in:fade|local>
    <Section
      accent="#FF661A"
      reset={$options.target === 'zip' ? null : () => {
        resetOptions([
          'app'
        ])
      }}
    >
      <div>
        {#if $options.target.startsWith('zip')}
          <h2>Zip</h2>
          <p>The zip environment is intended to be used for publishing to a website. Other uses such as sending your project to a friend over a chat app or email should use "Plain HTML" instead as zip will not work.</p>
        {:else}
          <h2>{$_('options.applicationSettings')}</h2>
          <label>
            {$_('options.packageName')}
            <input type="text" bind:value={$options.app.packageName} pattern="[a-zA-Z -]+" minlength="1">
          </label>
          <p>{$_('options.packageNameHelp')}</p>
        {/if}

        {#if $options.target.includes('win')}
          <div>
            <h2>Windows</h2>
            <p>To change the icon of the executable file or create an installer program, download and run <a href="https://github.com/TurboWarp/packager-extras/releases">TurboWarp Packager Extras</a> and select the output of this website.</p>
            <p>All Windows applications generated by this site are unsigned, so users may see SmartScreen warnings when they try to launch it for the first time.</p>
            {#if $options.target.includes('nwjs')}
              <p class="warning">NW.js support is deprecated and may be removed in the future. Use Electron instead if possible.</p>
            {/if}
            {#if $options.target.endsWith('64')}
              <p>The application will only run on 64-bit x86 computers.</p>
            {:else if $options.target.endsWith('32')}
              <p>The application will run on 32-bit and 64-bit x86 computers.</p>
              <p>If large projects tend to crash, use 64-bit only mode instead (in Other environments).</p>
            {/if}
          </div>
        {:else if $options.target.includes('mac')}
          <h2>macOS</h2>
          <p>Due to Apple policy, packaging for their platforms is troublesome. You either have to:</p>
          <ul>
            <li>Instruct users to ignore scary Gatekeeper warnings by opening Finder > Navigating to the application > Right click > Open > Open. This website generates applications that require this workaround.</li>
            <li>Or pay Apple $100/year for a developer account to sign and notarize the app (very involved process; reach out in feedback for more information)</li>
          </ul>
          {#if $options.target.includes('webview')}
            <h2>WKWebView</h2>
            <p>WKWebView is the fastest and smallest way to package for macOS. It should run natively (without Rosetta) on both Intel and Apple silicon Macs running macOS 10.12 or later.</p>
            <p>Note that:</p>
            <ul>
              <li>Video sensing and loudness blocks will not work</li>
              <li>Extremely memory intensive projects may not work well</li>
            </ul>
            <p>Use "Plain HTML" or "NW.js macOS Application" if these are problems for your project.</p>
          {:else if $options.target.includes('nwjs')}
            <h2>NW.js</h2>
            <p>NW.js runs natively on Intel Macs but will use Rosetta on Apple silicon Macs.</p>
            <p>For further help and steps, see <a href="https://docs.nwjs.io/en/latest/For%20Users/Package%20and%20Distribute/#mac-os-x">NW.js Documentation</a>.</p>
          {/if}
        {:else if $options.target.includes('linux')}
          <h2>Linux</h2>
          <p>Linux support is still experimental.</p>
          <p>The application will only run on 64-bit x86 computers. 32-bit computers, Raspberry Pis, and other ARM devices will not work.</p>
          {#if $options.target.includes('electron')}
            <p>The application is started by running <code>start.sh</code>.</p>
          {:else if $options.target.includes('nwjs')}
            <p class="warning">NW.js support is deprecated and may be removed in the future. Use Electron instead if possible.</p>
            <p>For further help and steps, see <a href="https://docs.nwjs.io/en/latest/For%20Users/Package%20and%20Distribute/#linux">NW.js Documentation</a>.</p>
          {/if}
        {/if}
      </div>
    </Section>
  </div>
{/if}

<Section>
  <Button on:click={pack} text={$_('options.package')} />
  <Button on:click={preview} secondary text={$_('options.preview')} />
</Section>

{#if result}
  <Section center>
    <p>
      <a href={result.url} download={result.filename}>
        {$_('options.download')
          .replace('{filename}', result.filename)
          .replace('{size}', (result.blob.size / 1000 / 1000).toFixed(2))}
      </a>
    </p>
  </Section>
{:else if !$progress.visible}
  <Section caption>
    <p>{$_('options.downloadsWillAppearHere')}</p>
  </Section>
{/if}
