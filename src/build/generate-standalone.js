const pathUtil = require('path');
const fs = require('fs');
const glob = require('glob');

const dist = pathUtil.join(__dirname, '..', '..', 'dist');
console.log(`dist: ${dist}`);

const scaffoldingFiles = glob.sync('scaffolding/*.js', {
  cwd: dist
});
console.log(`scaffolding: ${scaffoldingFiles.join(', ')}`);
const scaffoldingAssets = {};
for (const path of scaffoldingFiles) {
  scaffoldingAssets[path] = fs.readFileSync(pathUtil.join(dist, path), 'utf-8');
}

const indexPath = pathUtil.join(dist, 'index.html');
console.log(`index.html: ${indexPath}`);
let indexContent = fs.readFileSync(indexPath, 'utf8');
const jsPath = pathUtil.join(dist, indexContent.match(/<script src="(.*)"><\/script>/)[1]);
console.log(`packager.js: ${jsPath}`);
let jsContent = fs.readFileSync(jsPath, 'utf-8');
jsContent = `window.__ASSETS__=${JSON.stringify(scaffoldingAssets)};${jsContent}`;
jsContent = jsContent.replace(/<\/script>/g, 'AAA');
indexContent = indexContent.replace(/<script src=".*"><\/script>/, () => `<script>${jsContent}</script>`);

const standalonePath = pathUtil.join(dist, 'standalone.html');
console.log(`standalone.html: ${standalonePath}`);
fs.writeFileSync(standalonePath, indexContent);
