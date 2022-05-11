<script>
  import Section from './Section.svelte';
  import {_} from '../locales';
  import {getJSZip} from '../packager/packager';
  import downloadURL from './download-url';
  import {isChromeOS} from './environment';

  export let name;
  export let url;
  export let blob;

  let zipping;

  const useAlternativeDownloadToBypassChromeOSBugs = async () => {
    // We've had a lot of bug reports about people on Chrome OS devices not being able to download
    // HTML files but being able to download zip files just fine. We're pretty sure that's not our
    // fault so we have to work around it (I want to blame whatever surveillance extensions
    // they're being forced to install).

    zipping = true;

    try {
      const JSZip = await getJSZip();
      const zip = new JSZip();
      zip.file(name, blob);
      const zippedBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE'
      });
      const newFileName = name.replace(/\.html$/, '.zip');
  
      const blobURL = URL.createObjectURL(zippedBlob);
      downloadURL(newFileName, blobURL);
      URL.revokeObjectURL(blobURL);
    } catch (e) {
      console.error(e);
    }

    zipping = false;
  };
</script>

<style>
  .alternative {
    font-size: smaller;
  }
</style>

{#if url}
  <Section center>
    <div>
      <p>
        <a href={url} download={name}>
          {$_('downloads.link')
            .replace('{size}', `${(blob.size / 1000 / 1000).toFixed(2)}MB`)
            .replace('{filename}', name)}
        </a>
      </p>
      {#if isChromeOS && name.endsWith('.html')}
        <p class="alternative">
          <button
            on:click={useAlternativeDownloadToBypassChromeOSBugs}
            disabled={zipping}
          >
            {#if zipping}
              {$_('downloads.workaroundInProgress')}
            {:else}
              {$_('downloads.useWorkaround')}
            {/if}
          </button>
        </p>
      {/if}
    </div>
  </Section>
{:else}
  <Section caption>
    <p>
      {$_('downloads.placeholder')}
    </p>
  </Section>
{/if}
