import {writable} from 'svelte/store';
import merge from './lib/merge';

const serialize = (value) => {
  // Don't try to serialize files or blobs
  if (value instanceof Blob) {
    return null;
  }
  if (typeof value === 'object' && value !== null) {
    value = Object.assign({}, value);
    for (const key of Object.keys(value)) {
      value[key] = serialize(value[key]);
    }
  }
  return value;
};

const writablePersistentStore = (key, defaultValue) => {
  let value = defaultValue;
  const localValue = JSON.parse(localStorage.getItem(key));
  if (localValue) {
    value = merge(localValue, defaultValue);
  }
  const store = writable(value, () => {
    const unsubscribe = store.subscribe(value => {
      localStorage.setItem(key, JSON.stringify(serialize(value)));
    });
    return unsubscribe;
  });
  return store;
};

export default writablePersistentStore;
