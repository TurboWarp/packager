import largeAssets from '../large-assets';
import {buildId} from '../build-id';
import Database from '../../common/idb';

const DATABASE_NAME = 'p4-large-assets';
const DATABASE_VERSION = 1;
const STORE_NAME = 'assets';

const db = new Database(DATABASE_NAME, DATABASE_VERSION, STORE_NAME);

const getAssetId = (asset) => {
  if (asset.sha256) {
    return asset.sha256;
  }
  return `${buildId}-${JSON.stringify(asset.src)}`;
};

const removeExtraneous = async () => {
  const {transaction, store} = await db.createTransaction('readwrite');
  return new Promise((resolve, reject) => {
    Database.setTransactionErrorHandler(transaction, reject);
    const keyRequest = store.getAllKeys();
    keyRequest.onsuccess = async e => {
      const keys = e.target.result;
      const allValidAssetIds = Object.values(largeAssets).map(getAssetId);
      const keysToDelete = keys.filter(i => !allValidAssetIds.includes(i));

      for (const key of keysToDelete) {
        await new Promise(resolveDelete => {
          const deleteRequest = store.delete(key);
          deleteRequest.onsuccess = () => {
            resolveDelete();
          };
        });
      }

      resolve();
    };
  });
};

const get = async (asset) => {
  const {transaction, store} = await db.createTransaction('readonly');
  return new Promise((resolve, reject) => {
    Database.setTransactionErrorHandler(transaction, reject);
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
};

const set = async (asset, content) => {
  const {transaction, store} = await db.createTransaction('readwrite');
  return new Promise((resolve, reject) => {
    Database.setTransactionErrorHandler(transaction, reject);
    const assetId = getAssetId(asset);
    const request = store.put({
      id: assetId,
      data: content
    });
    request.onsuccess = () => {
      resolve();
    };
  });
};

const resetAll = () => db.deleteEverything();

removeExtraneous();

export default {
  get,
  set,
  resetAll
};
