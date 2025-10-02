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
</style>

<Section accent={color}>
  <div lang="en">
    <p>
      <span class="badge">New!</span>
    </p>
    <p>
      We've updated the packager to use the <a href="https://docs.turbowarp.org/new-compiler">new compiler</a> to make projects run even faster.
    </p>
    <p>
      If your project relies on extensions that require the old compiler, a version of the packager using the old compiler will be available on <a href="https://packager-legacy.turbowarp.org/">packager-legacy.turbowarp.org</a> indefinitely.
    </p>
  </div>
</Section>
