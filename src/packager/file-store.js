import {writable} from 'svelte/store';
import Database from './lib/idb';

const DATABASE_NAME = 'p4-local-settings';
const DATABASE_VERSION = 1;
const STORE_NAME = 'blobs';

const db = new Database(DATABASE_NAME, DATABASE_VERSION, STORE_NAME);

const get = async (key) => {
  const {transaction, store} = await db.createTransaction('readonly');
  return new Promise((resolve, reject) => {
    Database.setTransactionErrorHandler(transaction, reject);
    const request = store.get(key);
    request.onsuccess = (e) => {
      const result = e.target.result;
      if (result) {
        resolve(result.data);
      } else {
        resolve(null);
      }
    };
  });
};

const set = async (key, value) => {
  const {transaction, store} = await db.createTransaction('readwrite');
  return new Promise((resolve, reject) => {
    Database.setTransactionErrorHandler(transaction, reject);
    const request = value ? store.put({
      id: key,
      data: value
    }) : store.delete(key);
    request.onsuccess = () => {
      resolve();
    };
  });
};

const resetAll = () => db.deleteEverything();

const writableFileStore = (key) => {
  let hasQueried = false;
  const store = writable(null, () => {
    const unsubscribe = store.subscribe((file) => {
      if (hasQueried) {
        set(key, file)
          .catch((err) => {
            console.warn(err);
          });
      }
    });
    return unsubscribe;
  });
  get(key)
    .then((value) => {
      hasQueried = true;
      if (value) {
        store.set(value);
      }
    });
  return store;
};

export default {
  writableFileStore,
  resetAll
};
