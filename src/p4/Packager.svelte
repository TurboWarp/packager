<script>
  import ProjectPackager from '../packager/';
  import downloadFile from './download-file';

  const pack = async () => {
    const packager = new ProjectPackager();
    await packager.loadProjectById('1');
    await packager.loadResources();
    const result = await packager.package();
    downloadFile(result, 'test.html');
  };
</script>

<button on:click={pack}>Package</button>
