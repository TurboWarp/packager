import fs from 'fs';
import path from 'path';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

class NodeAdapter {
  async getCachedAsset (asset) {
    if (asset.src.startsWith('scaffolding/')) {
      // TODO: secure against path traversal?
      const file = path.join(__dirname, asset.src);
      return readFile(file, 'utf-8');
    }
    // TODO: other large asset caching
  }

  cacheAsset (asset, result) {
    // TODO
  }
}

export default NodeAdapter;
