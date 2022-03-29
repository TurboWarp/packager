<script>
  import {onMount, onDestroy, tick} from 'svelte';
  import {_} from '../locales/index';

  export let message;
  export let values;
  let el;

  const build = () => {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
    const parts = message.split(/{(\w+)}/g);
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isText = i % 2 === 0;
      if (isText) {
        el.appendChild(document.createTextNode(part));
      } else {
        const value = values && values[part];
        if (value) {
          const node = document.createElement('a');
          node.href = value.href;
          node.textContent = value.text;
          if (value.newTab) {
            node.target = '_blank';
            node.rel = 'noopener noreferrer';
          }
          el.appendChild(node);
        } else {
          console.warn('Missing placeholder', part);
          el.appendChild(document.createTextNode(`???{${part}}`));
        }
      }
    }
  };

  const unsubscribe = _.subscribe(() => {
    if (el) {
      // message props don't get updated until after tick
      tick().then(build);
    }
  });

  onMount(build);
  onDestroy(unsubscribe);
</script>

<span bind:this={el}></span>
