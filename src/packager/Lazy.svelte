<script>
  import {fade} from 'svelte/transition';
  import Section from './Section.svelte';

  export let component;
  let loadedComponent;

  component().then((m) => {
    loadedComponent = m.default;
  });
</script>

{#if loadedComponent}
  <div in:fade>
    <svelte:component this={loadedComponent} {...$$props} />
  </div>
{:else}
  <Section center>
    <p>Loading...</p>
  </Section>
{/if}
