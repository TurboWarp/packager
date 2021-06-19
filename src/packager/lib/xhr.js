const xhr = ({
  url,
  type,
  progressCallback,
  timeout
}) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.onload = () => {
    if (xhr.status === 200) {
      resolve(xhr.response);
    } else {
      reject(new Error(`Unexpected status code: ${xhr.status}`));
    }
  };
  xhr.onerror = () => {
    reject(new Error('XHR error'));
  };
  if (progressCallback) {
    xhr.onprogress = (e) => {
      if (e.lengthComputable) {
        progressCallback(e.loaded / e.total);
      }
    };
  }
  xhr.responseType = type;
  xhr.open('GET', url);
  xhr.send();
  if (timeout) {
    setTimeout(() => {
      xhr.abort();
      reject(new Error('XHR timed out'));
    }, timeout);
  }
});

export default xhr;
