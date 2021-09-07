const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const path = require('path');

module.exports.pitch = function (request) {
  if (this.target !== 'web') {
    return 'throw new Error("Not supported in non-web environment");';
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
    // extra whitespace here won't matter
    const source = `
    import {wrap} from 'comlink';
    function createWorker() {
      const worker = new Worker(__webpack_public_path__ + ${JSON.stringify(file)});
      const terminate = () => {
        worker.terminate();
      };
      const wrapped = wrap(worker);
      return {worker: wrapped, terminate};
    };
    export default createWorker;
    `;
    return callback(null, source);
  });
};
