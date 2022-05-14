import fetch from 'cross-fetch';

// Imported from https://github.com/TurboWarp/scratch-storage/blob/develop/src/safer-fetch.js

// This throttles and retries fetch() to mitigate the effect of random network errors and
// random browser errors (especially in Chrome)

let currentFetches = 0;
const queue = [];

const startNextFetch = ([resolve, url, options]) => {
  let firstError;
  let attempts = 0;

  const attemptToFetch = () => fetch(url, options)
  .then(r => r.arrayBuffer())
  .then(buffer => {
    currentFetches--;
    checkStartNextFetch();
    return buffer;
  })
  .catch(error => {
    console.warn(`Attempt to fetch ${url} failed`, error);
    if (!firstError) {
      firstError = error;
    }

    if (attempts < 3) {
      attempts++;
      return new Promise(cb => setTimeout(cb, (attempts + Math.random() - 1) * 5000))
      .then(attemptToFetch);
    }

    currentFetches--;
    checkStartNextFetch();
    throw firstError;
  });

  return resolve(attemptToFetch());
};

const checkStartNextFetch = () => {
  if (currentFetches < 100 && queue.length > 0) {
    currentFetches++;
    startNextFetch(queue.shift());
  }
};

const saferFetchAsArrayBuffer = (url, options) => new Promise(resolve => {
  queue.push([resolve, url, options]);
  checkStartNextFetch();
});

export default saferFetchAsArrayBuffer;
