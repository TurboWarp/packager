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
});

test('rgbToHsv', () => {
  expect(rgbToHsv(0, 0, 0)[0]).toEqual(0);
  expect(rgbToHsv(0, 0, 0)[2]).toEqual(0);
  expect(rgbToHsv(255, 0, 0)).toEqual([0, 1, 1]);
});

test('hsvToRgb', () => {
  expect(hsvToRgb(0, 0, 0)).toEqual([0, 0, 0]);
});
