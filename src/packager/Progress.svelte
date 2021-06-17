<script>
  export let progress = 0;
  export let text = '';
</script>

<style>
  .outer {
    width: 200px;
    height: 10px;
    border: 1px solid black;
    background: white;
  }
  .inner {
    height: 100%;
    width: 0;
    background: black;
  }
</style>

<div class="outer">
  <div class="inner" style={`width:${progress*100}%`}></div>
</div>

{text}
