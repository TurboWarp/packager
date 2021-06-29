<script>
  import {_} from 'svelte-i18n';
  import Section from './Section.svelte';
  import Button from './Button.svelte';
  import writablePersistentStore from './persistent-store';
  import {error, progress} from './stores';
  import {UserError} from './errors';
  import loadProject from './load-project';
  import getProjectTitle from './lib/get-project-meta.js';
  import analytics from './analytics';

  export let projectData = null;
  const type = writablePersistentStore('SelectProject.type', 'id');
  const projectId = writablePersistentStore('SelectProject.id', '60917032');
  let files = null;

  const reset = () => {
    projectData = null;
  };

  // Reset project whenever an input changes
  $: files, $projectId, $type, reset();

  const extractProjectId = (text) => {
    const match = text.match(/\d+/);
    if (!match) {
      return '';
    }
    return match[0];
  };

  const load = async () => {
    if ($progress.visible) {
      // Already running something
      return;
    }

    try {
      reset();
      $progress.visible = true;

      let uniqueId = '';
      let id = null;
      let projectTitle = '';
      let project;

      const progressCallback = (type, a, b) => {
        if (type === 'fetch') {
          $progress.progress = a;
        } else if (type === 'assets') {
          $progress.text = $_('progress.loadingAssets', {
            values: {
              loaded: a,
              total: b
            }
          });
          $progress.progress = a / b;
        } else if (type === 'compress') {
          $progress.text = $_('progress.compressingProject');
          $progress.progress = a;
        }
      };

      if ($type === 'id') {
        id = $projectId;
        if (!id) {
          throw new UserError($_('select.invalidId'));
        }
        uniqueId = `#${id}`;
        $progress.text = $_('progress.loadingProjectMetadata');
        projectTitle = await getProjectTitle(id);
        $progress.text = $_('progress.loadingProjectData');
        project = await loadProject.fromID(id, progressCallback);
      } else {
        if (!files) {
          throw new UserError($_('select.noFileSelected'));
        }
        const file = files[0];
        uniqueId = `@${file.name}`;
        projectTitle = file.name;
        $progress.text = $_('progress.readingProject');
        project = await loadProject.fromFile(file, progressCallback);
      }

      projectData = {
        projectId: id,
        uniqueId,
        title: projectTitle,
        project,
      };

      analytics.sendEvent('Load Project');
    } catch (e) {
      $error = e;
    }

    progress.reset();
  };

  // just incase some non-number string was stored from older versions
  $projectId = extractProjectId($projectId);

  const getDisplayedProjectURL = () => `https://scratch.mit.edu/projects/${$projectId}`;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
      load();
    }
  };
  const handleInput = (e) => {
    $projectId = extractProjectId(e.target.value);
    e.target.value = getDisplayedProjectURL();
  };
  const handleFocus = (e) => {
    e.target.select();
  };
</script>

<style>
  input[type="text"] {
    max-width: 300px;
    flex-grow: 1;
  }
  .option {
    height: 25px;
    display: flex;
    align-items: center;
  }
  input[type="text"], input[type="file"] {
    margin-left: 4px;
  }
</style>

<Section accent="#4C97FF">
  <h2>{$_('select.select')}</h2>
  <p>{$_('select.selectHelp')}</p>
  <div class="option">
    <label>
      <input type="radio" bind:group={$type} value="id">
      {$_('select.idOrUrl')}
    </label>
    {#if $type === "id"}
      <input type="text" value={getDisplayedProjectURL()} spellcheck="false" on:keypress={handleKeyPress} on:input={handleInput} on:focus={handleFocus}>
    {/if}
  </div>
  <div class="option">
    <label>
      <input type="radio" bind:group={$type} value="file">
      {$_('select.file')}
    </label>
    {#if $type === "file"}
      <input bind:files={files} type="file" accept=".sb,.sb2,.sb3">
    {/if}
  </div>

  <p>
    <Button on:click={load} disabled={$progress.visible}>{$_('select.loadProject')}</Button>
  </p>
</Section>

{#if !$progress.visible && !projectData}
  <Section caption>
    <p>{$_('select.loadToContinue')}</p>
  </Section>
{/if}
