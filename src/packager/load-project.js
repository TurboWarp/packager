import {readAsArrayBuffer} from '../common/readers';
import request from '../common/request';
import {AbortError} from '../common/errors';

const downloadProject = async (buffer, progressCallback) => {
  const controller = typeof AbortController === 'function' && new AbortController();
  const downloadProject = await import(/* webpackChunkName: "downloader" */ './download-project.js');
  let reject;
  return {
    promise: new Promise((_resolve, _reject) => {
      reject = _reject;

      downloadProject.downloadProject(buffer, progressCallback, controller && controller.signal)
        .then(result => _resolve(result))
        .catch(err => _reject(err));
    }),

    terminate: () => {
      reject(new AbortError());
      if (controller) {
        controller.abort();
      }
    }
  };
};

const fromURL = async (url, progressCallback) => {
  const buffer = await request({
    url,
    type: 'arraybuffer',
    progressCallback: (progress) => {
      progressCallback('fetch', progress);
    }
  });
  return downloadProject(buffer, progressCallback);
};

const fromID = (id, token, progressCallback) => {
  const tokenPart = token ? `?token=${token}` : '';
  const url = `https://projects.scratch.mit.edu/${id}${tokenPart}`;
  return fromURL(url, progressCallback);
};

const fromFile = async (file, progressCallback) => {
  const buffer = await readAsArrayBuffer(file);
  return downloadProject(buffer, progressCallback);
};

export default {
  fromID,
  fromURL,
  fromFile
};
