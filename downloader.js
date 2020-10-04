/*
Copyright (c) 2020 Thomas Weber

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

class SBDownloader extends EventTarget {
  constructor(id) {
    super();
    this.id = '' + id;
  }

  async _loadData() {
    const request = await fetch(SBDownloader.PROJECT_HOST.replace('$id', this.id));
    if (request.status !== 200) {
      throw new Error(`Cannot fetch project: unexpected status code ${request.status}`);
    }
    return await request.blob();
  }

  async download() {
    const data = await this._loadData();
    const asText = await SBDownloader.readAsText(data);

    if (SBDownloader.checkMagic(asText, SBDownloader.SB_MAGIC) || SBDownloader.checkMagic(asText, SBDownloader.ZIP_MAGIC)) {
      // Already binary data, no changes necessary.
      return await SBDownloader.readAsArrayBuffer(data);
    }

    let projectData;
    try {
      projectData = JSON.parse(asText);
    } catch (e) {
      throw new Error(`Project JSON is invalid, but not a binary project either (${e})`);
    }

    if ('targets' in projectData) {
      return SBDownloader.loadScratch3(projectData);
    } else if ('objName' in projectData) {
      return SBDownloader.loadScratch2(projectData);
    } else {
      throw new Error('Project JSON is valid, but of unknown type');
    }
  }
}

SBDownloader.readAsText = blob => new Promise((resolve, reject) => {
  const fileReader = new FileReader();
  fileReader.onloadend = () => resolve(fileReader.result);
  fileReader.onerror = () => reject(new Error('Cannot read as text'));
  fileReader.readAsText(blob);
});

SBDownloader.readAsArrayBuffer = blob => new Promise((resolve, reject) => {
  const fileReader = new FileReader();
  fileReader.onloadend = () => resolve(fileReader.result);
  fileReader.onerror = () => reject(new Error('Cannot read as blob'));
  fileReader.readAsArrayBuffer(blob);
});

SBDownloader.SB_MAGIC = 'ScratchV0';
SBDownloader.ZIP_MAGIC = 'PK';

SBDownloader.PROJECT_HOST = 'https://projects.scratch.mit.edu/$id';
SBDownloader.ASSET_HOST = 'https://assets.scratch.mit.edu/internalapi/asset/$path/get/';

SBDownloader.checkMagic = (text, magic) => {
  for (let i = 0; i < magic.length; i++) {
    if (text[i] !== magic[i]) {
      return false;
    }
  }
  return true;
};

SBDownloader.loadScratch2 = projectData => {
  const zip = new JSZip();

  const IMAGE_EXTENSIONS = ['svg', 'png'];
  const SOUND_EXTENSIONS = ['wav', 'mp3'];

  // sb2 files have two ways of storing references to files.
  // In the online editor they use md5 hashes which point to an API destination.
  // In the offline editor they use separate accumulative file IDs for images and sounds.
  // The files served from the Scratch API don't contain the file IDs we need to export a valid .sb2, so we must create those ourselves.

  let soundAccumulator = 0;
  let imageAccumulator = 0;

  function md5Of(thing) {
    return thing.md5 || thing.baseLayerMD5 || thing.penLayerMD5 || thing.toString();
  }

  function claimAccumulatedID(extension) {
    if (IMAGE_EXTENSIONS.includes(extension)) {
      return imageAccumulator++;
    } else if (SOUND_EXTENSIONS.includes(extension)) {
      return soundAccumulator++;
    } else {
      throw new Error('unknown extension: ' + extension);
    }
  }

  function addAsset(asset) {
    const md5 = asset.md5;
    const extension = asset.extension;
    const accumulator = claimAccumulatedID(extension);
    const path = accumulator + '.' + extension;

    // Update IDs in all references to match the accumulator
    // Downloaded projects usually use -1 for all of these, but sometimes they exist and are just wrong since we're redoing them all.
    for (const reference of asset.references) {
      if ('baseLayerID' in reference) {
        reference.baseLayerID = accumulator;
      }
      if ('soundID' in reference) {
        reference.soundID = accumulator;
      }
      if ('penLayerID' in reference) {
        reference.penLayerID = accumulator;
      }
    }

    return fetch(SBDownloader.ASSET_HOST.replace('$path', md5))
      .then((request) => request.arrayBuffer())
      .then((buffer) => {
        zip.file(path, buffer);
      });
  }

  // Processes a list of assets
  // Finds and groups duplicate assets.
  function processAssets(assets) {
    // Records a list of all unique asset md5s and stores all references to an asset.
    const hashToAssetMap = Object.create(null);
    const allAssets = [];

    for (const data of assets) {
      const md5ext = md5Of(data);
      if (!(md5ext in hashToAssetMap)) {
        const asset = {
          md5: md5ext,
          extension: md5ext.split('.').pop(),
          references: [],
        };
        hashToAssetMap[md5ext] = asset;
        allAssets.push(asset);
      }
      hashToAssetMap[md5ext].references.push(data);
    }

    return allAssets;
  }

  const children = projectData.children.filter((c) => !c.listName && !c.target);
  const targets = [].concat.apply([], [projectData, children]);
  const costumes = [].concat.apply([], targets.map((c) => c.costumes || []));
  const sounds = [].concat.apply([], targets.map((c) => c.sounds || []));
  const assets = processAssets([].concat.apply([], [costumes, sounds, projectData]));
  return Promise.all(assets.map((a) => addAsset(a)))
    .then(() => {
      // We must add the project JSON at the end because it is changed during the loading due to updating asset IDs
      zip.file('project.json', JSON.stringify(projectData));
      return zip.generateAsync({
        type: 'arraybuffer'
      });
    });
};

SBDownloader.loadScratch3 = projectData => {
  const zip = new JSZip();

  function addFile(data) {
    const path = data.md5ext || data.assetId + '.' + data.dataFormat;
    return fetch(SBDownloader.ASSET_HOST.replace('$path', path))
      .then((request) => request.arrayBuffer())
      .then((buffer) => {
        zip.file(path, buffer);
      });
  }

  // Removes assets with the same ID
  function dedupeAssets(assets) {
    const result = [];
    const knownIds = new Set();

    for (const i of assets) {
      const id = i.assetId;
      if (knownIds.has(id)) {
        continue;
      }
      knownIds.add(id);
      result.push(i);
    }

    return result;
  }

  zip.file('project.json', JSON.stringify(projectData));

  const targets = projectData.targets;
  const costumes = [].concat.apply([], targets.map((t) => t.costumes || []));
  const sounds = [].concat.apply([], targets.map((t) => t.sounds || []));
  const assets = dedupeAssets([].concat.apply([], [costumes, sounds]));

  return Promise.all(assets.map((a) => addFile(a)))
    .then(() => zip.generateAsync({
      type: 'arraybuffer'
    }));
};
