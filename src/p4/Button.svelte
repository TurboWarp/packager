<script>
  export let secondary;
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
</style>

<button on:click class:secondary>
  {text}
</button>
