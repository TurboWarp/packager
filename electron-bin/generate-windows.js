const {downloadArtifact} = require('@electron/get');
const rcedit = require('rcedit');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const rimraf = require('rimraf');
const extractZip = require('extract-zip');
const archiver = require('archiver');
const crypto = require('crypto');

const {electronVersion} = require('./version.json');

const newIconPath = path.join(__dirname, '../src/packager/images/default-icon.ico');

const download = (arch) => downloadArtifact({
  version: electronVersion,
  artifactName: 'electron',
  platform: 'win32',
  arch
});

const getTempFile = (name) => path.join(__dirname, 'temp/windows', name);

const extract = async (from, name) => {
  const to = getTempFile(name);
  fs.mkdirSync(path.join(to, '..'), {recursive: true});
  rimraf.sync(to);
  await extractZip(from, {dir: to});
  return to;
};

const compress = (from, to) => new Promise((resolve, reject) => {
  const archive = archiver('zip', {
    zlib: {
      level: zlib.constants.Z_BEST_COMPRESSION
    }
  });
  const outStream = fs.createWriteStream(to);
  outStream.on('error', (err) => reject(err));
  outStream.on('close', () => resolve());
  archive.directory(from, false);
  archive.pipe(outStream);
  archive.finalize();
});

const run = async (arch) => {
  console.log(`Downloading ${arch}`);
  const downloadPath = await download(arch);

  console.log('Extracting');
  const extractedPath = await extract(downloadPath, arch);

  console.log('Running rcedit');
  const executablePath = path.join(extractedPath, 'electron.exe');
  await rcedit(executablePath, {
    icon: newIconPath,
    // Replace Electron's version with something generic
    'version-string': '1.0.0',
    'file-version': '1.0.0',
    'product-version': '1.0.0'
  });

  console.log('Compressing');
  const outputPath = getTempFile(`electron-v${electronVersion}-win32-${arch}.zip`);
  await compress(extractedPath, outputPath);
  console.log(`Output: ${outputPath}`);

  const outputFileData = fs.readFileSync(outputPath);
  console.log(`Size: ${outputFileData.length} bytes`)

  const sha256 = crypto.createHash('sha256').update(outputFileData).digest('hex');
  console.log(`SHA-256: ${sha256}`);
};

run('ia32')
  .then(() => run('x64'))
  .then(() => run('arm64'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
