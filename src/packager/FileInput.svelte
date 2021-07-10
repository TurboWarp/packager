<script>
  export let file;
  export let accept;
  let fileInput;

  const handleChange = (e) => {
    const files = e.target.files;
    if (files.length) {
      file = files[0];
    } else {
      file = null;
    }
  };
</script>

<input bind:this={fileInput} type="file" on:change={handleChange} accept={accept}>

{#if file && fileInput.files.length === 0}
  (Selected {file.name} from previous visit)
{/if}
