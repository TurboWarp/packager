<script>
  import Section from './Section.svelte';
  import {_} from '../locales';

  export let name;
  export let url;
  export let byteLength;
</script>

{#if name && url && byteLength}
  <Section center>
    <p>
      <a href={url} download={name}>
        {$_('downloads.link')
          .replace('{size}', `${(byteLength / 1000 / 1000).toFixed(2)}MB`)
          .replace('{filename}', name)}
      </a>
    </p>
  </Section>
{:else}
  <Section caption>
    <p>
      {$_('downloads.placeholder')}
    </p>
  </Section>
{/if}
