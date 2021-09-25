import {hexToRgb, rgbToHex, rgbToHsv, hsvToRgb} from '../../src/p4/color-utils';

test('hexToRgb', () => {
  expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
  expect(hexToRgb('#fffFFf')).toEqual([255, 255, 255]);
  expect(hexToRgb('#abcdef')).toEqual([0xab, 0xcd, 0xef]);
  expect(hexToRgb('abcdef')).toEqual([0xab, 0xcd, 0xef]);
  expect(hexToRgb(' abcdef ')).toEqual([0xab, 0xcd, 0xef]);
  expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
  expect(hexToRgb('abc')).toEqual([0xaa, 0xbb, 0xcc]);
});

test('rgbToHex', () => {
  expect(rgbToHex(0, 0, 0)).toEqual('#000000');
  expect(rgbToHex(255, 255, 255)).toEqual('#ffffff');
  expect(rgbToHex(255, 0, 0)).toEqual('#ff0000');
  expect(rgbToHex(0, 255, 0)).toEqual('#00ff00');
  expect(rgbToHex(0, 0, 255)).toEqual('#0000ff');
  expect(rgbToHex(0xab, 0xcd, 0x12)).toEqual('#abcd12');
  expect(rgbToHex(1, 2, 255)).toEqual('#0102ff');
});

test('rgbToHsv', () => {
  expect(rgbToHsv(0, 0, 0)[0]).toEqual(0);
  // (saturation does not matter in pure black)
  expect(rgbToHsv(0, 0, 0)[2]).toEqual(0);
  expect(rgbToHsv(255, 255, 255)).toEqual([0, 0, 1]);
  expect(rgbToHsv(255, 0, 0)).toEqual([0, 1, 1]);
});

test('hsvToRgb', () => {
  expect(hsvToRgb(0, 0, 0)).toEqual([0, 0, 0]);
});

test('round-trip accuracy', () => {
  for (const color of [
    '#4c5aff',
    '5a4cff',
    '000000',
    'ffffff',
    'abcdef',
    '123456',
    '002348',
    'acbd38'
  ]) {
    const rgb = hexToRgb(color);
    const hsv = rgbToHsv(...rgb);
    const rgb2 = hsvToRgb(...hsv);
    expect(Math.abs(rgb2[0] - rgb[0])).toBeLessThan(0.0001);
    expect(Math.abs(rgb2[1] - rgb[1])).toBeLessThan(0.0001);
    expect(Math.abs(rgb2[2] - rgb[2])).toBeLessThan(0.0001);
  }
});
