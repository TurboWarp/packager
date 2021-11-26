<script>
  import {createEventDispatcher} from 'svelte';
  import {_} from '../locales/';
  import icon from './reset.svg';

  const dispatch = createEventDispatcher();

  const click = () => {
    if (confirm($_('reset.confirm'))) {
      dispatch('click');
    }
  };
</script>

<style>
  button {
    width: 26px;
    height: 26px;
    margin: 0;
    padding: 4px;
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
  img {
    width: 100%;
    height: 100%;
  }
  :global([theme="dark"]) img {
    filter: invert(100%);
  }
</style>

<button on:click={click}>
  <img
    src={icon}
    draggable={false}
    alt={$_('reset.reset')}
    title={$_('reset.reset')}
  >
</button>
