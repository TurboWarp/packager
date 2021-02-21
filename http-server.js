'use strict';

const http = require('http');
const promisify = require('util').promisify;
const fs = require('fs');
const pathUtil = require('path');

const lstat = promisify(fs.lstat);
const readFile = promisify(fs.readFile);

// checking for path traversal requires trailing slash
const webRoot = pathUtil.join(__dirname, '/');

function startServer() {
  const port = process.env.PORT || 8080;
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.svg': 'image/svg+xml',
    '.ico': 'image/vnd.microsoft.icon',
    '.wav': 'audio/wav',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.md': 'text/plain',
  };
  const defaultContentType = 'application/octet-stream';

  class HttpError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
      this.message = message;
    }
  }

  class Http404 extends HttpError {
    constructor() {
      super(404, '404 Not Found');
    }
  }

  async function findFile(root, path) {
    const indexes = ['index.html', 'README.md'];
    const extensions = ['', '.html', '.md'];

    // prevent null bytes
    if (path.indexOf('\0') !== -1) {
      return null;
    }

    // remove escape codes
    path = unescape(path);

    // remove query string
    if (path.indexOf('?') !== -1) {
      path = path.substr(0, path.indexOf('?'));
    }

    path = pathUtil.join(root, path);

    // check for path traversal
    if (!path.startsWith(root)) {
      return null;
    }

    const originalPath = path;

    try {
      if ((await lstat(path)).isDirectory()) {
        let found = false;
        for (const i of indexes) {
          try {
            path = pathUtil.join(originalPath, i);
            if ((await lstat(path)).isFile()) {
              found = true;
              break;
            }
          } catch (e) {
            // ignore
          }
        }
        if (!found) return null;
      }
    } catch (e) {
      let found = false;
      for (const i of extensions) {
        try {
          path = originalPath + i;
          if ((await lstat(path)).isFile()) {
            found = true;
            break;
          }
        } catch (e) {
          // ignore
        }
      }
      if (!found) return null;
    }

    return path;
  }

  async function handler(req, res) {
    const path = await findFile(webRoot, req.url || '/');
    if (path === null) throw new Http404();

    const data = await readFile(path);
    const extension = pathUtil.extname(path);
    res.setHeader('Content-Length', data.length);
    res.setHeader('Content-Type', contentTypes[extension] || defaultContentType);
    res.setHeader('Cache-Control', 'no-store');
    res.write(data);
  };

  const server = http.createServer(async (req, res) => {
    try {
      await handler(req, res);
    } catch (e) {
      if (e.code) {
        res.statusCode = e.code;
        res.write(e.message);
      } else {
        res.statusCode = 500;
        res.write('internal server error');
        console.error(e.stack || e);
      }
    }
    res.end();
  });
  server.listen(port);
  
  portConnectionInfo(port);
}

function portConnectionInfo(port) {
  console.log('Visit any of these links in your browser:');
  console.log(`    http://localhost:${port}/`);
  console.log(`    http://127.0.0.1:${port}/`);
}

startServer();
