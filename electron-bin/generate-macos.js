const {downloadArtifact} = require('@electron/get');
const {makeUniversalApp} = require('@electron/universal');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const extractZip = require('extract-zip');
const archiver = require('archiver');

const {electronVersion} = require('./version.json');

if (process.platform !== 'darwin') {
  // @electron/universal only supports macOS
  console.error('This script must be run on macOS');
  process.exit(1);
}

const download = (arch) => downloadArtifact({
  version: electronVersion,
  artifactName: 'electron',
  platform: 'darwin',
  arch
});

const getTempFile = (name) => path.join(__dirname, 'temp', 'macos', name);

const extract = async (from, name) => {
  const to = getTempFile(name);
  fs.mkdirSync(path.join(to, '..'), {recursive: true});
  rimraf.sync(to);

  await extractZip(from, {dir: to});

  // Create the an empty app folder so that @electron/universal doesn't throw an error
  fs.mkdirSync(path.join(to, 'Electron.app', 'Contents', 'Resources', 'app'));

  return path.join(to, 'Electron.app');
};

const compress = (from, to) => new Promise((resolve, reject) => {
  const archive = archiver('zip');
  const outStream = fs.createWriteStream(to);
  outStream.on('error', (err) => reject(err));
  outStream.on('close', () => resolve());
  archive.directory(from, path.basename(from));
  archive.pipe(outStream);
  archive.finalize();
});

const run = async () => {
  console.log('Downloading Intel');
  const intelZipPath = await download('x64');

  console.log('Downloading ARM');
  const armZipPath = await download('arm64');

  console.log('Extracting Intel');
  const intelAppPath = await extract(intelZipPath, 'intel');

  console.log('Extracting ARM');
  const armAppPath = await extract(armZipPath, 'arm');

  console.log('Generating Universal');
  const outputPath = getTempFile('Electron Universal.app');
  rimraf.sync(outputPath);
  await makeUniversalApp({
    x64AppPath: intelAppPath,
    arm64AppPath: armAppPath,
    outAppPath: outputPath
  });

  console.log('Compressing Universal');
  const compressedPath = getTempFile(`electron-macos-universal-${electronVersion}.zip`);
  rimraf.sync(compressedPath);
  await compress(outputPath, compressedPath);

  console.log(`Done. Output is ${compressedPath}`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
