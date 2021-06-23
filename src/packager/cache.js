import largeAssets from './large-assets';

// We can't trust the HTTP cache to reliably cache these large assets

const DATABASE_NAME = 'p4-large-assets';
const DATABASE_VERSION = 1;

const STORE_NAME = 'assets';

let _db;

const SCAFFOLDING_BUILD_ID = process.env.SCAFFOLDING_BUILD_ID;
const getAssetId = (asset) => {
  return `${asset.src}-${asset.type}-${asset.sha256 || SCAFFOLDING_BUILD_ID}`;
};

// https://github.com/jakearchibald/safari-14-idb-fix/blob/582bbdc7230891113bfb5743391550cbf29d21f2/src/index.ts
const idbReady = () => {
  const isSafari =
    !navigator.userAgentData &&
    /Safari\//.test(navigator.userAgent) &&
    !/Chrom(e|ium)\//.test(navigator.userAgent);

  // No point putting other browsers or older versions of Safari through this mess.
  if (!isSafari || !indexedDB.databases) return Promise.resolve();

  let intervalId;
  return new Promise((resolve) => {
    const tryIdb = () => indexedDB.databases().finally(resolve);
    intervalId = setInterval(tryIdb, 100);
    tryIdb();
  }).finally(() => clearInterval(intervalId));
};

const openDB = () => new Promise(async (resolve, reject) => {
  if (_db) {
    resolve(_db);
    return;
  }
  if (!window.indexedDB) {
    reject(new Error('indexedDB is not supported'));
    return;
  }
  await idbReady();
  const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onupgradeneeded = e => {
    const db = e.target.result;
    db.createObjectStore(STORE_NAME, {
      keyPath: 'id'
    });
  };
  request.onsuccess = (e) => {
    _db = e.target.result;
    removeExtraneous()
      .then(() => {
        resolve(_db);
      })
      .catch((err) => {
        reject(err);
      });
  };
  request.onerror = (e) => {
    reject(new Error(`IDB Error ${e.target.error}`));
  };
});

const createTransaction = async (readwrite, reject) => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, readwrite);
  transaction.onerror = () => {
    reject(new Error(`Transaction error: ${transaction.error}`));
  };
  const store = transaction.objectStore(STORE_NAME);
  return {
    db,
    transaction,
    store
  };
};

const removeExtraneous = () => new Promise(async (resolve, reject) => {
  const {store} = await createTransaction('readwrite', reject);
  const allValidAssetIds = Object.values(largeAssets).map(getAssetId);
  const request = store.openCursor();
  request.onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      const key = cursor.key;
      if (!allValidAssetIds.includes(key)) {
        cursor.delete();
      }
      cursor.continue();
    } else {
      resolve();
    }
  };
});

const get = (asset) => new Promise(async (resolve, reject) => {
  const {store} = await createTransaction('readonly', reject);
  const assetId = getAssetId(asset);
  const request = store.get(assetId);
  request.onsuccess = (e) => {
    const result = e.target.result;
    if (result) {
      resolve(result.data);
    } else {
      resolve(null);
    }
  };
});

const set = (asset, content) => new Promise(async (resolve, reject) => {
  const {store} = await createTransaction('readwrite', reject);
  const assetId = getAssetId(asset);
  const request = store.put({
    id: assetId,
    data: content
  });
  request.onsuccess = () => {
    resolve();
  };
});

const reset = async () => {
  if (!window.indexedDB) {
    return;
  }
  await idbReady();
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(new Error('Cannot delete databse'));
    };
  });
};

const getCacheBuster = () => SCAFFOLDING_BUILD_ID;

export default {
  get,
  set,
  reset,
  getCacheBuster
};
