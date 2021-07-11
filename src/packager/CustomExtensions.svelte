<script>
  export let value;

  let customExtensions = value.map(i => i.url).join('\n');
  $: value = customExtensions.split('\n').filter(i => i).map(i => ({url: i}));
</script>

<style>
  textarea {
    display: block;
    width: 100%;
    height: 100px;
    box-sizing: border-box;
  }
</style>

<textarea bind:value={customExtensions}></textarea>
