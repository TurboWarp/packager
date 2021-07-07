<script>
  import {onMount} from 'svelte';

  export let message;
  export let values;
  let el;

  const build = () => {
    const parts = message.split(/{(\w+)}/g);
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isText = i % 2 === 0;
      if (isText) {
        el.appendChild(document.createTextNode(part));
      } else {
        const value = values[part];
        if (value) {
          const node = document.createElement('a');
          node.href = value.href;
          node.textContent = value.text;
          el.appendChild(node);
        } else {
          console.warn('Missing placeholder', part);
          el.appendChild(document.createTextNode(`???{${part}}`));
        }
      }
    }
  };

  onMount(build);
</script>

<span bind:this={el}></span>
