<script>
  export let extensions;
</script>

<style>
  textarea {
    box-sizing: border-box;
    width: 100%;
    min-width: 100%;
    height: 100px;
  }
</style>

<textarea
  value={extensions.map(i => i.url).join('\n')}
  on:change={(e) => {
    extensions = e.target.value.split('\n').filter(i => i).map(i => ({url: i}));
  }}
></textarea>
