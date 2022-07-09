// RGB <-> HSV conversion functions are based on https://github.com/LLK/scratch-vm/blob/develop/src/util/color.js

/**
 * @typedef RGB
 * @property {number} red red [0-255]
 * @property {number} green green [0-255]
 * @property {number} blue blue [0-255]
 */

/**
 * @typedef HSV
 * @property {number} hue hue [0-360)
 * @property {number} saturation saturation [0-1]
 * @property {number} value value [0-1]
 */

/**
 * @param {string} hex
 * @returns {RGB}
 */
 export const hexToRgb = (hex) => {
  const parsed = parseInt(hex.substring(1), 16);
  return {
    red: (parsed >> 16) & 0xff,
    green: (parsed >> 8) & 0xff,
    blue: parsed & 0xff
  };
};

/**
 * @param {RGB} color
 * @returns {string}
 */
export const rgbToHex = (color) => {
  const format = (n) => n.toString(16).padStart(2, '0');
  return `#${format(color.red)}${format(color.green)}${format(color.blue)}`;
};

/**
 * @param {RGB} color
 * @returns {HSV}
 */
export const rgbToHsv = (color) => {
  const r = color.red / 255;
  const g = color.green / 255;
  const b = color.blue / 255;

  const x = Math.min(Math.min(r, g), b);
  const v = Math.max(Math.max(r, g), b);

  // For grays, hue will be arbitrarily reported as zero. Otherwise, calculate
  let h = 0;
  let s = 0;
  if (x !== v) {
    const f = r === x ? g - b : g === x ? b - r : r - g;
    const i = r === x ? 3 : g === x ? 5 : 1;
    h = ((i - f / (v - x)) * 60) % 360;
    s = (v - x) / v;
  }

  return {
    hue: h,
    saturation: s,
    value: v
  };
};

/**
 * @param {HSV} color
 * @returns {RGB}
 */
export const hsvToRgb = (color) => {
  let h = color.hue % 360;
  if (h < 0) h += 360;

  const s = Math.max(0, Math.min(color.saturation, 1));
  const v = Math.max(0, Math.min(color.value, 1));

  const i = Math.floor(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));

  let r;
  let g;
  let b;

  switch (i) {
    default:
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return {
    red: Math.floor(r * 255),
    green: Math.floor(g * 255),
    blue: Math.floor(b * 255),
  };
};

/**
 * @param {string} hex
 * @returns {string}
 */
export const darken = (hex) => {
  const rgb = hexToRgb(hex);
  const hsv = rgbToHsv(rgb);

  // don't need to clamp value; hsvToRgb will do it for us
  hsv.value -= 0.1;

  const newRgb = hsvToRgb(hsv);
  return rgbToHex(newRgb);
};
