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
  import {progress, currentTask, error} from './stores';
  import Preview from './preview';
  import deepClone from './deep-clone';
  import Packager from '../packager/web/export';
  import Task from './task';

  export let projectData;
  export let title;

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

  $: title = $options.app.windowTitle;

  const otherEnvironmentsInitiallyOpen = ![
    'html',
    'zip',
    'electron-win32',
    'webview-mac',
    'electron-linux64'
  ].includes($options.target);

  const automaticallyCenterCursor = () => {
    const icon = $customCursorIcon;
    const url = URL.createObjectURL(icon)
    const image = new Image();
    const cleanup = () => {
      image.onerror = null;
      image.onload = null;
      URL.revokeObjectURL(url);
    };
    image.onload = () => {
      $options.cursor.center.x = Math.round(image.width / 2);
      $options.cursor.center.y = Math.round(image.height / 2);
      cleanup();
    };
    image.onerror = () => {
      cleanup();
      $error = new Error('Image could not be loaded');
      throw $error;
    };
    image.src = url;
  };

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
    result.blob = new Blob([result.data], {
      type: result.type
    });
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
      let current = $options;
      let defaults = defaultOptions;
      const parts = key.split('.');
      const lastPart = parts.pop();
      for (const i of parts) {
        current = current[i];
        defaults = defaults[i];
      }
      current[lastPart] = deepClone(defaults[lastPart]);
    }
    $options = $options;
  };

  const resetAll = () => {
    if (confirm($_('reset.confirmAll'))) {
      resetOptions(Object.keys($options));
      $icon = null;
      $customCursorIcon = null;
      $loadingScreenImage = null;
    }
  };

  onDestroy(() => {
    if (result) {
      URL.revokeObjectURL(result.url);
    }
  });
</script>

<style>
  .option {
    display: block;
    margin: 4px 0;
  }
  .group {
    margin: 12px 0;
  }
  p {
    margin: 8px 0;
  }
  .group:last-child, .option:last-child, p:last-child {
    margin-bottom: 0;
  }
  textarea {
    box-sizing: border-box;
    width: 100%;
    min-width: 100%;
    height: 150px;
  }
  input[type="text"] {
    width: 200px;
  }
  input[type="text"].shorter {
    width: 150px;
  }
  input[type="number"] {
    width: 50px;
  }
  input:invalid {
    outline: 2px solid red;
  }
  .warning {
    font-weight: bold;
    background: yellow;
    color: black;
    padding: 12px;
    border-radius: 12px;
    margin: 12px 0;
  }
  .buttons {
    display: flex;
  }
  .button {
    margin-right: 4px;
  }
  .reset-button {
    margin-left: auto;
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
      'resizeMode',
      'username'
    ]);
  }}
