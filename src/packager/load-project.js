import {transfer, proxy} from 'comlink';
import createDownloadWorker from '../build/p4-worker-loader!./download-project';
import {readAsArrayBuffer} from '../common/readers';
import request from '../common/request';
import {AbortError} from '../common/errors';

const downloadProject = async (buffer, progressCallback) => {
  const {worker, terminate} = await createDownloadWorker();
  let terminateAndReject;
  const downloadPromise = new Promise((resolve, reject) => {
    worker.downloadProject(transfer(buffer, [buffer]), proxy(progressCallback))
      .then((res) => {
        terminate();
        resolve(res);
      })
      .catch((err) => {
        terminate();
        reject(err)
      });
    terminateAndReject = () => {
      terminate();
      reject(new AbortError());
    };
  });
  return {
    promise: downloadPromise,
    terminate: terminateAndReject
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
  // TODO: enable tokens when we're pretty sure nothing will break
  let url = `https://projects.scratch.mit.edu/${id}`;
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
