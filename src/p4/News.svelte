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
      By default, Electron apps will no longer be throttled when minimized or hidden.
      There is an option to restore the old behavior.
    </p>
  </div>
</Section>
