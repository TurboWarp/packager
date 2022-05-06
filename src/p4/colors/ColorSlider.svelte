<script>
  import {createEventDispatcher} from 'svelte';

  export let value = 0;
  export let steps = [];

  const dispatch = createEventDispatcher();

  let sliderRect;
  let sliderElement;
  let knobRect;
  let knobElement;

  let isMoving = false;
  let distanceFromLeft = 0;

  const setMousePosition = (clientX) => {
    const unclampedValue = (clientX - sliderRect.left) / (sliderRect.width - knobRect.width);
    value = Math.max(0, Math.min(1, unclampedValue));
    distanceFromLeft = value * (sliderRect.width - knobRect.width);
    dispatch('change', value);
  };
  const onMouseMove = (e) => {
    if (!isMoving) return;
    setMousePosition(e.clientX);
  };

  const startMoving = () => {
    sliderRect = sliderElement.getBoundingClientRect();
    knobRect = knobElement.getBoundingClientRect();
    isMoving = true;
  };
  const onMouseDownSlider = (e) => {
    startMoving();
  };
  const onMouseDownKnob = (e) => {
    startMoving();
    setMousePosition(e.clientX);
  };
  const onMouseUp = () => {
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
  style={`background: linear-gradient(to right, ${steps.join(',')})`}
  on:mousedown|preventDefault={onMouseDownSlider}
  bind:this={sliderElement}
>
  <div
    class="knob"
    style={`left: ${distanceFromLeft}px`}
    on:mousedown|preventDefault={onMouseDownKnob}
    bind:this={knobElement}
  />
</div>
