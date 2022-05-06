<script>
  import ColorSlider from './ColorSlider.svelte';
  import ResetButton from '../ResetButton.svelte';
  import {hexToRgb, rgbToHex, rgbToHsv, hsvToRgb, normalizeHex} from './color-utils';
  import {_} from '../../locales';

  export let value;
  export let defaultColor;

  let internalHex;
  let internalHsv;

  const updateExternalHex = () => {
    value = internalHex;
  };
  const setHsv = (hsv) => {
    const rgb = hsvToRgb(...hsv);
    const hex = rgbToHex(...rgb);
    internalHex = hex;
    internalHsv = hsv;
    updateExternalHex();
  };
  const setInternalHex = (hex) => {
    const valueAsRgb = hexToRgb(hex);
    internalHex = hex;
    internalHsv = rgbToHsv(...valueAsRgb);
  };
  const setHex = (hex) => {
    setInternalHex(hex);
    updateExternalHex();
  };
  const reset = () => {
    setHex(defaultColor);
  };
  $: setInternalHex(value);

  let open = false;
  let editorElement;

  const handleOpen = () => {
    open = !open;
  };
  const checkClickedOutside = (e) => {
    if (open && editorElement && !editorElement.contains(e.target)) {
      open = false;
    }
  };

  const updateHsvChannelFactory = (index) => (e) => {
    const newColor = [...internalHsv];
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
    height: 24px;
  }
  .native-input {
    width: 40px;
    height: 100%;
    padding: 0;
    margin: 0;
    border: none;
  }
  .hex-input {
    width: 60px;
  }
  .native-input, .hex-input {
    height: 100%;
    margin-right: 8px;
    box-sizing: border-box;
  }
</style>

<svelte:body on:mousedown={checkClickedOutside} />

<div class="container" bind:this={editorElement}>
  <button class="button" on:click={handleOpen}>
    <div class="color-preview" style={`background-color: ${normalizeHex(internalHex)}`}></div>
  </button>

  {#if open}
    <div class="editor">
      <div class="slider-section">
        <div class="label">
          {$_('color.color')}
          <div class="value">{Math.round(internalHsv[0] * 100)}</div>
        </div>
        <div class="slider">
          <ColorSlider
            value={internalHsv[0]}
            steps={generateHueSteps(internalHsv)}
            on:change={updateHsvChannelFactory(0)}
          />
        </div>
      </div>

      <div class="slider-section">
        <div class="label">
          {$_('color.saturation')}
          <div class="value">{Math.round(internalHsv[1] * 100)}</div>
        </div>
        <div class="slider">
          <ColorSlider
            value={internalHsv[1]}
            steps={generateSaturationSteps(internalHsv)}
            on:change={updateHsvChannelFactory(1)}
          />
        </div>
      </div>

      <div class="slider-section">
        <div class="label">
          {$_('color.brightness')}
          <div class="value">{Math.round(internalHsv[2] * 100)}</div>
        </div>
        <div class="slider">
          <ColorSlider
            value={internalHsv[2]}
            steps={generateBrightnessSteps(internalHsv)}
            on:change={updateHsvChannelFactory(2)}
          />
        </div>
      </div>

      <div class="bottom-section">
        <input
          class="native-input"
          type="color"
          value={normalizeHex(internalHex)}
          on:input={(e) => {
            setHex(e.target.value);
          }}
        />
        <input
          class="hex-input"
          type="text"
          value={internalHex}
          on:input={(e) => {
            setInternalHex(e.target.value);
          }}
          on:change={updateExternalHex}
        />
        <ResetButton
          on:click={reset}
          confirm={false}
        />
      </div>
    </div>
  {/if}
</div>
