import {transfer, proxy} from 'comlink';
import createDownloadWorker from '../build/p4-worker-loader!./download-project';
import {readAsArrayBuffer} from '../common/readers';
import xhr from './xhr';
import {AbortError} from '../p4/errors';

const downloadProject = async (buffer, progressCallback) => {
  const {worker, terminate} = createDownloadWorker();
  let terminateAndReject;
  const downloadPromise = new Promise((resolve, reject) => {
    worker.downloadProject(transfer(buffer, [buffer]), proxy(progressCallback))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
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
  const buffer = await xhr({
    url,
    type: 'arraybuffer',
    progressCallback: (progress) => {
      progressCallback('fetch', progress);
    }
  });
  return downloadProject(buffer, progressCallback);
};

const fromID = (id, progressCallback) => fromURL(`https://projects.scratch.mit.edu/${id}`, progressCallback);

const fromFile = async (file, progressCallback) => {
  const buffer = await readAsArrayBuffer(file);
  return downloadProject(buffer, progressCallback);
};

export default {
  fromID,
  fromURL,
  fromFile
};