>
  <div>
    <h2>{$_('options.runtimeOptions')}</h2>

    {#if hasSettingsStoredInProject}
      <div class="group">
        {$_('options.storedWarning')}
      </div>
    {/if}

    <label class="option">
      <input type="checkbox" bind:checked={$options.turbo}>
      {$_('options.turbo')}
    </label>
    <div class="option">
      <label>
        {$_('options.framerate')}
        <input type="number" min="0" max="240" bind:value={$options.framerate}>
      </label>
      <LearnMore slug="custom-fps" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" bind:checked={$options.interpolation}>
        {$_('options.interpolation')}
      </label>
      <LearnMore slug="interpolation" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" bind:checked={$options.highQualityPen}>
        {$_('options.highQualityPen')}
      </label>
      <LearnMore slug="high-quality-pen" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" checked={$options.maxClones === ALMOST_INFINITY} on:change={(e) => {
          $options.maxClones = e.target.checked ? ALMOST_INFINITY : 300;
        }}>
        {$_('options.infiniteClones')}
      </label>
      <LearnMore slug="infinite-clones" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" checked={!$options.fencing} on:change={(e) => {
          $options.fencing = !e.target.checked;
        }}>
        {$_('options.removeFencing')}
      </label>
      <LearnMore slug="remove-fencing" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" checked={!$options.miscLimits} on:change={(e) => {
          $options.miscLimits = !e.target.checked;
        }}>
        {$_('options.removeMiscLimits')}
      </label>
      <LearnMore slug="remove-misc-limits" />
    </div>
    <label class="option">
      {$_('options.username')}
      <input type="text" class="shorter" bind:value={$options.username}>
    </label>
    {#if $options.username !== defaultOptions.username && cloudVariables.length !== 0}
      <p class="warning">
        {$_('options.customUsernameWarning')}
      </p>
    {/if}

    <h3>{$_('options.stage')}</h3>
    <label class="option">
      {$_('options.stageSize')}
      <input type="number" min="1" max="4096" step="1" bind:value={$options.stageWidth}>
      &times;
      <input type="number" min="1" max="4096" step="1" bind:value={$options.stageHeight}>
      <LearnMore slug="custom-stage-size" />
    </label>
    <div class="group">
      <label class="option">
        <input type="radio" name="resize-mode" value="preserve-ratio" bind:group={$options.resizeMode}>
        {$_('options.preserveRatio')}
      </label>
      <label class="option">
        <input type="radio" name="resize-mode" value="stretch" bind:group={$options.resizeMode}>
        {$_('options.stretch')}
      </label>
      <label class="option">
        <input type="radio" name="resize-mode" value="dynamic-resize" bind:group={$options.resizeMode}>
        {$_('options.dynamicResize')}
        <LearnMore slug="packager/dynamic-stage-resize" />
      </label>
    </div>
  </div>
</Section>

<Section
  accent="#9966FF"
  reset={() => {
    $icon = null;
    $loadingScreenImage = null;
    resetOptions([
      'app.windowTitle',
      'loadingScreen',
      'autoplay',
      'controls',
      'appearance',
      'monitors',
    ]);
  }}
>
  <div>
    <h2>{$_('options.playerOptions')}</h2>

    <label class="option">
      {$_('options.pageTitle')}
      <input type="text" bind:value={$options.app.windowTitle}>
    </label>
    <div class="option">
      {$_('options.icon')}
      <ImageInput bind:file={$icon} previewSizes={[[64, 64], [32, 32], [16, 16]]} />
    </div>

    <h3>{$_('options.loadingScreen')}</h3>
    <label class="option">
      <input type="checkbox" bind:checked={$options.loadingScreen.progressBar}>
      {$_('options.showProgressBar')}
    </label>
    <label class="option">
      {$_('options.loadingScreenText')}
      <input type="text" bind:value={$options.loadingScreen.text} placeholder={$_('options.loadingScreenTextPlaceholder')}>
    </label>
    <div class="option">
      {$_('options.loadingScreenImage')}
      <!-- Display preview at image's native size -->
      <ImageInput bind:file={$loadingScreenImage} previewSizes={[['', '']]} />
    </div>
    {#if $loadingScreenImage}
      <label class="option">
        <input type="radio" name="loading-screen-mode" value="normal" bind:group={$options.loadingScreen.imageMode}>
        {$_('options.sizeNormal')}
      </label>
      <label class="option">
        <input type="radio" name="loading-screen-mode" value="stretch" bind:group={$options.loadingScreen.imageMode}>
        {$_('options.sizeStretch')}
      </label>
    {/if}

    <h3>{$_('options.controls')}</h3>
    <div class="group">
      <label class="option">
        <input type="checkbox" bind:checked={$options.autoplay}>
        {$_('options.autoplay')}
      </label>
      {#if $options.autoplay}
        {$_('options.autoplayHint')}
      {/if}
    </div>
    <label class="option">
      <input type="checkbox" bind:checked={$options.controls.greenFlag.enabled}>
      {$_('options.showFlag')}
    </label>
    <label class="option">
      <input type="checkbox" bind:checked={$options.controls.stopAll.enabled}>
      {$_('options.showStop')}
    </label>
    <label class="option">
      <input type="checkbox" bind:checked={$options.controls.pause.enabled}>
      {$_('options.showPause')}
    </label>
    <label class="option">
      <input type="checkbox" bind:checked={$options.controls.fullscreen.enabled}>
      {$_('options.showFullscreen')}
    </label>
    <p>{$_('options.controlsHelp')}</p>

    <h3>{$_('options.colors')}</h3>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="option">
      <ColorPicker bind:value={$options.appearance.background} />
      {$_('options.backgroundColor')}
    </label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="option">
      <ColorPicker bind:value={$options.appearance.foreground} />
      {$_('options.foregroundColor')}
    </label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="option">
      <ColorPicker bind:value={$options.appearance.accent} />
      {$_('options.accentColor')}
    </label>

    <h3>{$_('options.monitors')}</h3>
    <label class="option">
      <input type="checkbox" bind:checked={$options.monitors.editableLists}>
      {$_('options.editableLists')}
    </label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="option">
      <ColorPicker bind:value={$options.monitors.variableColor} />
      {$_('options.variableColor')}
    </label>
  </div>
</Section>

<Section
  accent="#4CBFE6"
  reset={() => {
    $customCursorIcon = null;
    resetOptions([
      'cursor',
      'chunks',
    ]);
  }}
>
  <div>
    <h2>{$_('options.interaction')}</h2>
    <div class="group">
      <label class="option">
        <input type="radio" name="cursor-type" bind:group={$options.cursor.type} value="auto">
        {$_('options.normalCursor')}
      </label>
      <label class="option">
        <input type="radio" name="cursor-type" bind:group={$options.cursor.type} value="none">
        {$_('options.noCursor')}
      </label>
      <label class="option">
        <input type="radio" name="cursor-type" bind:group={$options.cursor.type} value="custom">
        {$_('options.customCursor')}
      </label>
    </div>
    {#if $options.cursor.type === 'custom'}
      <div in:slide|self class="option">
        <ImageInput bind:file={$customCursorIcon} previewSizes={[[32, 32], [16, 16]]} />
        <p>{$_('options.cursorHelp')}</p>
        <label class="option">
          {$_('options.cursorCenter')}
          <!-- X: and Y: intentionally not translated -->
          X: <input type="number" min="0" bind:value={$options.cursor.center.x}>
          Y: <input type="number" min="0" bind:value={$options.cursor.center.y}>
          <button
            on:click={automaticallyCenterCursor}
            disabled={!$customCursorIcon}
          >
            {$_('options.automaticallyCenter')}
          </button>
        </label>
      </div>
    {/if}

    <div class="group">
      <label class="option">
        <input type="checkbox" bind:checked={$options.chunks.pointerlock}>
        {$_('options.pointerlock')}
      </label>
      <a href="https://experiments.turbowarp.org/pointerlock/" target="_blank" rel="noopener">
        {$_('options.pointerlockHelp')}
      </a>
    </div>

    <div class="group">
      <label class="option">
        <input type="checkbox" bind:checked={$options.chunks.gamepad}>
        {$_('options.gamepad')}
      </label>
      <a href="https://turbowarp.org/addons#gamepad" target="_blank" rel="noopener">
        {$_('options.gamepadHelp')}
      </a>
    </div>
  </div>
</Section>

<Section
  accent="#FF8C1A"
  reset={cloudVariables.length === 0 ? null : () => {
    resetOptions([
      'cloudVariables'
    ]);
  }}
>
  <div>
    <h2>{$_('options.cloudVariables')}</h2>

    {#if cloudVariables.length > 0}
      <label class="option">
        {$_('options.mode')}
        <select bind:value={$options.cloudVariables.mode}>
          <option value="ws">{$_('options.cloudVariables-ws')}</option>
          <option value="local">{$_('options.cloudVariables-local')}</option>
          <option value="">{$_('options.cloudVariables-ignore')}</option>
          <option value="custom">{$_('options.cloudVariables-custom')}</option>
        </select>
      </label>

      {#if $options.cloudVariables.mode === "custom"}
        <div transition:fade|local>
          {#each cloudVariables as variable}
            <label class="option">
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
        <div transition:fade|local>
          <label class="option">
            {$_('options.cloudVariablesHost')}
            <input type="text" bind:value={$options.cloudVariables.cloudHost}>
          </label>
        </div>
      {/if}

      <p>{$_('options.cloudVariables-ws-help')}</p>
      <p>{$_('options.cloudVariables-local-help')}</p>
      <p>{$_('options.cloudVariables-ignore-help')}</p>
      <p>{$_('options.cloudVariables-custom-help')}</p>

      <div class="option">
        <label>
          <input type="checkbox" bind:checked={$options.cloudVariables.specialCloudBehaviors}>
          {$_('options.specialCloudBehaviors')}
        </label>
        <LearnMore slug="packager/special-cloud-behaviors" />
      </div>

      <div class="option">
        <label>
          <input type="checkbox" bind:checked={$options.cloudVariables.unsafeCloudBehaviors}>
          {$_('options.unsafeCloudBehaviors')}
        </label>
        <LearnMore slug="packager/special-cloud-behaviors#eval" />
      </div>
      {#if $options.cloudVariables.unsafeCloudBehaviors}
        <p class="warning">{$_('options.unsafeCloudBehaviorsWarning')}</p>
      {/if}
      <p>{$_('options.implicitCloudHint').replace('{cloud}', '☁')}</p>
    {:else}
      <p>{$_('options.noCloudVariables')}</p>
    {/if}
  </div>
</Section>

<Section
  accent="#FF6680"
  reset={() => {
    resetOptions([
      'compiler',
      'extensions',
      'custom',
      'projectId'
    ]);
  }}
>
  <div>
    <h2>{$_('options.advancedOptions')}</h2>
    <details>
      <summary>{$_('options.advancedSummary')}</summary>

      <div class="option">
        <label>
          <input type="checkbox" bind:checked={$options.compiler.enabled}>
          {$_('options.enableCompiler')}
        </label>
        <LearnMore slug="disable-compiler" />
      </div>
      <div class="option">
        <label>
          <input type="checkbox" bind:checked={$options.compiler.warpTimer}>
          {$_('options.warpTimer')}
        </label>
        <LearnMore slug="warp-timer" />
      </div>

      <!-- Ignore because CustomExtensions will have a <textarea> inside it -->
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="option">
        {$_('options.customExtensions')}
        <!-- TODO: use the user-facing documentation when that becomes available -->
        <LearnMore slug="development/custom-extensions" />
        <CustomExtensions bind:extensions={$options.extensions} />
      </label>

      <label class="option">
        {$_('options.customCSS')}
        <textarea bind:value={$options.custom.css}></textarea>
      </label>
      <label class="option">
        {$_('options.customJS')}
        <textarea bind:value={$options.custom.js}></textarea>
      </label>

      <label class="option">
        {$_('options.projectId')}
        <input type="text" bind:value={$options.projectId}>
      </label>
      <p>{$_('options.projectIdHelp')}</p>
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

    <div class="group">
      <label class="option">
        <input type="radio" name="environment" bind:group={$options.target} value="html">
        {$_('options.html')}
      </label>
      <label class="option">
        <input type="radio" name="environment" bind:group={$options.target} value="zip">
        {$_('options.zip')}
      </label>
    </div>

    <div class="group">
      <label class="option">
        <input type="radio" name="environment" bind:group={$options.target} value="electron-win32">
        {$_('options.application-win32').replace('{type}', 'Electron')}
      </label>
      <label class="option">
        <input type="radio" name="environment" bind:group={$options.target} value="webview-mac">
        {$_('options.application-mac').replace('{type}', 'WKWebView')}
      </label>
      <label class="option">
        <input type="radio" name="environment" bind:group={$options.target} value="electron-linux64">
        {$_('options.application-linux64').replace('{type}', 'Electron')}
      </label>
    </div>

    <div class="group">
      <label class="option">
        <input type="radio" name="environment" bind:group={$options.target} value="android">
        {$_('options.application-android')}
      </label>
    </div>

    <details open={otherEnvironmentsInitiallyOpen}>
      <summary>{$_('options.otherEnvironments')}</summary>
      <p>{$_('options.otherEnvironmentsHelp')}</p>
      <div class="group">
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="zip-one-asset">
          {$_('options.zip-one-asset')}
        </label>
      </div>
      <div class="group">
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="electron-win64">
          {$_('options.application-win64').replace('{type}', 'Electron')}
        </label>
      </div>
      <div class="group">
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="nwjs-win32">
          {$_('options.application-win32').replace('{type}', 'NW.js')}
        </label>
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="nwjs-win64">
          {$_('options.application-win64').replace('{type}', 'NW.js')}
        </label>
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="nwjs-mac">
          {$_('options.application-mac').replace('{type}', 'NW.js')}
        </label>
        <label class="option">
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
      reset={$options.target.startsWith('zip') ? null : () => {
        resetOptions([
          'app.packageName',
          'app.windowMode'
        ]);
      }}
    >
      <div>
        {#if $options.target.startsWith('zip')}
          <h2>Zip</h2>
          <p>The zip environment is intended to be used for publishing to a website. Other uses such as sending your project to a friend over a chat app or email should use "Plain HTML" instead as zip will not work.</p>
        {:else}
          <h2>{$_('options.applicationSettings')}</h2>
          <label class="option">
            {$_('options.packageName')}
            <input type="text" bind:value={$options.app.packageName} pattern="[a-zA-Z -]+" minlength="1">
          </label>
          <p>{$_('options.packageNameHelp')}</p>

          {#if $options.target.includes('electron')}
            <div class="group">
              <label class="option">
                <input type="radio" name="app-window-mode" bind:group={$options.app.windowMode} value="window">
                {$_('options.startWindow')}
              </label>
              <label class="option">
                <input type="radio" name="app-window-mode" bind:group={$options.app.windowMode} value="maximize">
                {$_('options.startMaximized')}
              </label>
              <label class="option">
                <input type="radio" name="app-window-mode" bind:group={$options.app.windowMode} value="fullscreen">
                {$_('options.startFullscreen')}
              </label>
            </div>
          {/if}

          <div class="warning">
            <div>Creating native applications for specific platforms is discouraged. In most cases, Plain HTML or Zip will have numerous advantages:</div>
            <ul>
              <li>Can be run directly from a website on any platform, even phones</li>
              <li>Users are significantly less likely to be suspicious of a virus</li>
              <li>Significantly smaller file size</li>
              <li>Can still be downloaded locally and run offline</li>
            </ul>
            <div>If you don't truly need to make a self-contained application for each platform (we understand there are some cases where this is necessary), we recommend you don't.</div>
          </div>

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
                <p>If your project is very large and crashes often, use 64-bit only mode instead (in Other environments) as it can access more memory.</p>
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
          {:else if $options.target === 'android'}
            <h2>Android</h2>

            <div class="warning">
              Unlike the other environments, Android support is not fully automated. You must manually create an app. This section will try to guide you through the process.
            </div>

            <p>This section assumes you have full access (including adminstrator/root) to a Windows, macOS, or Linux computer.</p>
            <p>Parts of this section may be generated by various options selected above.</p>

            <h3>Install Android Studio</h3>
            <p><a href="https://developer.android.com/studio/">Install Android Studio.</a></p>
            <p>This is quite large and may take a while.</p>

            <h3>Create a new project</h3>
            <p>Create a new project in Android Studio.</p>
            <ul>
              <li>Use the "Empty Activity" template</li>
              <li>Set Name to your app's name, for example "<code>{$options.app.windowTitle}</code>"</li>
              <li>Set Package name to "<code>org.turbowarp.packager.userland.{$options.app.packageName}</code>"</li>
              <li>Choose a save location that you won't forget</li>
              <li>Set Language to "Kotlin"</li>
              <li>Set Minimum SDK to "API 21: Android 5.0 (Lollipop)"</li>
            </ul>

            <h3>Create assets folder</h3>
            <p>In the sidebar on the left, right click on "app", then select "New" > "Folder" > "Assets folder". Use the default settings.</p>

            <h3>Prepare project</h3>
            <p>
              <Button on:click={pack} text={'Package the project as a zip'} />
            </p>
            <p>Extract the zip and drag its files into "assets" folder you created. (You can directly drag and drop files over the assets folder in Android Studio)</p>

            <h3>Making the app</h3>
            <p>In the sidebar on the left, navigate to app > src > main > MainActivity. This will open a short Kotlin file.</p>
            <p>Replace everything after line 2 with the following:</p>
            <pre>
              {[
                'import android.annotation.SuppressLint',
                'import androidx.appcompat.app.AppCompatActivity',
                'import android.os.Bundle',
                'import android.webkit.WebView',
                '',
                'class MainActivity : AppCompatActivity() {',
                '    private lateinit var web: WebView',
                '',
                '    @SuppressLint("SetJavaScriptEnabled")',
                '    override fun onCreate(savedInstanceState: Bundle?) {',
                '        super.onCreate(savedInstanceState)',
                '        web = WebView(this)',
                '        web.settings.javaScriptEnabled = true',
                '        web.loadUrl("file:///android_asset/index.html")',
                '        setContentView(web)',
                '        actionBar?.hide()',
                '        supportActionBar?.hide()',
                '    }',
                '',
                '    override fun onDestroy() {',
                '        super.onDestroy()',
                '        web.destroy()',
                '    }',
                '}'
              ].join('\n')}
            </pre>
            <p>Make sure to leave the first line that says <code>package ...</code></p>
            <p>At this point, you have a functional Android app. However, there are still a few more things you should change.</p>

            <h3>Fixing screen orientation issues</h3>
            <p>In the sidebar on the left, open app > main > AndroidManifest.xml</p>
            <p>Find the section that looks like this:</p>
            <pre>
              {[
                '        <activity',
                '            android:name=".MainActivity"',
                '            android:exported="true">',
              ].join('\n')}
            </pre>
            <p>And replace it with this:</p>
            <pre>
              {[
                '        <activity',
                '            android:configChanges="orientation|screenSize"',
                '            android:screenOrientation="sensor"',
                '            android:name=".MainActivity"',
                '            android:exported="true">',
              ].join('\n')}
            </pre>

            <h3>Updating colors</h3>
            <p>Currently the app has a purple color scheme, which may not be what you want. This can be changed.</p>
            <p>In the sidebar on the left, open app > main > res > values > color.xml.</p>
            <p>You will see these lines:</p>
            <pre>
              {[
                '    <color name="purple_200">#FFBB86FC</color>',
                '    <color name="purple_500">#FF6200EE</color>',
                '    <color name="purple_700">#FF3700B3</color>',
              ].join('\n')}
            </pre>
            <p>Replace those lines with: (the following snippet is generated according to your configured background color)</p>
            <pre>
              {[
                `    <color name="purple_200">#FF${$options.appearance.background.substr(1)}</color>`,
                `    <color name="purple_500">#FF${$options.appearance.background.substr(1)}</color>`,
                `    <color name="purple_700">#FF${$options.appearance.background.substr(1)}</color>`,
              ].join('\n')}
            </pre>
            <p>Do not change the other lines.</p>
            <p>For advanced users, note that these color codes are a bit unusual in that the "alpha" or "transparency" byte (typically <code>255</code> or <code>FF</code>) goes first instead of last.</p>
            <p>Ignore the bits about <code>purple_yyy</code>; just leave them as is. It would typically be a good idea to rename these colors, but you will be making more work for yourself because you'll have to update some other files to reflect the new names.</p>

            <h3>Updating the project</h3>
            <p>It's likely that at some point you will want to update the project without redoing this entire guide. Updating a project is much simpler:</p>
            <ol>
              <li>Open Android Studio and open the project</li>
              <li>Delete everything inside the assets folder</li>
              <li>Re-run the packager</li>
              <li>Extract the zip and put all of its files into the assets folder</li>
            </ol>
          {/if}
        {/if}
      </div>
    </Section>
  </div>
{/if}

<Section>
  <div class="buttons">
    <div class="button">
      <Button on:click={pack} text={$_('options.package')} />
    </div>
    <div clas="button">
      <Button on:click={preview} secondary text={$_('options.preview')} />
    </div>
    <div class="reset-button">
      <Button on:click={resetAll} dangerous text={$_('options.resetAll')} />
    </div>
  </div>
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
