const fs = require('fs');
const crypto = require('crypto');
const glob = require('glob');
const path = require('path');

const hash = crypto.createHash('sha256');

const root = path.join(__dirname, '..', '..');
const files = [
  ...glob.sync('./src/scaffolding/**/*', {
    cwd: root
  }),
  ...glob.sync('./src/addons/**/*', {
    cwd: root
  }),
  path.join(root, 'package.json'),
  path.join(root, 'package-lock.json')
];
for (const file of files) {
  hash.update(file);
  const stat = fs.statSync(file);
  if (!stat.isDirectory()) {
    hash.update(fs.readFileSync(file, 'utf-8'));
  }
}

const hex = hash.digest('hex');
console.log('Scaffolding build ID: ' + hex);
module.exports = hex;
