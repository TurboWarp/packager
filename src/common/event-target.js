// Browser support for EventTarget constructor is surprisingly poor, so we always polyfill it
// We also need to polyfill CustomEvent for Node.js

class EventTargetShim {
  constructor () {
    this._events = {};
  }

  addEventListener (event, handler) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(handler);
  }

  removeEventListener (event, handler) {
    const handlers = this._events[event];
    if (handlers) {
      this._events[event] = handlers.filter(i => i !== handler);
    }
  }

  dispatchEvent (event) {
    const handlers = this._events[event.type];
    if (handlers) {
      for (const fn of handlers) {
        fn(event);
      }
    }
  }
}

class CustomEventShim {
  constructor (type, options) {
    this.type = type;
    this.detail = options ? options.detail : {};
  }
}

export {
  EventTargetShim as EventTarget,
  CustomEventShim as CustomEvent
};
