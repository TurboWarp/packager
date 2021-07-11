<script>
  import {_} from '../locales';

  export let file;
  let fileInput;
  let dragging;

  $: url = file && URL.createObjectURL(file);
  $: if (!file && url) {
    URL.revokeObjectURL(url);
    url = null;
  }

  const ACCEPT = [
    '.png',
    '.jpg',
    '.jpeg',
    '.bmp',
    '.svg'
  ];

  const handleChange = (e) => {
    const files = e.target.files;
    file = files.length ? files[0] : null;
  };

  const clear = (e) => {
    e.stopPropagation();
    file = null;
  };

  const handleClickBackground = () => {
    fileInput.click();
  };

  const handleDragOver = (e) => {
    if (!e.dataTransfer.types.includes('Files')) {
      return;
    }
    e.preventDefault();
    dragging = true;
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragging = false;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragging = false;
    if (e.dataTransfer.types.includes('Files')) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && ACCEPT.some((ext) => droppedFile.name.endsWith(ext))) {
        file = droppedFile;
      }
    }
  };
</script>

<style>
  .container {
    color: #555;
    width: 100%;
    box-sizing: border-box;
    border: 5px dashed currentColor;
    transition: .2s border-color, .2s color;
    border-radius: 20px;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    user-select: none;
    position: relative;
    cursor: pointer;
  }
  :global([theme="dark"]) .container {
    color: #999;
  }
  .dragging,
  .container:focus {
    color: rgb(79, 123, 211);
  }
  :global([theme="dark"]) .dragging,
  :global([theme="dark"]) .container:focus {
    color: rgb(178, 195, 228);
  }
  .placeholder {
    font-size: 1.5em;
  }
  input[type=file] {
    display: none;
  }
  .selected {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }
  .selected > *:not(:last-child) {
    margin-right: 12px;
  }
</style>

<div
  class="container"
  class:dragging
  tabindex="0"
  on:click={handleClickBackground}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
  <input bind:this={fileInput} type="file" accept={ACCEPT.join(',')} on:change={handleChange}>
  {#if file}
    <div class="selected">
      <!-- TODO: consider display more sizes so people can see what their icon looks like when small -->
      <img src={url} alt="Project icon" width="64" height="64">
      <div>{$_('fileInput.selected').replace('{file}', file.name)}</div>
      <button on:click={clear}>{$_('fileInput.clear')}</button>
    </div>
  {:else}
    <div class="placeholder">{$_('fileInput.select')}</div>
  {/if}
</div>
