# TurboWarp Packager

https://packager.turbowarp.org/

A packager for Scratch projects. Built using TurboWarp, webpack, and Svelte. Version 4.

## Development

To run in development mode:

```
npm ci
npm start
```

Then visit http://localhost:8080. Must manually refresh to apply.

Sometimes for development it can be nice to store the large NW.js downloads locally, so that you don't have to constantly download them. On unix-like systems:

```
node download-large-assets-locally.js
LARGE_ASSET_BASE=./ npm start
```

The general layout of `src` is:

 - build: some questionable webpack customizations
 - packager: The packager website and logic
 - locales: translations
 - scaffolding: A minimal Scratch project player that abstracts most implementation details of Scratch
 - addons: currently only the optional "gamepad support" addon in packaged projects

## License

Copyright (C) 2021 Thomas Weber

This project is licensed under the GNU Lesser General Public License version 3. See COPYING and COPYING.LESSER for more information. We believe that packaging a project using the packager "makes use of an interface provided by the Library, but which is not otherwise based on the Library"

If you manually modify this software or its output, then you may have to publish that source code under the terms of the LGPLv3, but you probably don't have to make the project that you packaged free to all.
