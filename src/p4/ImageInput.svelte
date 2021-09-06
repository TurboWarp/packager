<script>
  import {_} from '../locales';
  import DropArea from './DropArea.svelte';

  const ACCEPT = [
    '.png',
    '.jpg',
    '.jpeg',
    '.bmp',
    '.svg',
    '.ico',
    '.gif'
  ];

  export let file;
  export let previewSizes;
  let dropping;
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

  const handleDrop = ({detail: dataTransfer}) => {
    const droppedFile = dataTransfer.files[0];
    if (ACCEPT.some((ext) => droppedFile.name.endsWith(ext))) {
      file = droppedFile;
    }
  };
</script>

<style>
  .container {
    background: transparent;
    color: #555;
    width: 100%;
    box-sizing: border-box;
    border: 3px dashed currentColor;
    transition: .2s border-color, .2s color;
    border-radius: 20px;
    min-height: 90px;
    font: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    padding: 4px;
  }
  :global([theme="dark"]) .container {
    color: #aaa;
  }
  .dropping,
  .container:focus-visible,
  .container:active {
    color: rgb(79, 123, 211);
  }
  :global([theme="dark"]) .dropping,
  :global([theme="dark"]) .container:focus-visible,
  :global([theme="dark"]) .container:active {
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

<DropArea bind:dropping={dropping} on:drop={handleDrop}>
  <button class="container" class:dropping on:click={handleClickBackground}>
    {#if file}
      <div class="selected">
        {#each previewSizes as size}
          <!-- svelte-ignore a11y-missing-attribute -->
          <img src={url} width={size[0]} height={size[1]}>
        {/each}
        <div>{$_('fileInput.selected').replace('{file}', file.name)}</div>
        <button on:click={clear}>{$_('fileInput.clear')}</button>
      </div>
    {:else}
      <div class="placeholder">{$_('fileInput.select')}</div>
    {/if}
  </button>
</DropArea>
