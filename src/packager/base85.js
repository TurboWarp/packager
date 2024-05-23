// This implements a custom base85 encoding for improved efficiency compared to base64.
// The character set used is 0x2a - 0x7e of ASCII. Little endian.

// 0x3c (<) is replaced with 0x28 (opening parenthesis) and 0x3e (>) is replaced with 0x29 (closing parenthesis),
// which makes the encoded data safe to include in any HTML context without escapes.

const getBase85EncodeCharacter = (n) => {
  n += 0x2a;
  if (n === 0x3c) return 0x28;
  if (n === 0x3e) return 0x29;
  return n;
};

/**
 * @param {Uint8Array} uint8 The data to encode. No assumptions made about backing buffer.
 * @returns {string} Base 85 encoding
 */
export const encode = (uint8) => {
  const originalLength = uint8.length;

  // Data length needs to be a multiple of 4 so we can use getUint32.
  // If it's not, we'll have to make a copy and pad with zeros.
  let dataView;
  if (originalLength % 4 !== 0) {
    const newUint8 = new Uint8Array(Math.ceil(originalLength / 4) * 4);
    for (let i = 0; i < originalLength; i++) {
      newUint8[i] = uint8[i];
    }
    dataView = new DataView(newUint8.buffer);
  } else {
    dataView = new DataView(uint8.buffer, uint8.byteOffset, uint8.byteLength);
  }

  // Pre-allocating buffer and using TextDecoder at the end is faster than string concatenation
  // Each set of 4 bytes is represented by 5 characters. Pad with zeros if needed.
  const result = new Uint8Array(Math.ceil(originalLength / 4) * 5);
  let resultIndex = 0;

  for (let i = 0; i < dataView.byteLength; i += 4) {
    let n = dataView.getUint32(i, true);
    result[resultIndex++] = getBase85EncodeCharacter(n % 85);
    n = Math.floor(n / 85);
    result[resultIndex++] = getBase85EncodeCharacter(n % 85);
    n = Math.floor(n / 85);
    result[resultIndex++] = getBase85EncodeCharacter(n % 85);
    n = Math.floor(n / 85);
    result[resultIndex++] = getBase85EncodeCharacter(n % 85);
    n = Math.floor(n / 85);
    result[resultIndex++] = getBase85EncodeCharacter(n % 85);
  }

  return new TextDecoder().decode(result);
};

// Keep the base85 decode function up-to-date in packager.js

const getBase85DecodeValue = (code) => {
  if (code === 0x28) code = 0x3c;
  if (code === 0x29) code = 0x3e;
  return code - 0x2a;
};

/**
 * @param {string} str Base 85 data
 * @param {ArrayBuffer} outBuffer Assumed to have a byteLength that is a multiple of 4
 * @param {number} outOffset Assumed to have be a multiple of 4
 */
export const decode = (str, outBuffer, outOffset) => {
  const view = new DataView(outBuffer, outOffset, Math.floor(str.length / 5 * 4));
  for (let i = 0, j = 0; i < str.length; i += 5, j += 4) {
    view.setUint32(j, (
      getBase85DecodeValue(str.charCodeAt(i + 4)) * 85 * 85 * 85 * 85 +
      getBase85DecodeValue(str.charCodeAt(i + 3)) * 85 * 85 * 85 +
      getBase85DecodeValue(str.charCodeAt(i + 2)) * 85 * 85 +
      getBase85DecodeValue(str.charCodeAt(i + 1)) * 85 +
      getBase85DecodeValue(str.charCodeAt(i))
    ), true);
  }
};
