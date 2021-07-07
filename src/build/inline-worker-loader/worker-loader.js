const realWorkerLoader = require('worker-loader');

module.exports.pitch = function inlineWorkerLoaderPitch (...args) {
  // This is a hack to always make worker-loader run inline.
  const newThis = new Proxy(this, {
    get(target, property) {
      if (property === 'query') {
        return {
          inline: true,
          fallback: false
        };
      }
      return target[property];
    }
  });
  return realWorkerLoader.pitch.call(newThis, ...args);
};
