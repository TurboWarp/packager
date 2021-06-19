const LARGE_ASSET_BASE = 'https://packagerdata.turbowarp.org/';
process.env.LARGE_ASSET_BASE = LARGE_ASSET_BASE;

const largeAssets = require('./src/packager/large-assets');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

console.log('This may take a while.');

(async () => {
  for (const assetName of Object.keys(largeAssets)) {
    const asset = largeAssets[assetName];
    const {src} = asset;
    if (!src.startsWith(LARGE_ASSET_BASE)) {
      continue;
    }
    const file = path.join(__dirname, 'static', src.substr(LARGE_ASSET_BASE.length));
    console.log(`Downloading ${assetName} from ${src} to ${file}`);
    if (fs.existsSync(file)) {
      console.log('... already exists');
      continue;
    }
    const res = await fetch(src);
    if (!res.ok) {
      throw new Error(`Unexpected status code: ${res.status}`);
    }
    const data = await res.arrayBuffer();
    // Don't bother checking checksum, it will be checked by the website when it gets used
    fs.writeFileSync(file, Buffer.from(data));
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
