import fetch from 'cross-fetch';

// Based on https://github.com/TurboWarp/scratch-storage/blob/develop/src/safer-fetch.js

// This throttles and retries fetch() to mitigate the effect of random network errors and
// random browser errors (especially in Chrome)

let currentFetches = 0;
const queue = [];

const MAX_ATTEMPTS = 3;
const MAX_CONCURRENT = 100;
const RETRY_DELAY = 5000;

const startNextFetch = ([resolve, url, options]) => {
  let firstError;
  let attempts = 0;

  const attemptToFetch = () => fetch(url, options)
    .then((r) => {
      if (r.ok) {
        return r.arrayBuffer()
      }
      throw new Error(`Unexpected status code: ${r.status}`);
    })
    .then((buffer) => {
      currentFetches--;
      checkStartNextFetch();
      return buffer;
    })
    .catch((error) => {
      console.warn(`Attempt to fetch ${url} failed`, error);
      if (!firstError) {
        firstError = error;
      }

      if (attempts < MAX_ATTEMPTS) {
        attempts++;
        return new Promise((cb) => setTimeout(cb, (attempts + Math.random() - 1) * RETRY_DELAY))
          .then(attemptToFetch);
      }

      currentFetches--;
      checkStartNextFetch();
      throw new Error(`Failed to fetch ${url}: ${firstError}`);
    });

  return resolve(attemptToFetch());
};

const checkStartNextFetch = () => {
  if (currentFetches < MAX_CONCURRENT && queue.length > 0) {
    currentFetches++;
    startNextFetch(queue.shift());
  }
};

const saferFetchAsArrayBuffer = (url, options) => new Promise((resolve) => {
  queue.push([resolve, url, options]);
  checkStartNextFetch();
});

export default saferFetchAsArrayBuffer;
