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
      We've updated the packager to use the <a href="https://docs.turbowarp.org/new-compiler">new compiler</a>.
    </p>
    <p>
      If you need the old compiler still, you can access it on <a href="https://packager-legacy.turbowarp.org/">packager-legacy.turbowarp.org</a>.
    </p>
  </div>
</Section>
