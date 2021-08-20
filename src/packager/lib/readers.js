export const readAsArrayBuffer = (o) => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(fr.result);
  fr.onerror = () => reject(new Error(`Cannot read as array buffer: ${fr.error}`));
  fr.readAsArrayBuffer(o);
});

export const readAsURL = (o) => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(fr.result);
  fr.onerror = () => reject(new Error(`Cannot read as URL: ${fr.error}`));
  fr.readAsDataURL(o);
});
