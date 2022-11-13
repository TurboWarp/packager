<script>
  import Section from './Section.svelte';
  const color = '#b117f8';
</script>

<style>
  .badge {
    background-color: #b117f8;
    border-bottom: 2px solid #6f0073;
    color: white;
    padding: 2px 5px;
    border-radius: 4px;
  }
  ul {
    margin: 0;
  }
</style>

<Section accent={color}>
  <div lang="en">
    <p><span class="badge">New!</span> A lot of custom extension updates:</p>
    <ul>
      <li>Custom extensions are loaded unsandboxed in the packager</li>
      <li>The packager automatically detects which custom extensions the project needs (requires recent version of TurboWarp, desktop app not updated yet)</li>
      <li>Custom extensions will be downloaded and embedded into the packaged project so that it's self contained and works offline (doesn't work for all extensions, can be turned off in advanced settings)</li>
    </ul>
  </div>
</Section>
