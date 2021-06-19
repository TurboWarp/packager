<script>
  export let disabled;
  export let secondary;
  export let danger;
</script>

<style>
  button {
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
  button:disabled {
    background-color: #ff9797;
    cursor: not-allowed;
  }
  .secondary {
    background-color: #0FBD8C;
  }
  .secondary:active {
    background-color: #03946b;
  }
  .secondary:disabled {
    background-color: #57dbb6;
  }
  .danger {
    background-color: #FF8C1A;
  }
  .danger:active {
    background-color: #c76c12;
  }
  .danger:disabled {
    background-color: #ffbd7b;
  }
</style>

<button on:click disabled={disabled} class:secondary class:danger>
  <slot></slot>
</button>
