<script>
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
          $progress.text = `Loading assets (${a}/${b})`;
          $progress.progress = a / b;
        } else if (type === 'compress') {
          $progress.text = 'Compressing project';
          $progress.progress = a;
        }
      };

      if ($type === 'id') {
        id = $projectId;
        if (!id) {
          throw new UserError('Invalid project ID');
        }
        uniqueId = `#${id}`;
        $progress.text = 'Loading project metadata';
        projectTitle = await getProjectTitle(id);
        $progress.text = 'Loading project data';
        project = await loadProject.fromID(id, progressCallback);
      } else {
        if (!files) {
          throw new UserError('No file selected');
        }
        const file = files[0];
        uniqueId = `@${file.name}`;
        projectTitle = file.name;
        $progress.text = 'Reading project';
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
  <h2>Select Project</h2>
  <p>You can package projects from the Scratch website by copying their URL or you can package files from your computer. If you're using someone else's project, make sure to give them proper credit.</p>
  <div class="option">
    <label>
      <input type="radio" bind:group={$type} value="id">
      Project ID or URL
    </label>
    {#if $type === "id"}
      <input type="text" value={getDisplayedProjectURL()} spellcheck="false" on:keypress={handleKeyPress} on:input={handleInput} on:focus={handleFocus}>
    {/if}
  </div>
  <div class="option">
    <label>
      <input type="radio" bind:group={$type} value="file">
      File
    </label>
    {#if $type === "file"}
      <input bind:files={files} type="file" accept=".sb,.sb2,.sb3">
    {/if}
  </div>

  <p>
    <Button on:click={load} disabled={$progress.visible}>Load Project</Button>
  </p>
</Section>

{#if !$progress.visible && !projectData}
  <Section caption>
    <p>Load a project to continue</p>
  </Section>
{/if}
