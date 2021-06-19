<script>
  import Section from './Section.svelte';
  import Button from './Button.svelte';
  import writablePersistentStore from './persistent-store';
  import {error, progress} from './stores';
  import loadProject from './load-project';
  import xhr from './lib/xhr';
  import {UserError} from './errors';
  import {readAsArrayBuffer} from './lib/readers';

  export let projectData = null;
  const type = writablePersistentStore('SelectProject.type', 'id');
  const projectId = writablePersistentStore('SelectProject.id', '1');
  let files = null;

  const reset = () => {
    projectData = null;
  };

  // Reset project whenever an input changes
  $: files, $projectId, $type, reset();

  const load = async () => {
    try {
      reset();
      $progress.visible = true;

      let data;
      let uniqueId = '';
      let id = null;
      let projectTitle = '';

      if ($type === 'id') {
        const match = $projectId.match(/\d+/);
        if (!match) {
          throw new UserError('Invalid project ID');
        }
        id = match[0];
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

      $progress.text = 'Loading packager';
      const vm = await loadProject(data, (loadedAssets, totalAssets) => {
        $progress.text = `Loading assets (${loadedAssets}/${totalAssets})`;
        $progress.progress = loadedAssets / totalAssets;
      });

      $progress.text = 'Compressing project';
      const serialized = await vm.saveProjectSb3();
      const stageVariables = vm.runtime.getTargetForStage().variables;
      vm.clear();

      projectData = {
        projectId: id,
        uniqueId,
        title: projectTitle,
        stageVariables,
        serialized
      };
    } catch (e) {
      $error = e;
    }

    progress.reset();
  };
</script>

<style>

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
      <input type="text" bind:value={$projectId}>
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
