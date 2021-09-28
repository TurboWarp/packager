<script>
  export let secondary;
  export let danger;
  export let text;
</script>

<style>
  button {
    font-family: inherit;
    font-size: 14px;
    background-color: #ff4c4c;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    margin: 0;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    font-weight: bold;
  }
  button:active {
    background-color: #b92828;
  }
  .secondary {
    background-color: #0FBD8C;
  }
  .secondary:active {
    background-color: #03946b;
  }
  .danger {
    background-color: #FF8C1A;
  }
  .danger:active {
    background-color: #c76c12;
  }
</style>

<button on:click class:secondary class:danger>
  {text}
</button>
