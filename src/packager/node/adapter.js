import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import fetch from 'cross-fetch';
import {name} from '../../../package.json';
import defaultIcon from '../images/default-icon.png';
import Image from './image';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

const safeJoin = (root, file) => {
  root = path.join(root, '/');
  const joined = path.join(root, file);
  if (joined.startsWith(root)) {
    return joined;
  }
  return null;
};

const cacheDirectory = path.join(__dirname, '..', '.packager-cache');
const getCachePath = async (asset) => {
  if (!asset.sha256) return null;
  const path = safeJoin(cacheDirectory, asset.sha256);
  if (path) {
    await mkdir(cacheDirectory, {
      recursive: true
    });
    return path;
  }
  return null;
};

const nodeBufferToArrayBuffer = (buffer) => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
const arrayBufferToNodeBuffer = (buffer) => Buffer.from(buffer);

class NodeAdapter {
  async getCachedAsset (asset) {
    const urls = asset.src;
    const src = Array.isArray(urls) ? urls[0] : urls;

    if (src.startsWith('scaffolding/')) {
      const file = safeJoin(__dirname, src);
      if (file) {
        return readFile(file, 'utf-8');
      }
    }

    if (src.startsWith('https:')) {
      const cachePath = await getCachePath(asset);
      if (cachePath) {
        try {
          return nodeBufferToArrayBuffer(await readFile(cachePath));
        } catch (e) {
          // ignore
        }
      }
      console.log(`[${name}]: downloading large asset ${src}; this may take a while`);
      const res = await fetch(src);
      if (!res.ok) {
        throw new Error(`Unexpected status code: ${res.status}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      if (cachePath) {
        await writeFile(cachePath, arrayBufferToNodeBuffer(arrayBuffer));
      }
      return arrayBuffer;
    }
  }

  async cacheAsset (asset, result) {
    // all of our caching logic lives in getCachedAsset
  }

  async getAppIcon (file) {
    if (!file) {
      // Use the default icon when no icon is given
      const buffer = await readFile(path.join(__dirname, defaultIcon));
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }
    if (file instanceof Image) {
      if (file.mimeType === 'image/png') {
        return file.readAsBuffer();
      }
      throw new Error('icon must be of type image/png but found ' + file.mimeType + ' instead.');
    }
    throw new Error('file must be an instance of Packager.Image or null but found ' + file + ' instead.');
  }

  readAsURL (file) {
    if (!(file instanceof Image)) {
      throw new Error('file must be an instance of Packager.Image but found ' + file + ' instead.');
    }
    return file.readAsURL();
  }
}

export default NodeAdapter;
