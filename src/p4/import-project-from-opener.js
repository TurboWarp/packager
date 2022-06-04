const importProjectFromOpener = ({
  onStartImporting,
  onFinishImporting,
  onCancelImporting
}) => {
  // TODO: check origin

  const opener = window.opener || window.parent;
  if (!opener || opener === window) {
    console.warn('Import ignored: cannot find parent window');
    return;
  }

  const post = (data) => opener.postMessage({
    p4: data
  }, '*');

  const onMessage = (e) => {
    const data = e.data && e.data.p4;
    if (data) {
      if (data.type === 'start-import') {
        onStartImporting();
      } else if (data.type === 'finish-import') {
        const buffer = data.data;
        const name = data.name || 'Untitled';
        const file = new File([buffer], name);
        cleanup();
        onFinishImporting(file);
      } else if (data.type === 'cancel-import') {
        cleanup();
        onCancelImporting();
      } else {
        console.warn('Unknown import message', data);
      }
    }
  };
  window.addEventListener('message', onMessage);

  const cleanup = () => {
    window.removeEventListener('message', onMessage);
  };

  post({
    type: 'ready-for-import'
  });
};

export default importProjectFromOpener;
