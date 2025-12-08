<script>
  import ResetButton from './ResetButton.svelte';

  export let caption = false;
  export let center = false;
  export let modal = false;
  export let accent = '';
  export let reset;
</script>

<style>
  .card {
    position: relative;
    max-width: 720px;
    margin: auto;
    border-radius: 12px;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(247, 250, 255, 0.95));
    padding: 1.25em 1.4em 1.3em 1.4em;
    margin-top: 1.2em;
    margin-bottom: 1.2em;
    box-shadow: 0 18px 35px rgba(27, 38, 54, 0.12), 0 6px 18px rgba(27, 38, 54, 0.08);
    border: 1px solid rgba(39, 56, 82, 0.08);
    overflow: hidden;
  }
  :global([theme="dark"]) .card {
    background: linear-gradient(145deg, rgba(32, 32, 35, 0.92), rgba(22, 22, 26, 0.92));
    box-shadow: 0 18px 32px rgba(0, 0, 0, 0.45), 0 6px 14px rgba(0, 0, 0, 0.35);
    border-color: rgba(255, 255, 255, 0.08);
  }
  .caption {
    font-style: italic;
  }
  .modal {
    width: 100%;
    max-width: 400px;
    margin: 0 8px;
  }
  .center {
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  .reset {
    float: right;
  }
  .accent-bar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 6px;
    background: linear-gradient(var(--accent-color, #4C97FF), rgba(255, 255, 255, 0));
  }
  .card-content {
    position: relative;
    z-index: 1;
  }
</style>

<div
  class="card"
  class:caption
  class:modal
  class:center={caption || center}
  style={`--accent-color: ${accent || 'transparent'}`}
>
  {#if accent}
    <div class="accent-bar" style={`background: linear-gradient(180deg, ${accent}, ${accent}66)`}></div>
  {/if}
  <div class="card-content">
  {#if reset}
    <div class="reset">
      <ResetButton on:click={reset} />
    </div>
  {/if}
  <slot></slot>
  </div>
</div>
