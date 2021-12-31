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
  /**
   * @param {string[]|string} cloudHost URLs of servers to connect to, including ws:// or wss://
   * If cloudHost is an array, the server will consecutively try each server until one connects.
   * @param {string} projectId The ID of the project
   */
  constructor(cloudHost, projectId) {
    this.cloudHosts = Array.isArray(cloudHost) ? cloudHost : [cloudHost];
    this.projectId = projectId;
    this.attemptedConnections = 0;
    this.messageQueue = [];
    this.throttleTimeout = null;
    this.openConnection = this.openConnection.bind(this);
    this._throttleTimeoutFinished = this._throttleTimeoutFinished.bind(this);
  }

  enable () {
    this.openConnection();
  }

  openConnection () {
    this.currentCloudHost = this.cloudHosts[this.attemptedConnections % this.cloudHosts.length];
    this.attemptedConnections++;
    console.log(`Connecting to ${this.currentCloudHost}`);
    this.ws = new WebSocket(this.currentCloudHost);
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
    this.attemptedConnections = 0;
    this.writeToServer({
      method: 'handshake'
    });
    console.log('WebSocket connected');
  }

  onclose (e) {
    // https://github.com/TurboWarp/cloud-server/blob/master/doc/protocol.md#status-codes
    if (e && e.code === 4002) {
      console.log('Username is invalid; not reconnecting.');
      return;
    }
    if (e && e.code === 4004) {
      console.log('Project is blocked; not reconnecting.');
      return;
    }
    const timeout = Math.random() * (Math.pow(2, Math.min(this.attemptedConnections + 1, 5)) - 1) * 1000;
    console.log(`Connection lost; reconnecting in ${Math.round(timeout)}ms`);
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
    // If this variable already has a scheduled update, we'll replace its value instead of scheduling another update.
    for (const i of this.messageQueue) {
      if (i.name === name) {
        i.value = value;
        return;
      }
    }
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
    this.handleStorageEvent = this.handleStorageEvent.bind(this);
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

  handleStorageEvent (e) {
    if (e.key === this.key && e.storageArea === localStorage) {
      this.readFromLocalStorage();
    }
  }

  enable () {
    this.readFromLocalStorage();
    window.addEventListener('storage', this.handleStorageEvent);
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
