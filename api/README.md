# Node.js API for Packager

## Installing

```bash
Not ready yet
```

## Release cadence

The plan is to release an updated version of the npm module after every release of the standalone version of the packager. Effectively that means there won't be more than a couple releases per month.

## Stability

There are no promises of stability of any sort. You should assume that every update is a semver-major change. Make sure to pin your releases and don't blindly bump versions without testing. We don't go out of our way to break the Node.js API, but we also don't let it stop us from making changes.

## Feature support

*Most* features of the packager work. Not everything does, and not everything works as well as it does on the website. Do understand that Node.js support is not particularly high priority for us.

## Browser support

The Node.js module does not work in a browser regardless of webpack and whatever other tool you try. If you need browser support, fork the packager (this repository) directly.

## Using the API

See demo.js for a full example.

First, you can import the module like this:

```js
const Packager = require('@turbowarp/packager');
```

Next you have to get a project file from somewhere. It can be a project.json or a full sb, sb2, or sb3 file. You will have to do this on your own as the packager does not have any way to help you. The easiest way to get a project is probably to fetch one from `https://projects.scratch.mit.edu/1`.

Then, convert your project data to an ArrayBuffer. Typed array views such as Uint8Array or node's Buffer might also work but we don't test those.

```js
const fetch = require('cross-fetch').default; // or whatever your favorite HTTP library is
const projectData = await (await fetch('https://projects.scratch.mit.edu/1')).arrayBuffer();
```

Now you have to tell the packager to process the project. The packager will parse it, do some analysis, and download any needed assets (if the input was just a project.json). This must be done once for each project. The result of this processes can be reused as many times as you want.

You may specify a "progress callback" that the downloader may call periodically with progress updates. `type` will be a string like `assets` or `compress`. Depending on the type, `a` might be "loaded" and `b` might be "total", or `a` might be a percent [0-1] and b is unused.

```js
const progressCallback = (type, a, b) => {};
const loadedProject = await Packager.downloadProject(projectData, progressCallback);
```

Now you can make a Packager.

```js
const packager = new Packager.Packager();
packager.project = loadedProject;
```

`packager.options` has a lot of options on it for you to consider. You can log the object or see [packager.js](../src/packager/packager.js) and look for "DEFAULT_OPTIONS" to see what options are available.

Note that Packager is a single-use object; trying to re-use it will not work. You must make a new Packager each time you want to package a project.

Now, you're finally ready to actually package the project.

```js
const result = await packager.package();
// Suggested filename. This is not sanitized so it could contain eg. path traversal exploits. Be careful.
const filename = result.filename;
// Mime type. "text/html" or "application/zip"
const type = result.type;
// The packaged project. Could be a string or ArrayBuffer depending on type.
const data = result.data;
```

After starting the packager, it is possible to cancel. Whether or not this actually cancels any ongoing work is not guaranteed, but it will guarantee that package() eventually rejects.

```js
packager.abort();
```

You can also add progress listeners on the packager using something similar to the addEventListener you're certainly familiar with. Note that these aren't actually EventTargets, just a tiny shim that looks similar, so some things like `once` won't work.

```js
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
