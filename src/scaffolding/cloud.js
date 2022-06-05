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
   * @param {string[]|string} cloudHost URLs of servers to connect to. Must start with ws: or wss:
   * If cloudHost is an array, the server will consecutively try each server until one connects.
   * @param {string} projectId The ID of the project
   */
  constructor(cloudHost, projectId) {
    this.cloudHosts = Array.isArray(cloudHost) ? cloudHost : [cloudHost];
    this.projectId = projectId;
    this.attemptedConnections = 0;
    this.bufferedMessages = [];
    this.scheduledBufferedSend = null;
    this.reconnectTimeout = null;
    this.openConnection = this.openConnection.bind(this);
    this._scheduledSendBufferedMessages = this._scheduledSendBufferedMessages.bind(this);
  }

  enable () {
    this.openConnection();
  }

  setProjectId (id) {
    this.projectId = id;
    this.closeAndReconnect();
  }

  openConnection () {
    this.currentCloudHost = this.cloudHosts[this.attemptedConnections % this.cloudHosts.length];
    this.attemptedConnections++;
    console.log(`Connecting to ${this.currentCloudHost} with ID ${this.projectId}, username ${this.manager.getUsername()}`);
    try {
      // Don't try to validate the cloud host ourselves. Let the browser do it.
      // Edge cases like ws://localhost being considered secure are too complex to handle correctly.
      this.ws = new WebSocket(this.currentCloudHost);
    } catch (e) {
      console.error(e);
      // The error message from the browser (especially Firefox) is sometimes very generic and not helpful.
      throw new Error(`Cloud host ${this.currentCloudHost} is invalid: ${e}`);
    }
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
    this.sendBufferedMessages();
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
    this.reconnectTimeout = setTimeout(this.openConnection, timeout);
  }

  closeAndReconnect () {
    console.log('Closing connection and reconnecting.');
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
    }
    clearTimeout(this.reconnectTimeout);
    // There should be a slight delay so that repeated project ID changes won't trigger too many connections.
    const delay = 1000 / 30;
    this.reconnectTimeout = setTimeout(this.openConnection, delay);
  }

  canWriteToServer () {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  scheduleBufferedSend () {
    if (!this.scheduledBufferedSend) {
      this.scheduledBufferedSend = true;
      Promise.resolve().then(this._scheduledSendBufferedMessages);
    }
  }

  _scheduledSendBufferedMessages () {
    this.scheduledBufferedSend = false;
    if (this.canWriteToServer()) {
      this.sendBufferedMessages();
    }
  }

  sendBufferedMessages () {
    for (const message of this.bufferedMessages) {
      this.writeToServer(message);
    }
    this.bufferedMessages.length = 0;
  }

  bufferedWriteToServer (message) {
    this.bufferedMessages.push(message);
    this.scheduleBufferedSend();
  }

  writeToServer (message) {
    message.project_id = this.projectId;
    message.user = this.manager.getUsername();
    this.ws.send(JSON.stringify(message));
  }

  handleUpdateVariable (name, value) {
    // If this variable already has an update queued, we'll replace its value instead of adding another update.
    for (const i of this.bufferedMessages) {
      if (i.name === name) {
        i.value = value;
        return;
      }
    }
    this.bufferedWriteToServer({
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
