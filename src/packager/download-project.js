import JSZip from 'jszip';
import {EventTarget, CustomEvent} from '../common/event-target';
import optimizeSb3Json from './minify/sb3';
import fetchAsArrayBuffer from './safer-fetch';

const ASSET_HOST = 'https://assets.scratch.mit.edu/internalapi/asset/$path/get/';

// Browser support for Array.prototype.flat is not good enough yet
const flat = (array) => {
  const result = [];
  for (const i of array) {
    if (Array.isArray(i)) {
      for (const j of i) {
        result.push(j);
      }
    } else {
      result.push(i);
    }
  }
  return result;
};

const identifyProjectType = (projectData) => {
  if ('targets' in projectData) {
    return 'sb3';
  } else if ('objName' in projectData) {
    return 'sb2';
  }
  return null;
};

const isScratch1Project = (uint8array) => {
  const MAGIC = 'ScratchV';
  for (let i = 0; i < MAGIC.length; i++) {
    if (uint8array[i] !== MAGIC.charCodeAt(i)) {
      return false;
    }
  }
  return true;
};

const unknownAnalysis = () => ({
  stageVariables: [],
  stageComments: [],
  usesMusic: true
});

const analyzeScratch2 = (projectData) => {
  const stageVariables = (projectData.variables || [])
    .map(({name, isPersistent}) => ({
      name,
      isCloud: isPersistent
    }));
  // This may have some false positives, but that's okay.
  const stringified = JSON.stringify(projectData);
  const usesMusic = stringified.includes('drum:duration:elapsed:from:') ||
    stringified.includes('playDrum') ||
    stringified.includes('noteOn:duration:elapsed:from:');
  return {
    ...unknownAnalysis(),
    stageVariables,
    usesMusic
  };
};

const analyzeScratch3 = (projectData) => {
  const stage = projectData.targets[0];
  if (!stage || !stage.isStage) {
    throw new Error('Project does not have stage');
  }
  const stageVariables = Object.values(stage.variables)
    .map(([name, _value, cloud]) => ({
      name,
      isCloud: !!cloud
    }));
  const stageComments = Object.values(stage.comments)
    .map((i) => i.text);
  // TODO: usesMusic has possible false negatives
  const usesMusic = projectData.extensions.includes('music');
  return {
    ...unknownAnalysis(),
    stageVariables,
    stageComments,
    usesMusic
  };
};

const mutateScratch3InPlace = (projectData) => {
  const makeImpliedCloudVariables = (projectData) => {
    const stage = projectData.targets.find((i) => i.isStage);
    if (stage) {
      for (const variable of Object.values(stage.variables)) {
        const name = variable[0];
        if (name.startsWith('☁')) {
          variable[2] = true;
        }
      }
    }
  };
  
  makeImpliedCloudVariables(projectData);
  optimizeSb3Json(projectData);

  return projectData;
};

const loadScratch2 = (projectData, progressTarget) => {
  const IMAGE_EXTENSIONS = ['svg', 'png', 'jpg', 'jpeg', 'bmp'];
  const SOUND_EXTENSIONS = ['wav', 'mp3'];

  const zip = new JSZip();

  // sb2 files have two ways of storing references to files.
  // In the online editor they use md5 hashes ("md5ext" because they also have an extension).
  // In the offline editor they use separate integer file IDs for images and sounds.
  // We need the sb2 to use those integer file IDs, but the ones from the Scratch API don't have those, so we create them ourselves

  let soundAccumulator = 0;
  let imageAccumulator = 0;

  const getExtension = (md5ext) => md5ext.split('.')[1] || '';

  const nextId = (md5) => {
    const extension = getExtension(md5);
    if (IMAGE_EXTENSIONS.includes(extension)) {
      return imageAccumulator++;
    } else if (SOUND_EXTENSIONS.includes(extension)) {
      return soundAccumulator++;
    }
    console.warn('unknown extension: ' + extension);
    return imageAccumulator++;
  };

  const fetchAndStoreAsset = (md5ext, id) => {
    progressTarget.dispatchEvent(new CustomEvent('asset-fetch', {
      detail: md5ext
    }));
    return fetchAsArrayBuffer(ASSET_HOST.replace('$path', md5ext))
      .then((arrayBuffer) => {
        const path = `${id}.${getExtension(md5ext)}`;
        zip.file(path, arrayBuffer);
        progressTarget.dispatchEvent(new CustomEvent('asset-fetched', {
          detail: md5ext
        }));
      });
  };

  const downloadAssets = (assets) => {
    const md5extToId = new Map();

    const handleAsset = (md5ext) => {
      if (!md5extToId.has(md5ext)) {
        md5extToId.set(md5ext, nextId(md5ext));
      }
      return md5extToId.get(md5ext);
    };

    for (const asset of assets) {
      if (asset.md5) {
        asset.soundID = handleAsset(asset.md5);
      }
      if (asset.baseLayerMD5) {
        asset.baseLayerID = handleAsset(asset.baseLayerMD5);
      }
      if (asset.textLayerMD5) {
        asset.textLayerID = handleAsset(asset.textLayerMD5);
      }
    }

    return Promise.all(Array.from(md5extToId.entries()).map(([md5ext, id]) => fetchAndStoreAsset(md5ext, id)));
  };

  const targets = [
    projectData,
    ...projectData.children.filter((c) => !c.listName && !c.target)
  ];
  const costumes = flat(targets.map((i) => i.costumes || []));
  const sounds = flat(targets.map((i) => i.sounds || []));
  return downloadAssets([...costumes, ...sounds])
    .then(() => {
      // Project JSON is mutated during loading, so add it at the e nd.
      zip.file('project.json', JSON.stringify(projectData));
      return {
        zip,
        analysis: analyzeScratch2(projectData)
      };
    });
};

