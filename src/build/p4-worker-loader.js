const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const path = require('path');
const loaderUtils = require('loader-utils');

module.exports.pitch = function (request) {
  if (this.target !== 'web') {
    return `
    import * as mod from ${loaderUtils.stringifyRequest(this, request)};
    const shimmedCreateWorker = () => {
      return {
        worker: mod,
        terminate: () => {}
      };
    };
    export default shimmedCreateWorker;
    `;
  }
  const compilerOptions = this._compiler.options || {};
  const options = {
    filename: compilerOptions.output.filename.replace('.js', '.worker.js')
  };
  this.cacheable(false);
  const callback = this.async();
  const compiler = this._compilation.createChildCompiler('p4 worker loader', options);
  const exposeLoader = path.resolve(__dirname, 'auto-comlink-expose-loader.js');
  new SingleEntryPlugin(
    this.context,
    `!!${exposeLoader}!${request}`,
    path.parse(this.resourcePath).name
  ).apply(compiler);
  compiler.runAsChild((err, entries, compilation) => {
    if (err) return callback(err);
    const file = entries[0].files[0];
    const inline = !!process.env.STANDALONE;
    // extra whitespace here won't matter
    const source = `
    import {wrap} from 'comlink';
    const createWorker = () => {
      ${inline ? `
        const source = ${JSON.stringify(compilation.assets[file].source())};
        const blob = new Blob([source]);
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);
        URL.revokeObjectURL(url);
      ` : `
        const worker = new Worker(__webpack_public_path__ + ${JSON.stringify(file)});
      `}
      return new Promise((resolve, reject) => {
        const terminate = () => {
          worker.terminate();
        };
        const onMessage = (e) => {
          if (e.data === 'ready') {
            cleanup();
            resolve({
              worker: wrap(worker),
              terminate
            });
          }
        };
        const onError = () => {
          cleanup();
          reject(new Error(${JSON.stringify(`Worker ${file} failed to load.`)}));
        };
        const cleanup = () => {
          worker.removeEventListener('message', onMessage);
          worker.removeEventListener('error', onError);
        };
        worker.addEventListener('message', onMessage);
        worker.addEventListener('error', onError);
      });
    };
    export default createWorker;
    `;
    return callback(null, source);
  });
};
