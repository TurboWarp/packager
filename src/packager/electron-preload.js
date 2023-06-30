const {contextBridge} = require('electron')

contextBridge.exposeInMainWorld('ExampleAPI', {
  doSomething: () => {
    return 'Hello!';
  }
});
