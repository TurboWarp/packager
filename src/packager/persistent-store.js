import {writable} from 'svelte/store';

const writablePersistentStore = (key, value) => {
  const localValue = JSON.parse(localStorage.getItem(key));
  if (localValue) {
    // Copy missing properties
    if (typeof value === 'object') {
      for (const key of Object.keys(value)) {
        if (typeof localValue[key] === 'undefined') {
          localValue[key] = value[key];
        }
      }
    }
  }
  const store = writable(localValue || value);
  store.subscribe((value) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
  return store;
};

export default writablePersistentStore;
