# TurboWarp Packager

https://packager.turbowarp.org/

Converts Scratch projects into HTML files, zip archives, or executable programs for Windows, macOS, and Linux.

## Development

Install dependencies:

```
npm ci
```

Start in development mode:

```
npm start
```

Then visit http://localhost:8947. Manually refresh to see changes.

Packaged projects generated while in development mode should not be distributed. Instead, you should run a production build to significantly reduce file size of both the website and the packager.

```
npm run build-prod
```

Output will be located in the `dist` folder.

The general layout of `src` is:

 - packager: The code that downloads and packages projects.
 - p4: The Svelte website for the packager. "p4" is the name that the packager uses internally to refer to itself.
 - scaffolding: A minimal Scratch project player. Handles most of the boring details of running Scratch projects like handling mouse inputs.
 - common: Some files used by both scaffolding and the packager.
 - addons: Optional addons such as gamepad support or pointerlock.
 - locales: Translations. en.json contains the original English messages. The other languages are translated by volunteers and imported by an automated script. ([you can help](https://docs.turbowarp.org/translate))
 - build: Various build-time scripts such as webpack plugins and loaders.

## Tips for forks

We strive to make the packager easy to fork, even for mods that aren't based on TurboWarp. Reading this section, at least the first half, should make it much easier to do so.

### Packages

If you want to change the scratch-vm/scratch-render/scratch-audio/scratch-storage/etc. used, this is simple:

 - `npm install` or `npm link` your package. The package name does not matter.
 - Update src/scaffolding/scratch-libraries.js to import the packages with the name you have. (some of our packages are prefixed with `@turbowarp/` while others are still just `scratch-vm` -- just make sure they match yours)

Then just rebuild. You can even install a vanilla scratch-vm and all core functionality will still work (but optional features such as interpolation, high quality pen, stage size, etc. may not work)

Note that npm is a very buggy piece of software and our dependency tree is very large. Occasionally you might get errors about missing dependencies, which should go away if you run `npm install`.

### Deployment

The packager is deployed as a simple static website. You can host it anywhere by just copying the `dist` folder after a build.

We use GitHub Actions and GitHub Pages to manage our deployment. If you want to do this too:

 - Fork the repository on GitHub and push your changes.
 - Go to your fork's settings on GitHub and enable GitHub Pages with the source set to GitHub Actions.
 - Go to the "Actions" tab and enable GitHub Actions if it isn't already enabled.
 - Go to your fork > Actions > Deploy > Manually run the action on the branch of your choice (probably master).
 - In a few minutes, your site will automatically be built and deployed to GitHub Pages.

### Branding

We ask that you at least take a moment to rename the website by editting `src/packager/brand.js` with your own app name, links, etc.

### Large files

Large files such as NW.js, Electron, and WKWebView executables are stored on an external server outside of this repository. While we aren't actively removing old files (the server still serves files unused since November 2020), we can't promise they will exist forever. The packager uses a secure checksum to validate these downloads. Forks are free to use our servers, but it's easy to setup your own if you'd prefer (it's just a static file server; see `src/packager/large-assets.js` for more information).

### Service worker

Set the environment variable `ENABLE_SERVICE_WORKER` to `1` to enable service worker for offline support (experimental, not 100% reliable). This is not recommended in development. Our GitHub Actions deploy script uses this by default.

## Standalone builds

The packager supports generating "standalone builds" that are single HTML files containing the entire packager. Large files such as Electron binaries will still be downloaded from a remote server as needed. You can download prebuilt standalone builds from [our GitHub releases](https://github.com/TurboWarp/packager/releases). These can be useful if our website is blocked or you don't have a reliable internet connection. Note that standalone builds do not contain an update checker, so do check on your own occasionally.

To make a production standalone build locally:

```
npm run build-standalone-prod
```

The build outputs to `dist/standalone.html`.

## Node.js module and API

See [node-api-docs/README.md](node-api-docs/README.md) for Node.js API documentation.

To build the Node.js module locally:

```
npm run build-node-prod
```

## License

<!-- Make sure to also update COPYRIGHT_NOTICE in src/packager/brand.js -->

Copyright (C) 2021-2024 Thomas Weber

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License version 3 as published by the Free Software Foundation. See [COPYING](COPYING) and [COPYING.LESSER](COPYING.LESSER) for details.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.

A possible interpretation of the GNU Lesser General Public License
version 3 is as follows. See relevant definitions in section 0 of the
LGPLv3. This is not legal advice.

 - A "packaged project file" is an Application generated by the Library.
   In general, a packaged project file forms a Combined Work in a manner
   similar to static linking.
 - The Corresponding Application Code of a packaged project file is the
   project file (usually an sb, sb2, or sb3 file). The project file may
   be compressed to save space. The project file cannot interact with
   the Library except through interfaces provided by the Library and is
   not otherwise based on the Library.
 - The Minimal Corresponding Source of a packaged project file is the
   support code from the Library used to run the packaged project. This
   code may be compressed to save space, but links to find source code
   are provided inside the packaged project file.
 - The Corresponding Application Code can be easily extracted from a
   packaged project file. https://turbowarp.github.io/unpackager/ is an
   example. The retrieved Corresponding Application Code can then be
   inserted back into the Library to create a modified Combined Work.