const loadScratch3 = (projectData, progressTarget) => {
  const zip = new JSZip();

  const addFile = (data) => {
    const path = data.md5ext || data.assetId + '.' + data.dataFormat;
    progressTarget.dispatchEvent(new CustomEvent('asset-fetch', {
      detail: path
    }));
    return fetchAsArrayBuffer(ASSET_HOST.replace('$path', path))
      .then((buffer) => {
        zip.file(path, buffer);
        progressTarget.dispatchEvent(new CustomEvent('asset-fetched', {
          detail: path
        }));
      });
  };

  // Removes assets with the same ID
  const dedupeAssets = (assets) => {
    const result = [];
    const knownIds = new Set();

    for (const i of assets) {
      // Use md5ext instead of assetId because there are a few projects that have assets with the same
      // assetId but different md5ext. (eg. https://scratch.mit.edu/projects/531881458)
      const id = i.md5ext;
      if (knownIds.has(id)) {
        continue;
      }
      knownIds.add(id);
      result.push(i);
    }

    return result;
  };

  zip.file('project.json', JSON.stringify(mutateScratch3InPlace(projectData)));

  const targets = projectData.targets;
  const costumes = flat(targets.map((t) => t.costumes || []));
  const sounds = flat(targets.map((t) => t.sounds || []));
  const assets = dedupeAssets([...costumes, ...sounds]);

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

export const downloadProject = async (data, progressCallback = () => {}) => {
  let type;
  let arrayBuffer;
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

    arrayBuffer = await downloaded.zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE'
    }, (meta) => {
      progressCallback('compress', meta.percent / 100);
    });
    analysis = downloaded.analysis;
  } else {
    if (isScratch1Project(bufferView)) {
      arrayBuffer = data;
      analysis = unknownAnalysis();
    } else {
      let zip;
      try {
        zip = await JSZip.loadAsync(data);
      } catch (e) {
        throw new Error('Cannot parse project: not a zip or sb');
      }
      const projectDataFile = zip.file(/^([^/]*\/)?project\.json$/)[0];
      if (!projectDataFile) {
        throw new Error('project.json is missing');
      }
      const pathPrefix = projectDataFile.name.substr(0, projectDataFile.name.indexOf('project.json'));
      if (pathPrefix !== '') {
        zip = zip.folder(pathPrefix);
      }
      const projectDataText = await projectDataFile.async('text');
      const projectData = JSON.parse(projectDataText);
      type = identifyProjectType(projectData);
      if (type === 'sb3') {
        zip.file('project.json', JSON.stringify(mutateScratch3InPlace(projectData)));
        arrayBuffer = await zip.generateAsync({
          type: 'arraybuffer',
          compression: 'DEFLATE'
        }, (meta) => {
          progressCallback('compress', meta.percent / 100);
        });
        analysis = analyzeScratch3(projectData);
      } else {
        arrayBuffer = data;
        analysis = analyzeScratch2(projectData);
      }
    }
  }

  if (type === 'sb3') {
    return {
      type: 'sb3',
      arrayBuffer,
      analysis
    }
  }
  return {
    type: 'blob',
    arrayBuffer,
    analysis
  };
};
