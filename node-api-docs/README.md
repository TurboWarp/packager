# Node.js API

## Installing

```bash
npm install --save-exact @turbowarp/packager
```

We suggest that you use `--save-exact` (or, with yarn, `--exact`) to make sure you always install the same version. This is important because we don't promise API compatibility across even minor updates.

## About the API

### Stability

The Node.js API is still in beta.

There are no promises of API stability between updates even across minor updates. Always pin to an exact version and don't update without testing. We don't go out of our way to break the API, but we don't let it stop us from making changes. We try to mention noteworthy changes in the [GitHub releases](https://github.com/TurboWarp/packager/releases) changelog.

### Release cadence

We intend to release an updated version of the npm module to npm with every update of [TurboWarp Desktop](https://github.com/TurboWarp/desktop), which currently happens about once a month.

### Feature support

All features should work, with the following exceptions:

 - macOS apps in the NW.js or WKWebView environments do not support custom icons and must always use the default icon

### Browser support

The Node.js module as published on npm is not intended to work in a browser regardless of any build tool such as webpack. If you need to run in a browser, fork this repository directly and modify the interface as you see fit.

### Large assets

Large assets such as Electron binaries are not stored in this repository and will be downloaded from a remote server on demand. While we aren't actively removing old files, we can't promise they will exist forever. Downloads are validated with a SHA-256 checksum and cached locally.

Large assets are cached in `node_modules/@turbowarp/packager/.packager-cache`. You may want to periodically clean this folder.

## Using the API

See demo.js or demo-simple.js for a full example.

First, you can import the module like this:

```js
const Packager = require('@turbowarp/packager');
```

### Load a project

Next you have to get a project file from somewhere. It can be a project.json or a full sb, sb2, or sb3 file. The packager doesn't provide any API for this, you have to find it on your own. Your data must be an ArrayBuffer, Uint8Array, or Node.js Buffer.

```js
// Fetch a remote URL:
const fetch = require('cross-fetch').default; // or whatever your favorite HTTP library is
const projectData = await (await fetch('https://packager.turbowarp.org/example.sb3')).arrayBuffer();

// or use a local file:
const fs = require('fs');
const projectData = fs.readFileSync('project.sb3');

// or fetch a shared Scratch project:
const fetch = require('cross-fetch').default; // or whatever your favorite HTTP library is
const id = '437419376';
const projectMetadata = await (await fetch(`https://trampoline.turbowarp.org/api/projects/${id}`)).json();
const token = projectMetadata.project_token;
const projectData = await (await fetch(`https://projects.scratch.mit.edu/${id}?token=${token}`)).arrayBuffer();
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

We recommend that you avoid overwriting the entirety of `packager.options` as this will cause issues when the structure of the options object changes in future updates. Instead, just update the properties you want to change from the defaults.

```js
// GOOD:
packager.options.turbo = true;
packager.options.custom.js = "/* */";

// BAD (DO NOT DO THIS):
packager.options = {
  turbo: true,
  custom: {
    js: "/* */"
  },
  // ...
};
```

Even if you add `...packager.options` the second example is still broken: `options.custom` also has a `css` property which is accidentally being set to `undefined` which is undefined behavior. Instead of remembering to do `...packager.options.xyz` everywhere, it's best to just avoid completely redefining options whenever possible.

Some options expect an image as an argument. In the Node.js module, there is a special class to use for these, `new Packager.Image(mimeType, buffer)`:

```js
packager.options.app.icon = new Packager.Image('image/png', fs.readFileSync('icon.png'));
```

Note that a Packager is a single-use object; you must make a new Packager each time you want to package a project.

Now you can finally actually package the project.

```js
const result = await packager.package();

// Suggested file name including file extension based on packager's options.
// This is not sanitized so it could contain things like path traversal exploits. Be careful.
const filename = result.filename;

// MIME type of the packaged project. Either "text/html" or "application/zip"
const type = result.type;

// The packaged project's data. Will be either a string (for type text/html) or ArrayBuffer (for type application/zip).
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

Be mindful of the copyright on the projects you package.
