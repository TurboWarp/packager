class CloudManager {
  constructor (parent) {
    this.parent = parent;
    this.providers = [];
    this.overrides = new Map();
  }

  hasCloudData () {
    return this.parent.vm.runtime.hasCloudData();
  }

  projectReady () {
    if (this.hasCloudData()) {
      for (const provider of this.providers) {
        provider.enable();
      }
    }
  }

  setVariable (provider, name, value) {
    if (this.overrides.has(name) && this.overrides.get(name) !== provider) {
      return;
    }
    this.parent.vm.postIOData('cloud', {
      varUpdate: {
        name,
        value
      }
    });
  }

  getUsername () {
    return this.parent._username;
  }

  addProvider (provider) {
    provider.manager = this;
    if (this.hasCloudData()) {
      provider.enable();
    }
    this.providers.push(provider);
  }

  requestCloseConnection () {
    // no-op
  }

  createVariable (name, value) {
    // no-op
  }

  renameVariable (oldName, newName) {
    // no-op
  }

  deleteVariable (name) {
    // no-op
  }

  addProviderOverride (name, provider) {
    if (provider && !this.providers.includes(provider)) {
      throw new Error('Manager is not aware of this provider');
    }
    this.overrides.set(name, provider);
  }

  updateVariable (name, value) {
    if (this.overrides.has(name)) {
      const provider = this.overrides.get(name);
      if (provider) {
        provider.handleUpdateVariable(name, value);
      }
      return;
    }
    for (const provider of this.providers) {
      provider.handleUpdateVariable(name, value);
    }
  }
}

class WebSocketProvider {
  constructor(cloudHost, projectId) {
    this.cloudHost = cloudHost;
    this.projectId = projectId;
    this.connectionAttempts = 0;
    this.openConnection = this.openConnection.bind(this);
    this._throttleTimeoutFinished = this._throttleTimeoutFinished.bind(this);
    this.messageQueue = [];
    this.throttleTimeout = null;
  }

  enable () {
    this.openConnection();
  }

  openConnection () {
    this.connectionAttempts += 1;
    this.ws = new WebSocket(this.cloudHost);
    this.ws.onerror = this.onerror.bind(this);
    this.ws.onmessage = this.onmessage.bind(this);
    this.ws.onopen = this.onopen.bind(this);
    this.ws.onclose = this.onclose.bind(this);
  }

  onerror (event) {
    console.error('WebSocket error', event);
  }

  onmessage (event) {
    for (const line of event.data.split('\n')) {
      if (line) {
        const parsed = JSON.parse(line);
        if (parsed.method === 'set') {
          this.manager.setVariable(this, parsed.name, parsed.value);
        }
      }
    }
  }

  onopen () {
    this.connectionAttempts = 1;
    this.writeToServer({
      method: 'handshake'
    });
    console.log('WebSocket connected');
  }

  onclose (e) {
    console.log('WebSocket closed');
    if (e && e.code === 4002) {
      console.log('WebSocket username is invalid, not reconnecting.');
      return;
    }
    const timeout = Math.random() * (Math.pow(2, Math.min(this.connectionAttempts, 5)) - 1) * 1000;
    console.log(`Reconnecting in ${(timeout / 1000).toFixed(1)}s, attempt ${this.connectionAttempts}`);
    setTimeout(this.openConnection, timeout);
  }

  canWriteToServer () {
    return this.ws && this.ws.readyState === WebSocket.OPEN && this.throttleTimeout === null;
  }

  _scheduleThrottledSend () {
    if (this.throttleTimeout === null) {
      this.throttleTimeout = setTimeout(this._throttleTimeoutFinished, 1000 / 30);
    }
  }

  _throttleTimeoutFinished () {
    this.throttleTimeout = null;
    if (this.messageQueue.length === 0) {
      return;
    }
    if (this.canWriteToServer()) {
      this.writeToServer(this.messageQueue.shift());
    }
    this._scheduleThrottledSend();
  }

  throttledWriteToServer (message) {
    if (this.canWriteToServer()) {
      this.writeToServer(message);
    } else {
      this.messageQueue.push(message);
    }
    this._scheduleThrottledSend();
  }

  writeToServer (message) {
    message.project_id = this.projectId;
    message.user = this.manager.getUsername();
    this.ws.send(JSON.stringify(message));
  }

  handleUpdateVariable (name, value) {
    this.throttledWriteToServer({
      method: 'set',
      name,
      value
    });
  }
}

class LocalStorageProvider {
  constructor (key='p4:cloudvariables') {
    this.key = key;
    this.variables = {};
  }

  readFromLocalStorage () {
    let parsed;
    try {
      parsed = JSON.parse(localStorage.getItem(this.key));
      if (!parsed || typeof parsed !== 'object') {
        return;
      }
    } catch (e) {
      return;
    }
    this.variables = parsed;
    for (const key of Object.keys(this.variables)) {
      this.manager.setVariable(this, key, this.variables[key]);
    }
  }

  storeToLocalStorage () {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.variables))
    } catch (e) {
      // ignore
    }
  }

  enable () {
    this.readFromLocalStorage();
  }

  handleUpdateVariable (name, value) {
    this.variables[name] = value;
    this.storeToLocalStorage();
  }
}

export default {
  CloudManager,
  WebSocketProvider,
  LocalStorageProvider
};
