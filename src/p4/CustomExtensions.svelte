<script>
  export let value;

  let customExtensions = value.map(i => i.url).join('\n');
  $: value = customExtensions.split('\n').filter(i => i).map(i => ({url: i}));
</script>

<style>
  textarea {
    box-sizing: border-box;
    width: 100%;
    min-width: 100%;
    height: 100px;
  }
</style>

<textarea bind:value={customExtensions}></textarea>
