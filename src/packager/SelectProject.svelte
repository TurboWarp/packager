<script>
  import Section from './Section.svelte';
  import Button from './Button.svelte';
  import writablePersistentStore from './persistent-store';
  import {error, progress} from './stores';
  import xhr from './lib/xhr';
  import {UserError} from './errors';
  import {readAsArrayBuffer} from './lib/readers';

  export let projectData = null;
  const type = writablePersistentStore('SelectProject.type', 'id');
  const projectId = writablePersistentStore('SelectProject.id', 'https://scratch.mit.edu/projects/60917032/');
  let files = null;

  const reset = () => {
    projectData = null;
  };

  // Reset project whenever an input changes
  $: files, $projectId, $type, reset();

  const getId = () => {
    const match = $projectId.match(/\d+/);
    if (!match) {
      return null;
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

      let data;
      let uniqueId = '';
      let id = null;
      let projectTitle = '';

      if ($type === 'id') {
        id = getId();
        if (!id) {
          throw new UserError('Invalid project ID');
        }
        uniqueId = `#${id}`;

        $progress.text = 'Loading project metadata';
        try {
          const meta = await xhr({
            url: `https://trampoline.turbowarp.org/proxy/projects/${id}`,
            timeout: 5000,
            type: 'json'
          });
          projectTitle = meta.title;
        } catch (e) {
          // Happens commonly when loading unshared projects, not something to worry about
          console.warn(e);
        }

        $progress.text = 'Loading project data';
        data = await xhr({
          url: `https://projects.scratch.mit.edu/${id}`,
          type: 'arraybuffer',
          progressCallback: (p) => {
            $progress.progress = p;
          }
        });
      } else {
        if (!files) {
          throw new UserError('No file selected');
        }
        const file = files[0];
        uniqueId = `@${file.name}`;
        projectTitle = file.name;
        $progress.text = 'Reading project';
        data = await readAsArrayBuffer(file);
      }

      const progressTarget = new EventTarget();
      let totalAssets = 0;
      let loadedAssets = 0;
      progressTarget.addEventListener('asset-fetch', () => {
        totalAssets++;
        $progress.text = `Loading assets (${loadedAssets}/${totalAssets})`;
        $progress.progress = loadedAssets / totalAssets;
      });
      progressTarget.addEventListener('asset-fetched', () => {
        loadedAssets++;
        $progress.text = `Loading assets (${loadedAssets}/${totalAssets})`;
        $progress.progress = loadedAssets / totalAssets;
      });

      const loadProject = (await import('./lib/download-project')).default;
      const project = await loadProject(data, progressTarget);

      projectData = {
        projectId: id,
        uniqueId,
        title: projectTitle,
        project,
        stageVariables: project.stageVariables
      };
    } catch (e) {
      $error = e;
    }

    progress.reset();
  };
</script>

<style>
  input[type="text"] {
    width: 300px;
  }
</style>

<Section accent="#4C97FF">
  <h2>Choose Project</h2>
  <p>You can package projects from the Scratch website by copying their URL or from files from your computer. If you're using someone else's project, make sure to give them proper credit.</p>
  <div>
    <label>
      <input type="radio" bind:group={$type} value="id">
      Project ID or URL
    </label>
    {#if $type === "id"}
      <input type="text" bind:value={$projectId} on:keypress={(e) => {
        if (e.key === 'Enter') load();
      }}>
    {/if}
  </div>
  <div>
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
