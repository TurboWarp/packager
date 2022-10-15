import optimizeSb3Json from './minify/sb3';
import {downloadProjectFromBuffer} from '@turbowarp/sbdl';

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
};

export const downloadProject = async (projectData, progressCallback = () => {}) => {
  let analysis = unknownAnalysis();

  const options = {
    onProgress(type, loaded, total) {
      progressCallback(type, loaded, total);
    },

    processJSON(type, projectData) {
      if (type === 'sb3') {
        mutateScratch3InPlace(projectData);
        analysis = analyzeScratch3(projectData);
        return projectData;
      }
      if (type === 'sb2') {
        analysis = analyzeScratch2(projectData);
      }
    }
  };

  const project = await downloadProjectFromBuffer(projectData, options);
  if (project.type !== 'sb3') {
    project.type = 'blob';
  }
  project.analysis = analysis;
  return project;
};
