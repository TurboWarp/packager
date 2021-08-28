import {readAsArrayBuffer} from '../common/readers';

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error(`Could not load image: ${src}`));
  image.src = src;
});

const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) {
      resolve(blob);
    } else {
      reject(new Error('Could not read <canvas> as blob'));
    }
  });
});

const pngToAppleICNS = async (pngData) => {
  const {
    Icns,
    Buffer
  } = await import(/* webpackChunkName: "icns" */ './icns-bundle');

  const FORMATS = [
    { type: 'ic04', size: 16 },
    { type: 'ic07', size: 128 },
    { type: 'ic08', size: 256 },
    { type: 'ic09', size: 512 },
    { type: 'ic10', size: 1024 },
    { type: 'ic11', size: 32 },
    { type: 'ic12', size: 64 },
    { type: 'ic13', size: 256 },
    { type: 'ic14', size: 512 },
  ];

  // Read the Image.
  const pngDataBlob = new Blob([pngData], {
    type: 'image/png'
  });
  const url = URL.createObjectURL(pngDataBlob);
  const image = await loadImage(url);

  // Determine the formats to create
  const eligibleFormats = FORMATS.filter((format) => {
    // Always include the smallest size so that tiny images will get at least 1 image.
    if (format.size === 16) {
      return true;
    }
    return image.width >= format.size && image.height >= format.size;
  });

  // Create a single canvas to be used for conversion
  // Creating many canvases is prone to error in Safari
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('cannot get canvas rendering context');
  }

  const icns = new Icns.Icns();
  for (const format of eligibleFormats) {
    // Use the canvas to scale the image.
    const formatSize = format.size;
    canvas.width = formatSize;
    canvas.height = formatSize;
    ctx.drawImage(image, 0, 0, formatSize, formatSize);

    const blob = await canvasToBlob(canvas);
    const arrayBuffer = await readAsArrayBuffer(blob);
    const icnsImage = await Icns.IcnsImage.fromPNG(Buffer.from(arrayBuffer), format.type);
    icns.append(icnsImage);
  }

  return icns.data;
};

export default pngToAppleICNS;
