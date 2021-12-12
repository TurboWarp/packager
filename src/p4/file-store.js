import {writable} from 'svelte/store';
import Database from '../common/idb';
import {readAsArrayBuffer} from '../common/readers';

const DATABASE_NAME = 'p4-local-settings';
const DATABASE_VERSION = 1;
const STORE_NAME = 'blobs';

const db = new Database(DATABASE_NAME, DATABASE_VERSION, STORE_NAME);

const makeNamedBlob = (buffer, type, name) => {
  const blob = new Blob([buffer], {type});
  blob.name = name;
  return blob;
};

const cloneBlob = async (blob) => {
  const buffer = await readAsArrayBuffer(blob);
  return makeNamedBlob(buffer, blob.type, blob.name);
};

const get = async (key) => {
  const {transaction, store} = await db.createTransaction('readonly');
  return new Promise((resolve, reject) => {
    Database.setTransactionErrorHandler(transaction, reject);
    const request = store.get(key);
    request.onsuccess = (e) => {
      const result = e.target.result;
      if (result) {
        const data = result.data;
        // Older versions stored these files as instances of File
        if (data instanceof Blob) {
          // Clone immediately to fix spurious "NotFoundError: Node was not found" in Firefox
          resolve(cloneBlob(data));
        } else {
          resolve(makeNamedBlob(data, result.type, result.name));
        }
      } else {
        resolve(null);
      }
    };
  });
};

const set = async (key, file) => {
  const arrayBuffer = file ? await readAsArrayBuffer(file) : null;
  const {transaction, store} = await db.createTransaction('readwrite');
  return new Promise((resolve, reject) => {
    Database.setTransactionErrorHandler(transaction, reject);
    const request = file ? store.put({
      id: key,
      data: arrayBuffer,
      type: file.type,
      name: file.name
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
