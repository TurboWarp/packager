<script>
  export let caption = false;
  export let modal = false;
</script>

<style>
  .card {
    width: 100%;
    max-width: 600px;
    margin: auto;
    border-radius: 0.3em;
    background-color: #fff;
    padding: 1em;
    margin-top: 1em;
    margin-bottom: 1.2em;
    box-shadow: 0 2px 0.5em 0.1em rgba(0, 0, 0, 0.2);
  }
  :global([theme="dark"]) .card {
    background: #222;
  }
  .caption {
    text-align: center;
    font-style: italic;
  }
  .modal {
    max-width: 400px;
  }
</style>

<div class="card" class:caption class:modal>
  <div>
    <slot></slot>
  </div>
</div>
