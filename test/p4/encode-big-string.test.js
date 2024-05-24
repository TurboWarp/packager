import encodeBigString from "../../src/packager/encode-big-string";

test('simple behavior', () => {
  expect(encodeBigString``).toEqual(new Uint8Array([]));
  expect(encodeBigString`abc`).toEqual(new Uint8Array([97, 98, 99]));
  expect(encodeBigString`a${'bc'}`).toEqual(new Uint8Array([97, 98, 99]));
  expect(encodeBigString`${'ab'}c`).toEqual(new Uint8Array([97, 98, 99]));
  expect(encodeBigString`${'abc'}`).toEqual(new Uint8Array([97, 98, 99]));
  expect(encodeBigString`1${'a'}2${'b'}3${'c'}4`).toEqual(new Uint8Array([49, 97, 50, 98, 51, 99, 52]));
  expect(encodeBigString`${''}`).toEqual(new Uint8Array([]));
});

test('non-string primitives', () => {
  expect(encodeBigString`${1}`).toEqual(new Uint8Array([49]));
  expect(encodeBigString`${false}`).toEqual(new Uint8Array([102, 97, 108, 115, 101]));
  expect(encodeBigString`${true}`).toEqual(new Uint8Array([116, 114, 117, 101]));
  expect(encodeBigString`${null}`).toEqual(new Uint8Array([110, 117, 108, 108]));
  expect(encodeBigString`${undefined}`).toEqual(new Uint8Array([117, 110, 100, 101, 102, 105, 110, 101, 100]));
});

test('array', () => {
  expect(encodeBigString`${[]}`).toEqual(new Uint8Array([]));
  expect(encodeBigString`${['a', 'b', 'c']}`).toEqual(new Uint8Array([97, 98, 99]));
  expect(encodeBigString`${[[[['a'], [['b']], 'c']]]}`).toEqual(new Uint8Array([97, 98, 99]));
});

// skipping for now because very slow
test.skip('very big string', () => {
  const MAX_LENGTH = 0x1fffffe8;
  const maxLength = 'a'.repeat(MAX_LENGTH);
  expect(() => maxLength + 'a').toThrow(/Invalid string length/);
  const encoded = encodeBigString`${maxLength}aaaaa`;
  expect(encoded.byteLength).toBe(MAX_LENGTH + 5);

  // very hot loop, don't call into expect if we don't need to
  for (let i = 0; i < encoded.length; i++) {
    if (encoded[i] !== 97) {
      throw new Error(`Wrong encoding at ${i}`);
    }
  }
});
