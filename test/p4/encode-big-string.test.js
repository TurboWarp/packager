import {test} from 'node:test';
import assert from 'node:assert';
import encodeBigString from "../../src/packager/encode-big-string.js";

test('simple behavior', () => {
  assert.deepStrictEqual(encodeBigString``, new Uint8Array([]));
  assert.deepStrictEqual(encodeBigString`abc`, new Uint8Array([97, 98, 99]));
  assert.deepStrictEqual(encodeBigString`a${'bc'}`, new Uint8Array([97, 98, 99]));
  assert.deepStrictEqual(encodeBigString`${'ab'}c`, new Uint8Array([97, 98, 99]));
  assert.deepStrictEqual(encodeBigString`${'abc'}`, new Uint8Array([97, 98, 99]));
  assert.deepStrictEqual(encodeBigString`1${'a'}2${'b'}3${'c'}4`, new Uint8Array([49, 97, 50, 98, 51, 99, 52]));
  assert.deepStrictEqual(encodeBigString`${''}`, new Uint8Array([]));
});

test('non-string primitives', () => {
  assert.deepStrictEqual(encodeBigString`${1}`, new Uint8Array([49]));
  assert.deepStrictEqual(encodeBigString`${false}`, new Uint8Array([102, 97, 108, 115, 101]));
  assert.deepStrictEqual(encodeBigString`${true}`, new Uint8Array([116, 114, 117, 101]));
  assert.deepStrictEqual(encodeBigString`${null}`, new Uint8Array([110, 117, 108, 108]));
  assert.deepStrictEqual(encodeBigString`${undefined}`, new Uint8Array([117, 110, 100, 101, 102, 105, 110, 101, 100]));
});

test('array', () => {
  assert.deepStrictEqual(encodeBigString`${[]}`, new Uint8Array([]));
  assert.deepStrictEqual(encodeBigString`${['a', 'b', 'c']}`, new Uint8Array([97, 98, 99]));
  assert.deepStrictEqual(encodeBigString`${[[[['a'], [['b']], 'c']]]}`, new Uint8Array([97, 98, 99]));
});

// skipping for now because very slow
test.skip('very big string', () => {
  const MAX_LENGTH = 0x1fffffe8;
  const maxLength = 'a'.repeat(MAX_LENGTH);
  assert.throws(() => maxLength + 'a', /Invalid string length/);
  const encoded = encodeBigString`${maxLength}aaaaa`;
  assert.strictEqual(encoded.byteLength, MAX_LENGTH + 5);

  // very hot loop, don't call into assert if we don't need to
  for (let i = 0; i < encoded.length; i++) {
    if (encoded[i] !== 97) {
      throw new Error(`Wrong encoding at ${i}`);
    }
  }
});
