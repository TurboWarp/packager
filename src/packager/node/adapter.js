import fs from 'fs';
import path from 'path';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

const scaffoldingDirectory = path.join(__dirname, 'scaffolding');

class NodeAdapter {
  async getCachedAsset (asset) {
    if (asset.src.startsWith('scaffolding/')) {
      const file = path.join(__dirname, asset.src);
      if (file.startsWith(scaffoldingDirectory)) {
        return readFile(file, 'utf-8');
      }
    }
    // TODO: non-scaffolding asset caching
  }

  cacheAsset (asset, result) {
    // TODO
  }
}

export default NodeAdapter;
