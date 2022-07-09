import {darken, hexToRgb, rgbToHex} from '../../src/packager/colors';

test('hexToRgb', () => {
  expect(hexToRgb('#000000')).toStrictEqual({red: 0, green: 0, blue: 0});
  expect(hexToRgb('#ffffff')).toStrictEqual({red: 255, green: 255, blue: 255});
  expect(hexToRgb('#123456')).toStrictEqual({red: 0x12, green: 0x34, blue: 0x56});
  expect(hexToRgb('#01a09f')).toStrictEqual({red: 0x01, green: 0xa0, blue: 0x9f});
});

test('rgbToHex', () => {
  expect(rgbToHex({red: 0, green: 0, blue: 0})).toBe('#000000');
  expect(rgbToHex({red: 255, green: 255, blue: 255})).toBe('#ffffff');
  expect(rgbToHex({red: 0x12, green: 0x34, blue: 0x56})).toBe('#123456');
  expect(rgbToHex({red: 0x01, green: 0xa0, blue: 0x9f})).toBe('#01a09f');
});

test('darken', () => {
  expect(darken('#fc662c')).toBe('#e25b27');
  expect(darken('#000000')).toBe('#000000');
});
