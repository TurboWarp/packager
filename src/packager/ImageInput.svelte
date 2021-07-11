<script>
  import {_} from '../locales';

  const ACCEPT = [
    '.png',
    '.jpg',
    '.jpeg',
    '.bmp',
    '.svg',
    '.ico'
  ];

  export let file;
  let dragging;
  let url;

  // This is a bit strange, there's probably a better way to do this
  // Seems to create and revoke an extra object URL for each file for some reason
  $: if (file) {
    if (url) {
      URL.revokeObjectURL(url);
    }
    url = URL.createObjectURL(file);
  } else if (url) {
    URL.revokeObjectURL(url);
    url = null;
  }

  const clear = (e) => {
    e.stopPropagation();
    file = null;
  };

  const handleClickBackground = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPT.join(',');
    input.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files.length) {
        file = files[0];
      } else {
        file = null;
      }
    });
    document.body.appendChild(input);
    input.click();
    input.remove();
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
    min-height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    overflow: hidden;
    user-select: none;
    position: relative;
    cursor: pointer;
    padding: 4px;
  }
  :global([theme="dark"]) .container {
    color: #aaa;
  }
  .dragging,
  .container:focus-visible {
    color: rgb(79, 123, 211);
  }
  :global([theme="dark"]) .dragging,
  :global([theme="dark"]) .container:focus-visible {
    color: rgb(178, 195, 228);
  }
  .placeholder {
    font-size: 1.5em;
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
  role="button"
  tabindex="0"
  on:click={handleClickBackground}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
  {#if file}
    <div class="selected">
      <!-- svelte-ignore a11y-missing-attribute -->
      <img src={url} width="64" height="64">
      <!-- svelte-ignore a11y-missing-attribute -->
      <img src={url} width="32" height="32">
      <!-- svelte-ignore a11y-missing-attribute -->
      <img src={url} width="16" height="16">
      <div>{$_('fileInput.selected').replace('{file}', file.name)}</div>
      <button on:click={clear}>{$_('fileInput.clear')}</button>
    </div>
  {:else}
    <div class="placeholder">{$_('fileInput.select')}</div>
  {/if}
</div>
