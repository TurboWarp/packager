# TurboWarp Packager

https://packager.turbowarp.org/

Converts Scratch projects to standalone files or executable programs. Built using TurboWarp, webpack, and Svelte.

## Development

Install dependencies:

```
npm ci
```

Start in development mode:

```
npm start
```

Then visit http://localhost:8947. Must manually refresh to apply.

The general layout of `src` is:

 - build: some questionable webpack customizations
 - packager: The packager website and logic
 - locales: translations
 - scaffolding: A minimal Scratch project player that abstracts most implementation details of Scratch
 - addons: currently only the optional "gamepad support" addon in packaged projects

You should not distribute packaged projects generated while in development mode. Instead, you should run a production build to significantly reduce file size of both the website and the packager:

```
NODE_ENV=production npm run build
```

Output is static HTML files in the `dist` folder.

## Tips for forks

This section may be useful for people who intend to fork this project.

The packager can be deployed as a simple static website. We use GitHub Actions to deploy to GitHub Pages by running the "Deploy" workflow whenever we want to push to production (Actions > Deploy > Run workflow). This should be automatically available in forks after enabling GitHub Actions.

Some assorted tips:

 - src/packager/brand.js controls some strings you will likely want to change
 - Large files such as NW.js or Electron executables are stored on an external server outside of this repository and have no guarantee of existing long-term
 - Update the privacy policy to match your practices.
 - If you want to change the VM/renderer/etc. used, just link/install a different scratch-vm/scratch-render/etc. and restart the build. It will just work.
 - Be aware of the license of this project (LGPLv3, see below)
 - Set environment variable ENABLE_SERVICE_WORKER=1 to enable service worker (for offline support, beta)

## License

Copyright (C) 2021 Thomas Weber

This project is licensed under the GNU Lesser General Public License version 3. See COPYING and COPYING.LESSER for more information. We believe that packaging a project using the packager "makes use of an interface provided by the Library, but which is not otherwise based on the Library"
