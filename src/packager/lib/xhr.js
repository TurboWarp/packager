const clampProgress = (n) => Math.max(0, Math.min(1, n));

const xhr = ({
  url,
  type,
  progressCallback,
  timeout,
  estimatedSize
}) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.onload = () => {
    if (xhr.status === 200) {
      resolve(xhr.response);
    } else {
      reject(new Error(`Request failed with status code: ${xhr.status}`));
    }
  };
  xhr.onerror = () => {
    reject(new Error('Request failed, are you offline?'));
  };
  if (progressCallback) {
    xhr.onprogress = (e) => {
      if (e.lengthComputable) {
        progressCallback(e.loaded / e.total);
      } else if (estimatedSize) {
        progressCallback(clampProgress(e.loaded / estimatedSize));
      }
    };
  }
  xhr.responseType = type;
  xhr.open('GET', url);
  xhr.send();
  if (timeout) {
    setTimeout(() => {
      xhr.abort();
      reject(new Error('Request timed out'));
    }, timeout);
  }
});

export default xhr;
