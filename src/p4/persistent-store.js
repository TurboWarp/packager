import {writable} from 'svelte/store';
import merge from '../packager/lib/merge';
import serialize from '../packager/lib/serialize';

const writablePersistentStore = (key, defaultValue) => {
  let value = JSON.parse(JSON.stringify(defaultValue));
  const localValue = JSON.parse(localStorage.getItem(key));
  if (localValue) {
    value = merge(localValue, value);
  }
  const store = writable(value, () => {
    const unsubscribe = store.subscribe(value => {
      const serialized = serialize(value, defaultValue);
      if (serialized === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(serialized));
      }
    });
    return unsubscribe;
  });
  return store;
};

export default writablePersistentStore;
