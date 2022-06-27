const {downloadArtifact} = require('@electron/get');
const {makeUniversalApp} = require('@electron/universal');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const rimraf = require('rimraf');
const extractZip = require('extract-zip');
const archiver = require('archiver');
const crypto = require('crypto');

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
  const outputPath = getTempFile('Output');
  fs.mkdirSync(outputPath, {recursive: true});

  const EXTRA_FILES_TO_KEEP = [
    'LICENSE',
    'LICENSES.chromium.html',
    'version'
  ];
  for (const file of EXTRA_FILES_TO_KEEP) {
    fs.copyFileSync(path.join(intelAppPath, '..', file), path.join(outputPath, file));
  }

  const outputAppPath = path.join(outputPath, 'Electron.app');
  rimraf.sync(outputAppPath);
  await makeUniversalApp({
    x64AppPath: intelAppPath,
    arm64AppPath: armAppPath,
    outAppPath: outputAppPath
  });

  console.log('Compressing Universal');
  const compressedPath = getTempFile(`electron-v${electronVersion}-macos-universal.zip`);
  rimraf.sync(compressedPath);
  await compress(outputPath, compressedPath);
  console.log(`Output: ${compressedPath}`);

  const compressedFileData = fs.readFileSync(compressedPath);
  console.log(`Size: ${compressedFileData.length} bytes`)

  const sha256 = crypto.createHash('sha256').update(compressedFileData).digest('hex');
  console.log(`SHA-256: ${sha256}`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
