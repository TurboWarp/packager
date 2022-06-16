const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..', '..');
const readme = path.join(root, 'README.md');
const nodeReadme = path.join(root, 'node-api-docs', 'README.md');
const storedOriginalReadme = path.join(root, 'OLD_README.md');

if (!fs.existsSync(readme)) {
  throw new Error(`README.md does not exist: ${readme}`);
}

const option = process.argv[2];
if (option === 'node') {
  console.log('Applying Node.js README');
  if (!fs.existsSync(nodeReadme)) {
    throw new Error(`Node.js README does not exist: ${nodeReadme}`);
  }

  fs.renameSync(readme, storedOriginalReadme);
  fs.copyFileSync(nodeReadme, readme);
} else if (option === 'restore') {
  console.log('Restoring original README');
  if (!fs.existsSync(storedOriginalReadme)) {
    throw new Error(`Stored README does not exist: ${storedOriginalReadme}`);
  }

  fs.renameSync(storedOriginalReadme, readme);
} else {
  throw new Error(`Unknown option: ${option}`);
}
