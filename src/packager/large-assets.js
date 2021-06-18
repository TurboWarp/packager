import shajs from 'sha.js';

const assets = {
  'nwjs-win64': {
    src: 'nwjs-v0.49.0-win-x64.zip',
    size: 97406745,
    sha256: 'c76f97d1b6a59745051226fb59c3a8526362caf6b7f3e8e3dd193dfcdafebad5'
  }
};

const sha256 = (buffer) => shajs('sha256').update(new Uint8Array(buffer)).digest('hex');

const fetchLargeAsset = async (name) => {
  const entry = assets[name];
  if (!entry) {
    throw new Error('Invalid manifest entry');
  }
  const res = await fetch(entry.src);
  if (!res.ok) {
    throw new Error(`Unexpected status code: ${res.status}`);
  }
  const buffer = await res.arrayBuffer();
  const hash = sha256(buffer);
  if (hash !== entry.sha256) {
    throw new Error('Hash mismatch');
  }
  return buffer;
};

export default fetchLargeAsset;
