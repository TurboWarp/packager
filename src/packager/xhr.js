const clampProgress = (n) => Math.max(0, Math.min(1, n));

const xhr = ({
  url,
  type,
  progressCallback,
  timeout,
  estimatedSize,
  abortTarget
}) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.onload = () => {
    cleanup();
    if (xhr.status === 200) {
      resolve(xhr.response);
    } else {
      reject(new Error(`Request failed with status code: ${xhr.status}`));
    }
  };
  xhr.onerror = () => {
    cleanup();
    reject(new Error('Request failed, are you offline?'));
  };

  if (progressCallback) {
    xhr.onprogress = (e) => {
      if (e.lengthComputable) {
        progressCallback(clampProgress(e.loaded / e.total));
      } else if (estimatedSize) {
        progressCallback(clampProgress(e.loaded / estimatedSize));
      }
    };
  }

  xhr.responseType = type;
  xhr.open('GET', url);
  xhr.send();

  const cleanup = () => {
    if (cleanupAbortCallback) {
      cleanupAbortCallback();
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  let cleanupAbortCallback;
  if (abortTarget) {
    const abortCallback = () => {
      xhr.abort();
      cleanup();
      reject(new Error('Request aborted'));
    };
    abortTarget.addEventListener('abort', abortCallback);
    cleanupAbortCallback = () => {
      abortTarget.removeEventListener('abort', abortCallback);
    };
  }

  let timeoutId;
  if (timeout) {
    timeoutId = setTimeout(() => {
      xhr.abort();
      cleanup();
      reject(new Error('Request timed out'));
    }, timeout);
  }
});

export default xhr;
