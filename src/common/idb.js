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

const allDatabases = [];

class Database {
  constructor (name, version, storeName) {
    this.name = name;
    this.version = version;
    this.storeName = storeName;
    this.db = null;
    this.dbPromise = null;
    allDatabases.push(this);
  }

  open () {
    if (this.db) {
      return this.db;
    }
    if (this.dbPromise) {
      return this.dbPromise;
    }
    if (typeof indexedDB === 'undefined') {
      throw new Error('indexedDB is not supported');
    }

    this.dbPromise = idbReady()
      .then(() => new Promise((resolve, reject) => {
        const request = indexedDB.open(this.name, this.version);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          db.createObjectStore(this.storeName, {
            keyPath: 'id'
          });
        };
        request.onsuccess = (e) => {
          const db = e.target.result;
          resolve(db);
        };
        request.onerror = (e) => {
          reject(new Error(`IDB Error ${e.target.error}`));
        };
      }))
      .then((db) => {
        this.dbPromise = null;
        this.db = db;
        return db;
      })
      .catch((err) => {
        this.dbPromise = null;
        throw err;
      });

    return this.dbPromise;
  }

  close () {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    if (this.dbPromise) {
      this.dbPromise.then((db) => {
        db.close();
      });
      this.dbPromise = null;
    }
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
}

Database.setTransactionErrorHandler = (transaction, reject) => {
  transaction.onerror = () => {
    reject(new Error(`Transaction error: ${transaction.error}`))
  };
};

const closeAllDatabases = () => {
  for (const database of allDatabases) {
    database.close();
  }
};
// Closing databases makes us more likely to be put in the browser's back/forward cache
window.addEventListener('pagehide', closeAllDatabases);

export default Database;
