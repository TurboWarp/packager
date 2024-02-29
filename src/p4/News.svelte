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
    <p><span class="badge">New!</span> (February 28, 2024)</p>
    <p>We have changed the license of the packager and the TurboWarp runtime from the Apache 2.0 license to the GNU Lesser General Public License version 3.</p>
    <p>You can still package closed-source or commercial projects <a href="https://docs.turbowarp.org/packager/commercial-use">the same as always</a>; this is just to ensure that forks of the packager itself have to be open source too.</p>
    <p>If this is a problem for you, the previous version of the packager <a href="https://packager-legacy.turbowarp.org/">is still available</a>.</p>
  </div>
</Section>

