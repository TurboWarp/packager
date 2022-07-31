/**
 * @param {ArrayBuffer} arrayBuffer
 * @returns {string}
 */
export const encode = (arrayBuffer) => {
  let string = '';
  const data = new Uint8Array(arrayBuffer);
  for (let i = 0; i < data.byteLength; i++) {
    string += String.fromCharCode(data[i]);
  }
  return btoa(string);
};

/**
 * @param {string} string
 * @returns {ArrayBuffer}
 */
export const decode = (string) => {
  const data = atob(string);
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data.charCodeAt(i);
  }
  return result.buffer;
};
