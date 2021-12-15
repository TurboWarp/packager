<script>
  import ColorSlider from './ColorSlider.svelte';
  import {hexToRgb, rgbToHex, rgbToHsv, hsvToRgb} from './color-utils';
  import {_} from '../../locales';

  export let value;
  export let defaultColor;

  let editorElement;
  let valueAsHsv;
  let open = false;

  const handleOpen = () => {
    open = !open;
  };
  const checkClickedOutside = (e) => {
    if (open && editorElement && !editorElement.contains(e.target)) {
      open = false;
    }
  };

  const setHsv = (hsv) => {
    const rgb = hsvToRgb(...hsv);
    const hex = rgbToHex(...rgb);
    value = hex;
    valueAsHsv = hsv;
  };
  const setHex = (hex) => {
    const valueAsRgb = hexToRgb(hex);
    value = hex;
    valueAsHsv = rgbToHsv(...valueAsRgb);
  };
  setHex(value);

  const hsvChangeFactory = (index) => (e) => {
    const newColor = [...valueAsHsv];
    newColor[index] = e.detail;
    setHsv(newColor);
  };
  const generateHueSteps = (hsv) => {
    const result = [];
    for (let i = 0; i < 1; i += 0.1) {
      result.push(rgbToHex(...hsvToRgb(i, hsv[1], hsv[2])));
    }
    return result;
  };
  const generateSaturationSteps = (hsv) => {
    const result = [];
    for (let i = 0; i < 1; i += 0.1) {
      result.push(rgbToHex(...hsvToRgb(hsv[0], i, hsv[2])));
    }
    return result;
  };
  const generateBrightnessSteps = (hsv) => {
    const result = [];
    for (let i = 0; i < 1; i += 0.1) {
      result.push(rgbToHex(...hsvToRgb(hsv[0], hsv[1], i)));
    }
    return result;
  };

  const handleSetHex = (e) => {
    setHex(e.target.value);
  };
  const reset = () => {
    setHex(defaultColor);
  };
</script>

<style>
  .container {
    position: relative;
    margin-right: 4px;
  }
  .button, .editor {
    border: 1px solid rgb(160, 160, 160);
  }
  .button {
    background-color: #eee;
    width: 40px;
    height: 2em;
    border-radius: 2px;
    margin: 0;
    padding: 3px;
    box-sizing: border-box;
  }
  .button:hover {
    background-color: #ddd;
  }
  .button:active {
    background-color: #ccc;
  }
  .color-preview {
    width: 100%;
    height: 100%;
  }
  .editor {
    background: white;
    position: absolute;
    z-index: 10;
    top: 100%;
    border-radius: 4px;
    padding: 8px;
    box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.5);
  }
  .slider-section {
    margin-bottom: 12px;
  }
  .label {
    display: flex;
    font-weight: bold;
  }
  .value {
    font-weight: normal;
    margin-left: 12px;
  }
  .bottom-section {
    display: flex;
    align-items: center;
  }
  .hex-text {
    width: 60px;
  }
  .reset-button {
    margin-left: 8px;
  }

  :global([theme="dark"]) .button,
  :global([theme="dark"]) .editor {
    background-color: #333;
    border-color: #888;
  }
  :global([theme="dark"]) .button:hover {
    background-color: #444;
  }
  :global([theme="dark"]) .button:active {
    background-color: #555;
  }
</style>

<svelte:body on:mousedown={checkClickedOutside} />

<div class="container" bind:this={editorElement}>
  <button class="button" on:click={handleOpen}>
    <div class="color-preview" style={`background-color: ${value}`}></div>
  </button>
  {#if open}
    <div class="editor">
      <div class="slider-section">
        <div class="label">
          {$_('color.color')}
          <div class="value">{Math.round(valueAsHsv[0] * 100)}</div>
        </div>
        <div class="slider">
          <ColorSlider
            value={valueAsHsv[0]}
            steps={generateHueSteps(valueAsHsv)}
            on:change={hsvChangeFactory(0)}
          />
        </div>
      </div>
      <div class="slider-section">
        <div class="label">
          {$_('color.saturation')}
          <div class="value">{Math.round(valueAsHsv[1] * 100)}</div>
        </div>
        <div class="slider">
          <ColorSlider
            value={valueAsHsv[1]}
            steps={generateSaturationSteps(valueAsHsv)}
            on:change={hsvChangeFactory(1)}
          />
        </div>
      </div>
      <div class="slider-section">
        <div class="label">
          {$_('color.brightness')}
          <div class="value">{Math.round(valueAsHsv[2] * 100)}</div>
        </div>
        <div class="slider">
          <ColorSlider
            value={valueAsHsv[2]}
            steps={generateBrightnessSteps(valueAsHsv)}
            on:change={hsvChangeFactory(2)}
          />
        </div>
      </div>
      <div class="bottom-section">
        <input class="hex-text" type="text" value={value} on:input={handleSetHex} />
        <button class="reset-button" on:click={reset}>{$_('reset.reset')}</button>
      </div>
    </div>
  {/if}
</div>
