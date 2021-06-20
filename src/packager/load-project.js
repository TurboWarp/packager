import * as Comlink from 'comlink';
import DownloadWorker from 'worker-loader?name=downloader.worker.js!./downloader.worker.js';
import {readAsArrayBuffer} from './lib/readers';
import xhr from './lib/xhr';

const fromID = async (id, progressCallback) => {
  const buffer = await xhr({
    url: `https://projects.scratch.mit.edu/${id}`,
    type: 'arraybuffer',
    progressCallback: (progress) => {
      progressCallback('fetch', progress);
    }
  });
  const worker = Comlink.wrap(new DownloadWorker());
  const project = await worker.downloadProject(Comlink.transfer(buffer, [buffer]), Comlink.proxy(progressCallback));
  return project;
};

const fromFile = async (file, progressCallback) => {
  const worker = Comlink.wrap(new DownloadWorker());
  const buffer = await readAsArrayBuffer(file);
  const project = await worker.downloadProject(Comlink.transfer(buffer, [buffer]), Comlink.proxy(progressCallback));
  return project;
};

export default {
  fromID,
  fromFile
};
