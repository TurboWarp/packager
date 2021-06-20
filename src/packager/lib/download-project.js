import JSZip from 'jszip';

const ASSET_HOST = 'https://assets.scratch.mit.edu/internalapi/asset/$path/get/';

const identifyProjectType = (projectData) => {
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
      const stageVariables = {};
      for (const {name, value, isPersistent} of projectData.variables) {
        stageVariables[name] = {
          name,
          isCloud: isPersistent
        };
      }
      return {
        zip,
        stageVariables: {}
      };
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
    .then(() => {
      const stage = targets[0];
      const stageVariables = {};
      for (const id of Object.keys(stage.variables)) {
        const [name, value, cloud] = stage.variables[id];
        stageVariables[id] = {
          name,
          isCloud: !!cloud
        };
      }
      return {
        zip,
        stageVariables
      };
    });
};

const downloadJSONProject = (json, progressTarget) => {
  const type = identifyProjectType(json);
  if (type === 'sb3') {
    return loadScratch3(json, progressTarget);
  } else if (type === 'sb2') {
    return loadScratch2(json, progressTarget);
  } else {
    throw new Error('Unknown project type');
  }
};

const downloadProject = async (data, progressTarget) => {
  // TODO: move to worker
  const bufferView = new Uint8Array(data);
  if (bufferView[0] === '{'.charCodeAt(0)) {
    // Looks like it's JSON
    const text = new TextDecoder().decode(data);
    const json = JSON.parse(text);
    const type = identifyProjectType(json);
    const result = await downloadJSONProject(json, progressTarget);
    const blob = await result.zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE'
    });
    return {
      type: type === 'sb3' ? 'sb3' : 'blob',
      blob,
      stageVariables: result.stageVariables
    };
  }
  // It's a binary blob
  return {
    type: 'blob',
    blob: new Blob([data]),
    stageVariables: {}
  };
};

export default downloadProject;
