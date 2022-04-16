<script>
  export let progress = 0;
  export let text = '';
</script>

<style>
  .progress {
    display: flex;
    align-items: center;
    flex-direction: column;
  }
  .bar-outer {
    width: 200px;
    height: 10px;
    border: 1px solid currentColor;
    margin-bottom: 4px;
    background: black;
  }
  :global([theme="dark"]) .bar-outer {
    background: transparent;
  }
  .bar-inner {
    height: 100%;
    width: 0;
    background: white;
  }
  .text {
    font-style: italic;
  }
</style>

<div class="progress">
  <div class="bar-outer">
    <div
      class="bar-inner"
      style:width={`${progress * 100}%`}
    ></div>
  </div>
  <div class="text">
    {text}
  </div>
</div>
