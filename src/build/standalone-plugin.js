// Plugin to modify webpack to interpret all dynamic imports as webpackMode: "eager"

const patchParser = (parser) => {
  const originalParseCommentOptions = parser.parseCommentOptions;
  parser.parseCommentOptions = function (...args) {
    const result = originalParseCommentOptions.call(this, ...args);
    result.options.webpackMode = 'eager';
    return result;
  };
};

class TWStandalonePlugin {
  apply (compiler) {
    compiler.hooks.normalModuleFactory.tap('TWStandalonePlugin', (normalModuleFactory) => {
      normalModuleFactory.hooks.parser.for('javascript/auto').tap('TWStandalonePlugin', patchParser);
      normalModuleFactory.hooks.parser.for('javascript/dynamic').tap('TWStandalonePlugin', patchParser);
      normalModuleFactory.hooks.parser.for('javascript/esm').tap('TWStandalonePlugin', patchParser);
    });
  }
}

module.exports = TWStandalonePlugin;
