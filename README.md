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

Then visit http://localhost:8947. Must manually refresh to apply updates.

The general layout of `src` is:

 - packager: The project packager
 - p4: The Svelte interface for the packager
 - scaffolding: A minimal Scratch project player used by the packager. Handles most of the boring details of playing Scratch projects such as handling basic mouse input
 - common: Files used by both scaffolding and the packager
 - addons: Optional addons such as gamepad support or pointerlock
 - build: Unusual webpack customizations
 - locales: Translations

Packaged projects generated while in development mode should not be distributed. Instead, you should run a production build by setting the NODE_ENV environment variable to production to significantly reduce file size of both the website and the packager:

```
NODE_ENV=production npm run build
```

Output is in the `dist` folder.

## Tips for forks

Some assorted tips for people who want to fork this project (it's really easy):

 - The packager is deployed as a simple static website. You can host it anywhere by just copying the `dist` folder. We use GitHub Actions to deploy to GitHub Pages by running the "Deploy" workflow whenever we want to push to production (Actions > Deploy > Run workflow). This should be automatically available in forks after enabling GitHub Actions.
 - If you want to change the VM/renderer/etc. used, just `npm install` or `npm link` a different scratch-vm/scratch-render/etc and rebuild. You can even install a vanilla scratch-vm and all core functionality will still work (but optional features such as interpolation, high quality pen, stage size, etc. may not work)
 - src/packager/brand.js controls names and links that appear in various places
 - static/privacy.html is the privacy policy
 - Large files such as NW.js or Electron executables are stored on an external server outside of this repository and have no guarantee of existing long-term. It's easy to setup your own, see src/packager/large-assets.js for more information.
 - Set the environment variable ENABLE_SERVICE_WORKER=1 to enable service worker for offline support
 - Be aware of the license of this project (see below)

## License

Copyright (C) 2021 Thomas Weber

This project is licensed under the GNU Lesser General Public License version 3. See COPYING and COPYING.LESSER for more information. We believe that packaging a project using the packager "makes use of an interface provided by the Library, but which is not otherwise based on the Library"
