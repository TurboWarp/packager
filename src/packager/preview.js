const source = `<!DOCTYPE html>
<html>
<head>
  <title>Packaged Project</title>
  <meta charset="utf8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
  body {
    background: black;
    color: white;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  }
  .preview-message {
    background: inherit;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    user-select: none;
  }
  [hidden] {
    display: none;
  }
  </style>
</head>
<body>
  <div class="preview-message">
    <div>Waiting for packager...</div>
    <div>If this is taking a while, check the original tab and try again.</div>
  </div>
  <div class="preview-message preview-error" hidden>
    <div class="preview-error-message"></div>
    <div>Go back to the original tab and try again</div>
  </div>
  <script>
  (function() {
    const err = (message) => {
      document.querySelector(".preview-error").hidden = false;
      document.querySelector(".preview-error-message").textContent = "Error: " + message;
    };
    if (!window.opener) {
      err("window.opener is missing");
      return;
    }
    let hasRun = false;
    window.addEventListener("message", (e) => {
      if (e.origin !== location.origin) return;
      if (e.data.blob) {
        if (hasRun) return;
        hasRun = true;
        const fr = new FileReader();
        fr.onload = () => {
          document.open();
          document.write(fr.result);
          document.close(); // fixes poor performance in firefox
        };
        fr.onerror = () => {
          err("Something went wrong reading the file");
        };
        fr.readAsText(e.data.blob);
      }
    });
    window.opener.postMessage({
      preview: "hello"
    }, location.origin);
  })();
  </script>
</body>
</html>
`;
const previewURL = URL.createObjectURL(new Blob([source], {
  type: 'text/html'
})) + '#do-not-share-this-link-it-will-not-work-for-others';

const windowToBlobMap = new WeakMap();

class Preview {
  constructor () {
    this.window = window.open(previewURL);
    if (!this.window) {
      throw new Error('Cannot open popup');
    }
  }

  setContent (content) {
    windowToBlobMap.set(this.window, content);
    this.window.postMessage({
      blob: content
    }, location.origin);
  }

  close () {
    this.window.close();
  }
}

window.addEventListener('message', (e) => {
  if (e.origin !== location.origin) {
    return;
  }
  const data = e.data;
  if (data.preview === 'hello') {
    const source = e.source;
    const blob = windowToBlobMap.get(source);
    if (blob) {
      source.postMessage({
        blob
      }, location.origin);
    }
  }
});

export default Preview;
