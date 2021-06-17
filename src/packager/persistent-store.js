import {writable} from 'svelte/store';
import merge from './lib/merge';

const writablePersistentStore = (key, defaultValue) => {
  let value = defaultValue;
  const localValue = JSON.parse(localStorage.getItem(key));
  if (localValue) {
    value = merge(localValue, defaultValue);
  }
  const store = writable(value, () => {
    const unsubscribe = store.subscribe(value => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    return unsubscribe;
  });
  return store;
};

export default writablePersistentStore;
