/**
 * @param {Blob} o
 * @returns {Promise<ArrayBuffer>}
 */
export const readAsArrayBuffer = (o) => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(fr.result);
  fr.onerror = () => reject(new Error(`Cannot read as array buffer: ${fr.error}`));
  fr.readAsArrayBuffer(o);
});

/**
 * @param {Blob} o
 * @returns {Promise<string>}
 */
export const readAsURL = (o) => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(fr.result);
  fr.onerror = () => reject(new Error(`Cannot read as URL: ${fr.error}`));
  fr.readAsDataURL(o);
});

/**
 * @param {Blob} o
 * @returns {Promise<string>}
 */
export const readAsText = (o) => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(fr.result);
  fr.onerror = () => reject(new Error(`Cannot read as text: ${fr.error}`));
  fr.readAsText(o);
});
