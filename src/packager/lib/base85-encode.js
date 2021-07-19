// This implements a custom base85 encoding for improved efficiency compared to base64
// The character set used is 0x29 - 0x7d of ASCII with 0x5c (\) replaced with 0x7e (~)
// Note that it's possible these functions will be stringified at runtime to be included in generated code
// So, make sure that they're entirely self contained

/**
 * @param {ArrayBuffer} buffer The data to encode
 * @returns {string} Encoded string
 */
export const encode = (buffer) => {
  const originalLength = buffer.byteLength;
  let data;
  if (originalLength % 4 !== 0) {
    const newBuffer = new ArrayBuffer(originalLength + (4 - originalLength % 4));
    const originalView = new Uint8Array(buffer);
    const newView = new Uint8Array(newBuffer);
    for (let i = 0; i < originalView.length; i++) {
      newView[i] = originalView[i];
    }
    data = new Uint32Array(newBuffer);
  } else {
    data = new Uint32Array(buffer);
  }

  const originalLengthAsString = originalLength.toString();
  const resultBuffer = new ArrayBuffer(originalLengthAsString.length + 1 + data.byteLength * 5 / 4);
  const resultView = new Uint8Array(resultBuffer);
  let resultIndex = 0;
  for (let i = 0; i < originalLengthAsString.length; i++) {
    resultView[resultIndex++] = originalLengthAsString.charCodeAt(i);
  }
  resultView[resultIndex++] = 44; // ascii for ","

  const getChar = (n) => {
    n += 0x29;
    if (n === 0x5c) {
      return 0x7e;
    }
    return n;
  };
  for (let i = 0; i < data.length; i++) {
    let n = data[i];
    resultView[resultIndex++] = getChar(n % 85);
    n = Math.floor(n / 85);
    resultView[resultIndex++] = getChar(n % 85);
    n = Math.floor(n / 85);
    resultView[resultIndex++] = getChar(n % 85);
    n = Math.floor(n / 85);
    resultView[resultIndex++] = getChar(n % 85);
    n = Math.floor(n / 85);
    resultView[resultIndex++] = getChar(n % 85);
  }
  return new TextDecoder().decode(resultBuffer);
};

/**
 * @param {string} str
 * @returns {Uint8Array}
 */
export const decode = (str) => {
  const getValue = (code) => {
    if (code === 0x7e) {
      return 0x5c - 0x29;
    }
    return code - 0x29;
  };
  const toMultipleOfFour = (n) => {
    if (n % 4 === 0) {
      return n;
    }
    return n + (4 - n % 4);
  };
  const stringToBytes = (str) => new TextEncoder().encode(str);
  const lengthEndsAt = str.indexOf(',');
  const byteLength = +str.substring(0, lengthEndsAt);
  const resultBuffer = new ArrayBuffer(toMultipleOfFour(byteLength));
  const resultView = new Uint32Array(resultBuffer);
  const stringBytes = stringToBytes(str);
  for (let i = lengthEndsAt + 1, j = 0; i < str.length; i += 5, j++) {
    resultView[j] = (
      getValue(stringBytes[i + 4]) * 85 * 85 * 85 * 85 +
      getValue(stringBytes[i + 3]) * 85 * 85 * 85 +
      getValue(stringBytes[i + 2]) * 85 * 85 +
      getValue(stringBytes[i + 1]) * 85 +
      getValue(stringBytes[i])
    );
  }
  return new Uint8Array(resultBuffer, 0, byteLength);
};
