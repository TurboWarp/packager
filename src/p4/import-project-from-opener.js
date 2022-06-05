const importProjectFromOpener = ({
  origin,
  onStartImporting,
  onFinishImporting,
  onCancelImporting
}) => {
  const opener = window.opener || window.parent;
  if (!opener || opener === window) {
    console.warn('Import ignored: cannot find parent window');
    return;
  }

  if (!origin.startsWith('http:') && !origin.startsWith('https:')) {
    console.warn('Import ignored: invalid origin');
    return;
  }

  const post = (data) => {
    // postMessage could throw if origin is invalid
    try {
      opener.postMessage({
        p4: data
      }, origin);
    } catch (e) {
      console.warn('Cannot post message', e);
    }
  };

  let hasStarted = false;
  let hasFinishedOrCancelled = false;

  const onMessage = (e) => {
    if (e.origin !== origin) {
      return;
    }

    const data = e.data && e.data.p4;
    if (!data) {
      return;
    }

    if (!hasStarted) {
      if (data.type === 'start-import') {
        hasStarted = true;
        onStartImporting();
      }
    } else if (!hasFinishedOrCancelled) {
      if (data.type === 'finish-import') {
        cleanup();

        // Convert data to File
        const buffer = data.data;
        // Default title should not be changed.
        const name = data.name || 'Untitled';
        const file = new File([buffer], name);

        // Convert File to FileList
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        onFinishImporting(dataTransfer.files);
      } else if (data.type === 'cancel-import') {
        cleanup();
        onCancelImporting();
      }
    }
  };
  window.addEventListener('message', onMessage);

  const cleanup = () => {
    hasFinishedOrCancelled = true;
    window.removeEventListener('message', onMessage);
  };

  post({
    type: 'ready-for-import'
  });
};

export default importProjectFromOpener;
