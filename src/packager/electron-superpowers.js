const exposeBrowserWindowMethods = [
  // https://www.electronjs.org/docs/latest/api/browser-window
  'focus',
  'blur',
  'isFocused',
  'show',
  'showInactive',
  'hide',
  'isVisible',
  'maximize',
  'unmaximize',
  'isMaximized',
  'minimize',
  'restore',
  'isMinimized',
  'isNormal',
  'setAspectRatio',
  'setBounds',
  'getBounds',
  'setContentBounds',
  'getContentBounds',
  'getNormalBounds',
  'setEnabled',
  'isEnabled',
  'setSize',
  'getSize',
  'setContentSize',
  'getContentSize',
  'setMinimumSize',
  'getMinimumSize',
  'setMaximumSize',
  'getMaximumSize',
  'setResizable',
  'isResizable',
  'setMovable',
  'isMovable',
  'setMinimizable',
  'isMinimizable',
  'setMaximizable',
  'isMaximizable',
  'setClosable',
  'isClosable',
  'setAlwaysOnTop',
  'isAlwaysOnTop',
  'moveTop',
  'center',
  'setPosition',
  'getPosition',
  'setProgressBar',
  'setOpacity',
  'getOpacity',
  'setFocusable',
  'isFocusable'
];

const main = `
const {ipcMain, BrowserWindow} = require('electron');

const ALLOWED_METHODS = ${JSON.stringify(exposeBrowserWindowMethods)};

ipcMain.handle('superpowers/BrowserWindow', (event, name, ...args) => {
  if (!ALLOWED_METHODS.includes(name)) {
    throw new Error('Unsupported BrowserWindow method: ' + name);
  }
  return BrowserWindow.fromWebContents(event.sender)[name](...args);
});
`.trimStart();

const preload = `
const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('PackagerSuperpowers', {
  BrowserWindow: (name, ...args) => ipcRenderer.invoke('superpowers/BrowserWindow', name, ...args)
});
`.trimStart();

export default {
  main,
  preload
};
