const source = `<!DOCTYPE html>
<html>
<head>
  <title>Loading Preview</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
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
    text-align: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    user-select: none;
    -webkit-user-select: none;
  }
  .preview-progress-outer {
    width: 200px;
    height: 10px;
    border: 1px solid white;
  }
  .preview-progress-inner {
    height: 100%;
    width: 0;
    background: white;
  }
  [hidden] {
    display: none;
  }
  </style>
</head>
<body>
  <div class="preview-message">
    <div class="preview-progress-outer"><div class="preview-progress-inner"></div></div>
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
    const progressBar = document.querySelector(".preview-progress-inner");
    const progressText = document.querySelector(".preview-progress-text");
    window.addEventListener("message", (e) => {
      if (e.origin !== location.origin) return;
      if (hasRun) return;
      if (e.data.blob) {
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
      if (typeof e.data.progress === "number") {
        progressBar.style.width = (e.data.progress * 100) + "%";
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

  setProgress (progress, text) {
    this.window.postMessage({
      progress,
      text
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
