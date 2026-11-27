import {test} from 'node:test';
import assert from 'node:assert';
import {darken, hexToRgb, rgbToHex} from '../../src/packager/colors.js';

test('hexToRgb', () => {
  assert.deepStrictEqual(hexToRgb('#000000'), {red: 0, green: 0, blue: 0});
  assert.deepStrictEqual(hexToRgb('#ffffff'), {red: 255, green: 255, blue: 255});
  assert.deepStrictEqual(hexToRgb('#123456'), {red: 0x12, green: 0x34, blue: 0x56});
  assert.deepStrictEqual(hexToRgb('#01a09f'), {red: 0x01, green: 0xa0, blue: 0x9f});
});

test('rgbToHex', () => {
  assert.strictEqual(rgbToHex({red: 0, green: 0, blue: 0}), '#000000');
  assert.strictEqual(rgbToHex({red: 255, green: 255, blue: 255}), '#ffffff');
  assert.strictEqual(rgbToHex({red: 0x12, green: 0x34, blue: 0x56}), '#123456');
  assert.strictEqual(rgbToHex({red: 0x01, green: 0xa0, blue: 0x9f}), '#01a09f');
});

test('darken', () => {
  assert.strictEqual(darken('#fc662c'), '#e25b27');
  assert.strictEqual(darken('#000000'), '#000000');
});
