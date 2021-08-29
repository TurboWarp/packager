<script>
  import {createEventDispatcher} from 'svelte';
  export let dropping = false;
  const dispatch = createEventDispatcher();
</script>

<div on:drop={(e) => {
  if (e.dataTransfer.types.includes('Files') && e.dataTransfer.files[0]) {
    e.preventDefault();
    dispatch('drop', e.dataTransfer);
    dropping = false;
  }
}} on:dragover={(e) => {
  if (e.dataTransfer.types.includes('Files')) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    dropping = true;
  }
}} on:dragleave={(e) => {
  dropping = false;
}}>
  <slot></slot>
</div>
