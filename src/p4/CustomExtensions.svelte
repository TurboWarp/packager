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
  value={extensions.join('\n')}
  on:change={(e) => {
    extensions = e.target.value.split('\n').filter(i => i);
  }}
></textarea>
