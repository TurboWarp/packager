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

/*
Requires JSZip (3.x.x): https://stuk.github.io/jszip/

Usage:

const project = await SBDownloader.download("123456789");
const type = project.type; // "sb", "sb2", or "sb3"
const blob = await project.asBlob();
const arrayBuffer = await project.asArrayBuffer();
*/

window.SBDownloader = (function() {
  const SB_MAGIC = 'ScratchV0';
  const ZIP_MAGIC = 'PK';

  const PROJECT_HOST = 'https://projects.scratch.mit.edu/$id';
  const ASSET_HOST = 'https://assets.scratch.mit.edu/internalapi/asset/$path/get/';

  class ZipProject {
    constructor (zip, type) {
      this._zip = zip;
      this.type = type;
    }

    asArrayBuffer() {
      return this._zip.generateAsync({
        type: 'arraybuffer'
      });
    }

    asBlob() {
      return this._zip.generateAsync({
        type: 'blob'
      });
    }
  }

  class BinaryProject {
    constructor (blob, type) {
      this._blob = blob;
      this.type = type;
    }

    asArrayBuffer() {
      return readAsArrayBuffer(this._blob);
    }

    asBlob() {
      return Promise.resolve(this._blob);
    }
  }

  const readAsText = (blob) => new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onloadend = () => resolve(fileReader.result);
    fileReader.onerror = () => reject(new Error('Cannot read as text'));
    fileReader.readAsText(blob);
  });

  const readAsArrayBuffer = (blob) => new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onloadend = () => resolve(fileReader.result);
    fileReader.onerror = () => reject(new Error('Cannot read as blob'));
    fileReader.readAsArrayBuffer(blob);
  });

  const checkMagic = (text, magic) => {
    for (let i = 0; i < magic.length; i++) {
      if (text[i] !== magic[i]) {
        return false;
      }
    }
    return true;
  };

  const fetchProject = (projectId, progressTarget) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Unexpected status code: ${xhr.status}`));
        }
      };
      xhr.onerror = () => {
        reject(new Error('XHR failed'));
      };
      xhr.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = e.loaded / e.total;
          progressTarget.dispatchEvent(new CustomEvent('data-progress', {
            detail: progress
          }));
        }
      };
      xhr.onloadend = () => {
        progressTarget.dispatchEvent(new CustomEvent('data-progress', {
          detail: 1
        }));
      };
      xhr.open('GET', PROJECT_HOST.replace('$id', projectId));
      xhr.send();
    });
  };

  const identifyProjectType = async (projectData) => {
    // If the data is a full project file, parse the file.
    if (projectData instanceof Blob || projectData instanceof ArrayBuffer) {
      let zip;
      try {
        zip = await JSZip.loadAsync(projectData);
      } catch (e) {
        return null;
      }
      const projectDataFile = zip.file('project.json');
      if (!projectDataFile) {
        return null;
      }
      const text = await projectDataFile.async('string');
      try {
        // TODO: Use a looser JSON.parse implementation for certain weird projects?
        const projectData = JSON.parse(text);
        return await identifyProjectType(projectData);
      } catch (e) {
        return null;
      }
    }

    if ('targets' in projectData) {
      return 'sb3';
    } else if ('objName' in projectData) {
      return 'sb2';
    }

    return null;
  };

  const loadScratch2 = (projectData, progressTarget) => {
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
 
      progressTarget.dispatchEvent(new CustomEvent('asset-fetch', {
        detail: md5
      }));

      return fetch(ASSET_HOST.replace('$path', md5))
        .then((request) => request.arrayBuffer())
        .then((buffer) => {
          zip.file(path, buffer);
          progressTarget.dispatchEvent(new CustomEvent('asset-fetched', {
            detail: md5
          }));
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
        return zip;
      });
  };

  const loadScratch3 = (projectData, progressTarget) => {
    const zip = new JSZip();
  
    function addFile(data) {
      const path = data.md5ext || data.assetId + '.' + data.dataFormat;
      progressTarget.dispatchEvent(new CustomEvent('asset-fetch', {
        detail: path
      }));
      return fetch(ASSET_HOST.replace('$path', path))
        .then((request) => request.arrayBuffer())
        .then((buffer) => {
          zip.file(path, buffer);
          progressTarget.dispatchEvent(new CustomEvent('asset-fetched', {
            detail: path
          }));
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
      .then(() => zip);
  };  

  const download = async (projectId, options = {}) => {
    const progressTarget = options.progressTarget || new EventTarget();

    const blob = await fetchProject(projectId, progressTarget);
    const asText = await readAsText(blob);

    if (checkMagic(asText, SB_MAGIC)) {
      return new BinaryProject(blob, 'sb');
    }
    if (checkMagic(asText, ZIP_MAGIC)) {
      return new BinaryProject(blob, await identifyProjectType(blob));
    }

    let projectData;
    try {
      projectData = JSON.parse(asText);
    } catch (e) {
      throw new Error(`Project JSON is invalid, but not a binary project either (${e})`);
    }

    const projectType = await identifyProjectType(projectData);
    if (projectType === 'sb3') {
      return new ZipProject(await loadScratch3(projectData, progressTarget), 'sb3');
    } else if (projectType === 'sb2') {
      return new ZipProject(await loadScratch2(projectData, progressTarget), 'sb2');
    } else {
      throw new Error('Project JSON is valid, but of unknown type');
    }
  };

  return {
    download,
    identifyProjectType,
  };
}());
