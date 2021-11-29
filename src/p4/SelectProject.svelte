<script>
  import {onMount} from 'svelte';
  import {writable} from 'svelte/store';
  import {_} from '../locales';
  import Section from './Section.svelte';
  import Button from './Button.svelte';
  import DropArea from './DropArea.svelte';
  import writablePersistentStore from './persistent-store';
  import {progress, currentTask} from './stores';
  import {UserError} from './errors';
  import getProjectTitle from './get-project-meta';
  import loadProject from '../packager/load-project';
  import {extractProjectId, isValidURL, getTitleFromURL} from './url-utils';
  import Task from './task';

  const hasProjectIdInURL = location.hash && /^#\d+$/.test(location.hash);
  const initialProjectId = hasProjectIdInURL ? location.hash.substring(1) : '60917032';

  let type;
  let projectId;
  if (hasProjectIdInURL) {
    type = writable('id');
    projectId = writable(initialProjectId);
    onMount(() => {
      load();
    });
  } else {
    type = writablePersistentStore('SelectProject.type', 'id');
    projectId = writablePersistentStore('SelectProject.id', initialProjectId);
  }
  const projectUrl = writablePersistentStore('SelectProject.url', '');

  let files = null;
  let fileInputElement;

  export let projectData = null;
  const reset = () => {
    projectData = null;
  };

  // Reset project whenever an input changes
  $: files, $projectId, $type, reset(), currentTask.abort();

  const internalLoad = async (task) => {
    let uniqueId = '';
    let id = null;
    let projectTitle = '';
    let project;

    const progressCallback = (type, a, b) => {
      if (type === 'fetch') {
        task.setProgress(a);
      } else if (type === 'assets') {
        task.setProgressText(
          $_('progress.loadingAssets')
            .replace('{complete}', a)
            .replace('{total}', b)
        );
        task.setProgress(a / b);
      } else if (type === 'compress') {
        task.setProgressText($_('progress.compressingProject'));
        task.setProgress(a);
      }
    };

    if ($type === 'id') {
      id = $projectId;
      if (!id) {
        throw new UserError($_('select.invalidId'));
      }
      uniqueId = `#${id}`;
      task.setProgressText($_('progress.loadingProjectData'));
      const {promise: loadProjectPromise, terminate} = await loadProject.fromID(id, progressCallback);
      task.whenAbort(terminate);
      [projectTitle, project] = await Promise.all([
        getProjectTitle(id),
        loadProjectPromise
      ]);
    } else if ($type === 'file') {
      if (!files) {
        throw new UserError($_('select.noFileSelected'));
      }
      const file = files[0];
      uniqueId = `@${file.name}`;
      projectTitle = file.name;
      task.setProgressText($_('progress.compressingProject'));
      project = await (await loadProject.fromFile(file, progressCallback)).promise;
    } else if ($type === 'url') {
      const url = $projectUrl;
      if (!isValidURL(url)) {
        throw new UserError($_('select.invalidUrl'));
      }
      uniqueId = `$${url}`;
      projectTitle = getTitleFromURL(url);
      task.setProgressText($_('progress.loadingProjectData'));
      project = await (await loadProject.fromURL(url, progressCallback)).promise;
    } else {
      throw new Error('Unknown type');
    }

    return {
      projectId: id,
      uniqueId,
      title: projectTitle,
      project,
    };
  };

  const load = async () => {
    reset();
    const task = new Task();
    projectData = await task.do(internalLoad(task));
    task.done();
  };

  // just incase some non-number string was stored from older versions
  $projectId = extractProjectId($projectId);

  const getDisplayedProjectURL = () => `https://scratch.mit.edu/projects/${$projectId}`;

  const submitOnEnter = (e) => {
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
  const handleDrop = ({detail: dataTransfer}) => {
    const name = dataTransfer.files[0].name;
    if (name.endsWith('.sb') || name.endsWith('.sb2') || name.endsWith('.sb3')) {
      $type = 'file';
      files = dataTransfer.files;
      fileInputElement.files = files;
    }
  };

  // Automatically start loading when a file is selected
  $: if (files && files[0]) {
    load();
  }
</script>

<style>
  input[type="text"] {
    max-width: 300px;
    flex-grow: 1;
  }
  .option {
    min-height: 25px;
    display: flex;
    align-items: center;
  }
  input[type="text"], input[type="file"] {
    margin-left: 4px;
  }
</style>

<DropArea on:drop={handleDrop}>
  <Section accent="#4C97FF">
    <h2>{$_('select.select')}</h2>
    <p>{$_('select.selectHelp')}</p>
    <div class="option">
      <label>
        <input type="radio" name="project-type" bind:group={$type} value="id">
        {$_('select.id')}
      </label>
      {#if $type === "id"}
        <input type="text" value={getDisplayedProjectURL()} spellcheck="false" on:keypress={submitOnEnter} on:input={handleInput} on:focus={handleFocus}>
      {/if}
    </div>
    <div class="option">
      <label>
        <input type="radio"  name="project-type" bind:group={$type} value="file">
        {$_('select.file')}
      </label>
      <input hidden={$type !== "file"} bind:files={files} bind:this={fileInputElement} type="file" accept=".sb,.sb2,.sb3">
    </div>
    <div class="option">
      <label>
        <input type="radio" name="project-type" bind:group={$type} value="url">
        {$_('select.url')}
      </label>
      {#if $type === "url"}
        <input type="text" bind:value={$projectUrl} spellcheck="false" placeholder="https://..." on:keypress={submitOnEnter}>
      {/if}
    </div>
    <p>
      <Button on:click={load} text={$_('select.loadProject')} />
    </p>
  </Section>
</DropArea>

{#if !$progress.visible && !projectData}
  <Section caption>
    <p>{$_('select.loadToContinue')}</p>
  </Section>
{/if}
