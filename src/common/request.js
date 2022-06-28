import {HTTPError, UnknownNetworkError} from './errors';

const clampProgress = (n) => Math.max(0, Math.min(1, n));

const DO_NOT_USE_FALLBACK_URL_ERRORS = [
  // If we make a request with eg. an invalid project ID, do not use fallback URLs
  400,
  // If we make a request with eg. an unshared project ID, do not use fallback URLs
  404,
];

const request = async (options) => {
  const {
    type,
    progressCallback,
    timeout,
    estimatedSize,
    abortTarget
  } = options;

  const requestURL = (url) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      cleanup();
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(new HTTPError(`Couldn't fetch ${url}: status code ${xhr.status}`, xhr.status));
      }
    };
    xhr.onerror = () => {
      cleanup();
      reject(new UnknownNetworkError(url));
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
        reject(new Error(`Couldn't fetch ${url}: aborted`));
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
        reject(new Error(`Couldn't fetch ${url}: timed out`));
      }, timeout);
    }
  });

  const urls = Array.isArray(options.url) ? options.url : [options.url];
  if (urls.length === 0) {
    throw new Error('no URLs');
  }
  let errorToThrow;
  for (const url of urls) {
    try {
      return await requestURL(url);
    } catch (e) {
      if (e instanceof HTTPError && DO_NOT_USE_FALLBACK_URL_ERRORS.includes(e.status)) {
        throw e;
      }
      // We'll record this error if this is the first error, or if the current error provides more information than
      // the old error. This is useful because:
      //  trampoline.turbowarp.org/... -> blocked by filter (appears to us as generic network error)
      //  trampoline.turbowarp.xyz/... -> returns status 500
      // should return the HTTP error, not the generic network error.
      if (!errorToThrow || (errorToThrow instanceof UnknownNetworkError && !(e instanceof UnknownNetworkError))) {
        errorToThrow = e;
      }
    }
  }
  throw errorToThrow;
};

export default request;
