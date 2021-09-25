class TWStandalonePlugin {
  apply () {
    // Modify webpack to interpret all dynamic imports as webpackMode: "eager"
    const Parser = require('webpack/lib/Parser');
    const originalParseCommentOptions = Parser.prototype.parseCommentOptions;
    Parser.prototype.parseCommentOptions = function (...args) {
      const result = originalParseCommentOptions.call(this, ...args);
      result.options.webpackMode = 'eager';
      return result;
    };
  }
}

module.exports = TWStandalonePlugin;
