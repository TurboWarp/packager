export const queueMicrotask = window.queueMicrotask || ((callback) => Promise.resolve().then(callback));
