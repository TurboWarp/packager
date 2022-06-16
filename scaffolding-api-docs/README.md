# Scaffolding API

Scaffolding is the project player used by the packager.

Here's what Scaffolding does for you:

 - Loads the entire Scratch VM and connects everything together
 - Implements prompts
 - Implements highly optimized variable and list monitors with context menus
 - Implements cloud variables using a WebSocket server or local storage
 - Implements video sensing

Here's what Scaffolding doesn't do for you:

 - Green flag screen. You must implement your own start page.
 - Controls. It gives you an API to add controls, but it doesn't implement the buttons for you. You don't need to use the control API if you don't want to.
 - A progress bar. It gives you an API for monitoring progress, but it doesn't implement the bar for you.
 - Fetch projects or assets. You have to tell Scaffolding where and how to fetch your project and any assets it contains.

## Versions

There are two versions of Scaffolding:

 - scaffolding-full (4.6MB) - contains every part of Scratch
 - scaffolding-min (2.5MB) - contains all of Scratch EXCEPT sound files used by the music extension. Significantly smaller than scaffolding-full.

Scratch is a large application so either script is very large. If you don't need the music extension to function, use scaffolding-min.

## Supported environments

Scaffolding strives to support any web browser released in 2018 or later.

Scaffolding only runs in web browsers. It will not run in Node.js.

## Installing

Scaffolding is distributed as one big JavaScript file. Any supplemental CSS etc. is stored inside the JS file.

We make no promise of having a stable API between even minor releases as Scaffolding is effectively just an implementation detail of the packager, which is why it's very important to lock your application to specific versions.

You can only load one version of Scaffolding on a page, but you can create as many Scaffolding project players as you'd like.

### From a CDN

```html
<!-- for scaffolding-min: -->
<script src="https://cdn.jsdelivr.net/npm/@turbowarp/packager@0.0.0/dist/scaffolding/scaffolding-min.js"></script>

<!-- for scaffolding-full -->
<script src="https://cdn.jsdelivr.net/npm/@turbowarp/packager@0.0.0/dist/scaffolding/scaffolding-full.js"></script>
```

Replace `0.0.0` with the latest release from https://github.com/TurboWarp/packager/releases, for example `1.0.0`.

DO NOT use versions like `@1` or `@latest` -- your website will break if Scaffolding's API changes!

If you don't want to use a CDN, you can download the JS file linked by the script tag to a server you control and simply load that script instead.

### From npm

```bash
npm install --save-exact @turbowarp/packager
```

```js
// for scaffolding-min:
require('@turbowarp/packager/dist/scaffolding/scaffolding-min.js');
// for scaffolding-full:
require('@turbowarp/packager/dist/scaffolding/scaffolding-full.js');

// or, if you prefer ES6 imports,
// for scaffolding-min:
import '@turbowarp/packager/dist/scaffolding/scaffolding-min.js';
// for scaffolding-full:
import '@turbowarp/packager/dist/scaffolding/scaffolding-full.js';
```

## Usage

TODO
