<script>
  import {createEventDispatcher} from 'svelte';

  export let value = 0;
  export let steps = [];

  const dispatch = createEventDispatcher();

  let rect;
  let element;
  let isMoving = false;

  $: background = `linear-gradient(to right, ${steps.join(',')})`;

  const setMousePosition = (clientX) => {
    const unclamped = (clientX - rect.left - 10) / rect.width;
    value = Math.max(0, Math.min(1, unclamped));
    dispatch('change', value);
  };
  const onMouseMove = (e) => {
    if (!isMoving) return;
    setMousePosition(e.clientX);
  };
  const onMouseDown = (e) => {
    rect = element.getBoundingClientRect();
    isMoving = true;
    setMousePosition(e.clientX);
  };
  const onMouseUp = (e) => {
    if (!isMoving) return;
    isMoving = false;
  }
</script>

<style>
  .slider {
    position: relative;
    width: 150px;
    height: 25px;
    border-radius: 12px;
    cursor: pointer;
  }
  .knob {
    position: absolute;
    width: 25px;
    height: 25px;
    border-radius: 100%;
    background: white;
    box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.3);
  }
</style>

<svelte:body on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

<div
  class="slider"
  on:mousedown|preventDefault={onMouseDown}
  bind:this={element}
  style={`background: ${background}`}
>
  <div class="knob" style={`left: ${value * 100}%; transform: translateX(-50%);`}></div>
</div>
