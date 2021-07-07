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

const unknownAnalysis = () => ({
  stageVariables: {},
  usesMusic: true
});

const analyzeScratch2 = (projectData) => {
  const stageVariables = {};
  if (projectData.variables) {
    for (const {name, value, isPersistent} of projectData.variables) {
      stageVariables[name] = {
        name,
        isCloud: isPersistent
      };
    }
  }
  return {
    stageVariables,
    // We currently don't analyze these projects so assume that they do, for safety
    usesMusic: true
  };
};

const analyzeScratch3 = (projectData) => {
  const stage = projectData.targets[0];
  const stageVariables = {};
  for (const id of Object.keys(stage.variables)) {
    const [name, value, cloud] = stage.variables[id];
    stageVariables[id] = {
      name,
      isCloud: !!cloud
    };
  }
  const usesMusic = projectData.extensions.includes('music');
  return {
    stageVariables,
    usesMusic
  };
};

const loadScratch2 = (projectData, progressTarget) => {
  const zip = new JSZip();

  const IMAGE_EXTENSIONS = ['svg', 'png', 'jpg', 'jpeg', 'bmp'];
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
      return {
        zip,
        analysis: analyzeScratch2(projectData)
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
      return {
        zip,
        analysis: analyzeScratch3(projectData)
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

const downloadProject = async (data, progressCallback) => {
  let type;
  let blob;
  let analysis;

  const bufferView = new Uint8Array(data);
  if (bufferView[0] === '{'.charCodeAt(0)) {
    // JSON project, we have to download all the assets
    const progressTarget = new EventTarget();

    let isDoneLoadingProject = false;
    let timeout;
    let loadedAssets = 0;
    let totalAssets = 0;
    const sendThrottledAssetProgressUpdate = () => {
      if (timeout) {
        return;
      }
      setTimeout(() => {
        if (!isDoneLoadingProject) {
          progressCallback('assets', loadedAssets, totalAssets);
        }
      });
    };
    progressTarget.addEventListener('asset-fetch', () => {
      totalAssets++;
      sendThrottledAssetProgressUpdate();
    });
    progressTarget.addEventListener('asset-fetched', () => {
      loadedAssets++;
      sendThrottledAssetProgressUpdate();
    });

    const text = new TextDecoder().decode(data);
    const json = JSON.parse(text);
    type = identifyProjectType(json);
    const downloaded = await downloadJSONProject(json, progressTarget);
    progressCallback('assets', totalAssets, totalAssets);
    isDoneLoadingProject = true;

    blob = await downloaded.zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE'
    }, (meta) => {
      progressCallback('compress', meta.percent / 100);
    });
    analysis = downloaded.analysis;
  } else {
    // It's a binary blob
    blob = new Blob([data]);
    let zip;
    try {
      zip = await JSZip.loadAsync(data);
    } catch (e) {
      console.warn(e);
    }
    if (zip) {
      const projectDataFile = zip.file('project.json');
      const projectDataText = await projectDataFile.async('text');
      const projectData = JSON.parse(projectDataText);
      type = identifyProjectType(projectData);
      if (type === 'sb3') {
        analysis = analyzeScratch3(projectData);
      } else {
        analysis = analyzeScratch2(projectData);
      }
    } else {
      type = 'sb';
      analysis = unknownAnalysis();
    }
  }

  if (type === 'sb3') {
    return {
      type: 'sb3',
      blob,
      analysis
    }
  }
  return {
    type: 'blob',
    blob,
    analysis
  };
};

export default downloadProject;
