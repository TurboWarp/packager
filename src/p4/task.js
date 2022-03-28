import {EventTarget} from '../common/event-target';
import {AbortError} from '../common/errors';
import {progress, error, currentTask} from './stores';

class Task extends EventTarget {
  constructor () {
    super();
    this.aborted = false;
    progress.reset();
    progress.update((p) => {
      p.visible = true;
      return p;
    });
    currentTask.replace(this);
  }

  abort () {
    if (!this.aborted) {
      this.aborted = true;
      this.dispatchEvent(new Event('abort'));
    }
  }

  error (e) {
    if (!this.aborted) {
      error.set(e);
      progress.reset();
      this.abort();
    }
  }

  setProgress (percent) {
    if (!this.aborted) {
      progress.update((p) => {
        p.progress = percent;
        return p;
      });
    }
  }

  setProgressText (text) {
    if (!this.aborted) {
      progress.update((p) => {
        p.text = text;
        return p;
      });
    }
  }

  whenAbort (callback) {
    this.addEventListener('abort', callback);
    if (this.aborted) {
      callback();
    }
  }

  do (promise) {
    if (this.aborted) {
      return Promise.reject(new AbortError());
    }
    return new Promise((resolve, reject) => {
      const abortCallback = () => {
        reject(new AbortError());
      };
      this.addEventListener('abort', abortCallback);
      promise
        .then((r) => {
          resolve(r);
          this.removeEventListener('abort', abortCallback);
        })
        .catch((e) => {
          reject(e);
          this.error(e);
          this.removeEventListener('abort', abortCallback);
        });
    });
  }

  done () {
    progress.update((p) => {
      p.visible = false;
      return p;
    });
    currentTask.set(null);
  }
}

export default Task;
