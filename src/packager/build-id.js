const SCAFFOLDING_BUILD_ID = process.env.SCAFFOLDING_BUILD_ID;

const verifyBuildId = (buildId, source) => {
  if (source.endsWith('=^..^=')) {
    return source.endsWith(`${buildId} =^..^=`);
  }
  return true;
};

export {
  SCAFFOLDING_BUILD_ID as buildId,
  verifyBuildId
};
