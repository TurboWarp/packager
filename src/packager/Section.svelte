<script>
  export let caption = false;
</script>

<style>
  .card {
    max-width: 600px;
    min-height: 60px;
    margin: auto;
    border-radius: 0.3em;
    background-color: #fff;
    padding: 1em;
    margin-top: 1em;
    margin-bottom: 1.2em;
    box-shadow: 0 2px 0.5em 0.1em rgba(0, 0, 0, 0.2);
  }
  .caption {
    text-align: center;
    font-style: italic;
  }
</style>

<div class="card" class:caption>
  <div>
    <slot></slot>
  </div>
</div>
