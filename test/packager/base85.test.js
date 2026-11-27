import {test} from 'node:test';
import assert from 'node:assert';
import {encode, decode} from '../../src/packager/base85.js';

test('base85 encode and decode', () => {
  for (let i = 0; i < 10; i++) {
    const uint8 = new Uint8Array(Math.random() * 10000);
    for (let i = 0; i < uint8.length; i++) {
      uint8[i] = Math.random() * 255;
    }

    const encoded = encode(uint8);
    const outBuffer = new ArrayBuffer(Math.ceil(uint8.byteLength / 4) * 4);
    decode(encoded, outBuffer, 0);
    assert.deepStrictEqual(new Uint8Array(outBuffer, 0, uint8.byteLength), uint8);
  }
});
