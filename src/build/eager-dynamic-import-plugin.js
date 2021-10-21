// Plugin to modify webpack to interpret all dynamic imports as webpackMode: "eager"

const patchParser = (parser) => {
  const originalParseCommentOptions = parser.parseCommentOptions;
  parser.parseCommentOptions = function (...args) {
    const result = originalParseCommentOptions.call(this, ...args);
    result.options.webpackMode = 'eager';
    return result;
  };
};

const PLUGIN_NAME = 'EagerDynamicImportPlugin';

class EagerDynamicImportPlugin {
  apply (compiler) {
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (normalModuleFactory) => {
      normalModuleFactory.hooks.parser.for('javascript/auto').tap(PLUGIN_NAME, patchParser);
      normalModuleFactory.hooks.parser.for('javascript/dynamic').tap(PLUGIN_NAME, patchParser);
      normalModuleFactory.hooks.parser.for('javascript/esm').tap(PLUGIN_NAME, patchParser);
    });
  }
}

module.exports = EagerDynamicImportPlugin;
