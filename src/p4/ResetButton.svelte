<script>
  import {createEventDispatcher} from 'svelte';
  import {_} from '../locales/';
  import icon from './reset.svg';
  const dispatch = createEventDispatcher();
</script>

<style>
  button {
    margin: 0;
    padding: 2px;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 4px;
  }
  button:hover {
    background: rgba(0, 0, 0, 0.15);
  }
  button:active {
    background: rgba(0, 0, 0, 0.3);
  }
  :global([theme="dark"]) button:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  :global([theme="dark"]) button:active {
    background: rgba(255, 255, 255, 0.3);
  }
  :global([theme="dark"]) img {
    filter: invert(100%);
  }
</style>

<button>
  <img
    src={icon}
    draggable={false}
    alt={$_('reset.reset')}
    title={$_('reset.reset')}
    width="18"
    height="18"
    on:click={() => {
      if (confirm($_('reset.confirm'))) {
        dispatch('click');
      }
    }}
  >
</button>
