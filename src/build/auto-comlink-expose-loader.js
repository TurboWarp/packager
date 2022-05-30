const loaderUtils = require('loader-utils');

module.exports.pitch = function (request) {
  // extra whitespace here won't matter
  return `
  import {expose} from 'comlink';
  import * as mod from ${loaderUtils.stringifyRequest(this, request)};
  postMessage('ready');
  expose(mod);
  `;
};
