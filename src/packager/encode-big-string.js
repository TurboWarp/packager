/**
 * @template T
 * @param {T[]} destination
 * @param {T[]} newItems
 */
const concatInPlace = (destination, newItems) => {
  for (const item of newItems) {
    destination.push(item);
  }
};

/**
 * @param {unknown} value String, number, Uint8Array, etc. or a recursive array of them
 * @returns {Uint8Array[]} UTF-8 arrays, in order
 */
const encodeComponent = (value) => {
  if (typeof value === 'string') {
    return [
      new TextEncoder().encode(value)
    ];
  } else if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'undefined' || value === null) {
    return [
      new TextEncoder().encode(String(value))
    ];
  } else if (Array.isArray(value)) {
    const result = [];
    for (const i of value) {
      concatInPlace(result, encodeComponent(i));
    }
    return result;
  } else {
    throw new Error(`Unknown value in encodeComponent: ${value}`);
  }
};

/**
 * Tagged template function to generate encoded UTF-8 without string concatenation as Chrome cannot handle
 * strings that are longer than 0x1fffffe8 characters.
 * @param {TemplateStringsArray} strings
 * @param {unknown[]} values
 * @returns {Uint8Array}
 */
const encodeBigString = (strings, ...values) => {
  /** @type {Uint8Array[]} */
  const encodedChunks = [];

  for (let i = 0; i < strings.length - 1; i++) {
    concatInPlace(encodedChunks, encodeComponent(strings[i]));
    concatInPlace(encodedChunks, encodeComponent(values[i]));
  }
  concatInPlace(encodedChunks, encodeComponent(strings[strings.length - 1]));

  let totalByteLength = 0;
  for (let i = 0; i < encodedChunks.length; i++) {
    totalByteLength += encodedChunks[i].byteLength;
  }

  const resultBuffer = new Uint8Array(totalByteLength);
  for (let i = 0, j = 0; i < encodedChunks.length; i++) {
    resultBuffer.set(encodedChunks[i], j);
    j += encodedChunks[i].byteLength;
  }
  return resultBuffer;
};

export default encodeBigString;
