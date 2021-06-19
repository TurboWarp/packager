const wrapWorkerLoader = (WorkerLoader) => {
  const pitch = WorkerLoader.pitch;
  WorkerLoader.pitch = function wrapped (...args) {
    // Only affect the workers in scratch-storage and scratch-vm, not ours.
    if (!this.resourcePath.includes('node_modules')) {
      return pitch.call(this, ...args);
    }
    // We want to redefine this.query, but it's a readonly unconfigurable property.
    // So, we can change what `this` means instead.
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
    return pitch.call(newThis, ...args);
  };
};

wrapWorkerLoader(require('worker-loader/dist/index'));
wrapWorkerLoader(require('scratch-vm/node_modules/worker-loader/dist/index'));
