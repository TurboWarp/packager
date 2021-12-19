# Node.js API

## Installing

```bash
npm install --save-exact @turbowarp/packager
```

We suggest that you use `--save-exact` (or, with yarn, `--exact`) to make sure you always install the same version. This is important because we don't promise API stability.

## About the API

### Stability

The Node.js API is still in beta. Expect to find bugs.

There are no promises of API stability between updates. Always pin to an exact version and don't update without testing. We don't go out of our way to break the Node.js API, but we don't let it stop us from making changes. We will try to mention noteworthy changes in the [GitHub releases](https://github.com/TurboWarp/packager/releases) changelog.

### Release cadence

The plan is to release an updated version of the npm module with every release of the standalone version of the packager, which currently happens about once a month.

### Feature support

The following are currently known to not work:

 - App icon (environments such as Electron currently always use default)
 - Custom cursor
 - Loading screen image

### Browser support

The Node.js module is not intended to work in a browser regardless of any tool you try to use such as webpack. If you need browser support, fork the packager (this repository) directly.

### Large assets

Large assets such as Electron binaries are not stored in this repository and will be downloaded from a remote server as-needed. While we aren't actively removing old files, we can't promise they will exist forever. Downloads are cached locally and validated with a secure checksum.

Large assets are cached in `node_modules/@turbowarp/packager/.packager-cache`. You may want to periodically clean this folder.

## Using the API

See demo.js or demo-simple.js for a full example.

First, you can import the module like this:

```js
const Packager = require('@turbowarp/packager');
```

### Load a project

Next you have to get a project file from somewhere. It can be a project.json or a full sb, sb2, or sb3 file. The packager doesn't provide any API for this, you have to find it on your own. The easiest way to get a project is probably to fetch one from https://projects.scratch.mit.edu/1.

Then, convert your project data to an ArrayBuffer, Uint8Array, or Node.js Buffer.

```js
const fetch = require('cross-fetch').default; // or whatever your favorite HTTP library is
const projectData = await (await fetch('https://projects.scratch.mit.edu/1')).arrayBuffer();

// or:

const fs = require('fs');
const projectData = fs.readFileSync('project.sb3');
```

Now you have to tell the packager to load the project. The packager will parse it, do some analysis, and download any needed assets if the input was just a project.json. This must be done once for every project. The result of this processes can be reused as many times as you want.

You may specify a "progress callback" that the loader may call periodically with progress updates. `type` will be a string like `assets` or `compress`. Depending on the type, `a` might be "loaded" and `b` might be "total", or `a` might be a percent [0-1] in which case `b` is unused.

```js
const progressCallback = (type, a, b) => {};
const loadedProject = await Packager.loadProject(projectData, progressCallback);
```

### Package the project

Now you can make a Packager.

```js
const packager = new Packager.Packager();
packager.project = loadedProject;
```

`packager.options` has a lot of options on it for you to consider. You can log the object or see [packager.js](../src/packager/packager.js) and look for `DEFAULT_OPTIONS` to see what options are available.

We recommend that you avoid overwriting the entirety of `packager.options` as this may cause issues when you try to update the packager as options change. Instead, just update what you need to.

```js
packager.options.turbo = true;
```

Note that a Packager is a single-use object; you must make a new Packager each time you want to package a project.

Now you can finally actually package the project.

```js
const result = await packager.package();
// Suggested filename. This is not sanitized so it could contain eg. path traversal exploits. Be careful.
const filename = result.filename;
// Mime type. "text/html" or "application/zip"
const type = result.type;
// The packaged project. Could be a string or ArrayBuffer depending on type.
const data = result.data;
```

You can also add progress listeners on the packager using something similar to the addEventListener you're familiar with. Note that these aren't actually EventTargets, just a tiny shim that looks similar, so some things like `once` won't work and the events don't have very many properties on them.

```js
// do this before calling package()
packager.addEventListener('zip-progress', ({detail}) => {
  // Used when compressing projects as zips
  console.log('Packager progress zip-progress', detail);
});
packager.addEventListener('large-asset-fetch', ({detail}) => {
  // Used when fetching large assets such as Electron binaries
  console.log('Packager progress large-asset-fetch', detail);
});
```

What you do with `data` is now entirely up to you.

Be mindful of the copyright on the projects you package and on the packager itself (see [README.md](../README.md) for more information).
