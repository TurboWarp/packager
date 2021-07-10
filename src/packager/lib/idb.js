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

class Database {
  constructor (name, version, storeName) {
    this.name = name;
    this.version = version;
    this.storeName = storeName;
    this.db = null;
  }

  async open () {
    if (this.db) {
      return this.db;
    }
    if (!window.indexedDB) {
      throw new Error('indexedDB is not supported');
    }
    await idbReady();
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        db.createObjectStore(this.storeName, {
          keyPath: 'id'
        });
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        this.onopen()
          .then(() => {
            resolve(this.db);
          })
          .catch((err) => {
            reject(err);
          });
      };
      request.onerror = (e) => {
        reject(new Error(`IDB Error ${e.target.error}`));
      };
    });
  }

  async createTransaction (readwrite) {
    const db = await this.open();
    const transaction = db.transaction(this.storeName, readwrite);
    const store = transaction.objectStore(this.storeName);
    return {
      db,
      transaction,
      store
    };
  }

  async deleteEverything () {
    const {transaction, store} = await this.createTransaction('readwrite');
    return new Promise((resolve, reject) => {
      Database.setTransactionErrorHandler(transaction, reject);
      const request = store.openCursor();
      request.onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  onopen () {
    return Promise.resolve();
  }
}

Database.setTransactionErrorHandler = (transaction, reject) => {
  transaction.onerror = () => {
    reject(new Error(`Transaction error: ${transaction.error}`))
  };
};

export default Database;
