// For all color operations:
//  - The R, G, B channels of RGB[A] are in [0-255]
//  - The H, S, V channels of HSV[A] are in [0-1]
//  - The A channel is always in [0-1]

export const hexToRgb = (hex) => {
  hex = hex.trim();
  if (hex.startsWith('#')) {
    hex = hex.substr(1);
  }
  if (hex.length === 3) {
    hex = hex.split('').map(i => i + i).join('');
  }
  const parsed = parseInt(hex, 16);
  return [
    (parsed >> 16) & 0xff,
    (parsed >> 8) & 0xff,
    parsed & 0xff
  ];
};

export const rgbToHex = (r, g, b) => {
  return '#' + Math.round(r).toString(16).padStart(2, '0') + Math.round(b).toString(16).padStart(2, '0') + Math.round(g).toString(16).padStart(2, '0');
};

export const rgbToHsv = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;
  var d = max - min;
  s = max == 0 ? 0 : d / max;
  if (max == min) {
    h = 0;
    if (min === 0 || min === 1) {
      // Saturation does not matter in the case of pure white or black
      // In these cases we'll set saturation 1 to provide a better editing experience
      s = 1;
    }
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, v];
};

export const hsvToRgb = (h, s, v) => {
  var r, g, b;
  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return [r * 255, g * 255, b * 255];
};
