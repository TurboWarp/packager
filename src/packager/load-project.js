import {transfer, proxy} from 'comlink';
import DownloadWorker from '../build/p4-worker-loader!./download-project';
import {readAsArrayBuffer} from '../common/readers';
import xhr from './xhr';

const downloadProject = async (buffer, progressCallback) => {
  const {worker, terminate} = new DownloadWorker();
  const project = await worker.downloadProject(transfer(buffer, [buffer]), proxy(progressCallback));
  terminate();
  return project;
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
