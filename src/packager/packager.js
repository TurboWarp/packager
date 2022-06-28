import {EventTarget, CustomEvent} from '../common/event-target';
import sha256 from './sha256';
import escapeXML from '../common/escape-xml';
import largeAssets from './large-assets';
import request from '../common/request';
import pngToAppleICNS from './icns';
import {buildId, verifyBuildId} from './build-id';
import {encode, decode} from './base85';
import {parsePlist, generatePlist} from './plist';
import {APP_NAME, WEBSITE, COPYRIGHT_NOTICE, ACCENT_COLOR} from './brand';
import {OutdatedPackagerError} from '../common/errors';
import {Adapter} from './adapter';

const PROGRESS_LOADED_SCRIPTS = 0.1;

// Used by environments that fetch the entire compressed project before calling loadProject()
const PROGRESS_FETCHED_COMPRESSED = 0.75;
const PROGRESS_EXTRACTED_COMPRESSED = 0.98;

// Used by environments that pass a project.json into loadProject() and fetch assets separately
const PROGRESS_FETCHED_PROJECT_JSON = 0.2;
const PROGRESS_FETCHED_ASSETS = 0.98;

const removeUnnecessaryEmptyLines = (string) => string.split('\n')
  .filter((line, index, array) => {
    if (index === 0 || index === array.length - 1) return true;
    if (line.trim().length === 0 && array[index - 1].trim().length === 0) return false;
    return true;
  })
  .join('\n');

export const getJSZip = async () => (await import(/* webpackChunkName: "jszip" */ 'jszip')).default;

const setFileFast = (zip, path, data) => {
  zip.files[path] = data;
};

const interpolate = (a, b, t) => a + t * (b - a);

const SELF_LICENSE = {
  title: APP_NAME,
  homepage: WEBSITE,
  license: COPYRIGHT_NOTICE
};

const SCRATCH_LICENSE = {
  title: 'Scratch',
  homepage: 'https://scratch.mit.edu/',
  license: `Copyright (c) 2016, Massachusetts Institute of Technology
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`
};

const ELECTRON_LICENSE = {
  title: 'Electron',
  homepage: 'https://www.electronjs.org/',
  license: `Copyright (c) Electron contributors
Copyright (c) 2013-2020 GitHub Inc.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`
};

const COPYRIGHT_HEADER = `/*!
Parts of this script are from the ${APP_NAME} <${WEBSITE}>, licensed as follows:
${SELF_LICENSE.license}

Parts of this script are from Scratch <https://scratch.mit.edu/>, licensed as follows:
${SCRATCH_LICENSE.license}
*/\n`;

const generateChromiumLicenseHTML = (licenses) => {
  const style = `<style>body { font-family: sans-serif; }</style>`;
  const pretext = `<h2>The following entries were added by the ${APP_NAME}</h2>`;
  const convertedLicenses = licenses.map((({title, license, homepage}, index) => `
<div class="product">
<span class="title">${escapeXML(title)}</span>
<span class="homepage"><a href="${escapeXML(homepage)}">homepage</a></span>
<input type="checkbox" hidden id="p4-${index}">
<label class="show" for="p4-${index}" tabindex="0"></label>
<div class="licence">
<pre>${escapeXML(license)}</pre>
</div>
</div>
`));
  return `${style}${pretext}${convertedLicenses.join('\n')}`;
};

// Unique identifier for the app. If this changes, things like local cloud variables will be lost.
// This should be in reverse-DNS format.
// https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleidentifier
const CFBundleIdentifier = 'CFBundleIdentifier';
// Even if you fork the packager, you shouldn't change this string unless you want packaged macOS apps
// to lose all their data.
const bundleIdentifierPrefix = 'org.turbowarp.packager.userland.';

// CFBundleName is displayed in the menu bar.
// I'm not actually sure where CFBundleDisplayName is displayed.
// Documentation says that CFBundleName is only supposed to be 15 characters and that CFBundleDisplayName
// should be used for longer names, but in reality CFBundleName seems to not have a length limit.
// https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundlename
// https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundledisplayname
const CFBundleName = 'CFBundleName';
const CFBundleDisplayName = 'CFBundleDisplayName';

// The name of the executable in the .app/Contents/MacOS folder
// https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleexecutable
const CFBundleExecutable = 'CFBundleExecutable';

// macOS's "About" screen will display: "Version {CFBundleShortVersionString} ({CFBundleVersion})"
// Apple's own apps are inconsistent about what they display here. Some apps set both of these to the same thing
// so you see eg. "Version 15.0 (15.0)" while others set CFBundleShortVersionString to a semver-like and
// treat CFBundleVersion as a simple build number eg. "Version 1.4.0 (876)"
// Apple's documentation says both of these are supposed to be major.minor.patch, but in reality it doesn't
// even have to contain numbers and everything seems to work fine.
// https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleversion
// https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleshortversionstring
const CFBundleVersion = 'CFBundleVersion';
const CFBundleShortVersionString = 'CFBundleShortVersionString';

// Describes the category of the app
// https://developer.apple.com/documentation/bundleresources/information_property_list/lsapplicationcategorytype
const LSApplicationCategoryType = 'LSApplicationCategoryType';

class Packager extends EventTarget {
  constructor () {
    super();
    this.project = null;
    this.options = Packager.DEFAULT_OPTIONS();
    this.aborted = false;
    this.used = false;
  }

  abort () {
    if (!this.aborted) {
      this.aborted = true;
      this.dispatchEvent(new Event('abort'));
    }
  }

  ensureNotAborted () {
    if (this.aborted) {
      throw new Error('Aborted');
    }
  }

  async fetchLargeAsset (name, type) {
    this.ensureNotAborted();
    const asset = largeAssets[name];
    if (!asset) {
      throw new Error(`Invalid asset: ${name}`);
    }
    if (typeof __ASSETS__ !== 'undefined' && __ASSETS__[asset.src]) {
      return __ASSETS__[asset.src];
    }
    const dispatchProgress = (progress) => this.dispatchEvent(new CustomEvent('large-asset-fetch', {
      detail: {
        asset: name,
        progress
      }
    }));
    dispatchProgress(0);
    let result;
    let cameFromCache = false;
    try {
      const cached = await Adapter.getCachedAsset(asset);
      if (cached) {
        result = cached;
        cameFromCache = true;
        dispatchProgress(0.5);
      }
    } catch (e) {
      console.warn(e);
    }
    if (!result) {
      let url = asset.src;
      if (asset.useBuildId) {
        url += `?${buildId}`;
      }
      result = await request({
        url,
        type,
        estimatedSize: asset.estimatedSize,
        progressCallback: (progress) => {
          dispatchProgress(progress);
        },
        abortTarget: this
      });
    }
    if (asset.useBuildId && !verifyBuildId(buildId, result)) {
      throw new OutdatedPackagerError('Build ID does not match.');
    }
    if (asset.sha256) {
      const hash = await sha256(result);
      if (hash !== asset.sha256) {
        throw new Error(`Hash mismatch for ${name}, found ${hash} but expected ${asset.sha256}`);
      }
    }
    if (!cameFromCache) {
      try {
        await Adapter.cacheAsset(asset, result);
      } catch (e) {
        console.warn(e);
      }
    }
    dispatchProgress(1);
    return result;
  }

  getAddonOptions () {
    return {
      ...this.options.chunks,
      specialCloudBehaviors: this.options.cloudVariables.specialCloudBehaviors,
      unsafeCloudBehaviors: this.options.cloudVariables.unsafeCloudBehaviors,
      pause: this.options.controls.pause.enabled
    };
  }

  async loadResources () {
    const texts = [COPYRIGHT_HEADER];
    if (this.project.analysis.usesMusic) {
      texts.push(await this.fetchLargeAsset('scaffolding', 'text'));
    } else {
      texts.push(await this.fetchLargeAsset('scaffolding-min', 'text'));
    }
    if (Object.values(this.getAddonOptions()).some((i) => i)) {
      texts.push(await this.fetchLargeAsset('addons', 'text'));
    }
    this.script = texts.join('\n').replace(/<\/script>/g,"</scri'+'pt>");
  }

  computeWindowSize () {
    let width = this.options.stageWidth;
    let height = this.options.stageHeight;
    if (
      this.options.controls.greenFlag.enabled ||
      this.options.controls.stopAll.enabled ||
      this.options.controls.pause.enabled
    ) {
      height += 48;
    }
    return {width, height};
  }

  getPlistPropertiesForPrimaryExecutable () {
    return {
      [CFBundleIdentifier]: `${bundleIdentifierPrefix}${this.options.app.packageName}`,

      // For simplicity, we'll set these to the same thing
      [CFBundleName]: this.options.app.windowTitle,
      [CFBundleDisplayName]: this.options.app.windowTitle,

      // We do rename the executable
      [CFBundleExecutable]: this.options.app.packageName,

      // For simplicity, we'll set these to the same thing
      [CFBundleVersion]: this.options.app.version,
      [CFBundleShortVersionString]: this.options.app.version,

      // Most items generated by the packager are games
      [LSApplicationCategoryType]: 'public.app-category.games'
    };
  }

  async updatePlist (zip, name, newProperties) {
    const contents = await zip.file(name).async('string');
    const plist = parsePlist(contents);
    Object.assign(plist, newProperties);
    zip.file(name, generatePlist(plist));
  }

  async addNwJS (projectZip) {
    const nwjsBuffer = await this.fetchLargeAsset(this.options.target, 'arraybuffer');
    const nwjsZip = await (await getJSZip()).loadAsync(nwjsBuffer);

    const isWindows = this.options.target.startsWith('nwjs-win');
    const isMac = this.options.target === 'nwjs-mac';
    const isLinux = this.options.target.startsWith('nwjs-linux');

    // NW.js Windows folder structure:
    // * (root)
    // +-- nwjs-v0.49.0-win-x64
    //   +-- nw.exe (executable)
    //   +-- credits.html
    //   +-- (project data)
    //   +-- ...

    // NW.js macOS folder structure:
    // * (root)
    // +-- nwjs-v0.49.0-osx-64
    //   +-- credits.html
    //   +-- nwjs.app
    //     +-- Contents
    //       +-- Resources
    //         +-- app.icns (icon)
    //         +-- app.nw
    //           +-- (project data)
    //       +-- MacOS
    //         +-- nwjs (executable)
    //       +-- ...

    // the first folder, something like "nwjs-v0.49.0-win-64"
    const nwjsPrefix = Object.keys(nwjsZip.files)[0].split('/')[0];

    const zip = new (await getJSZip());

    const packageName = this.options.app.packageName;

    // Copy NW.js files to the right place
    for (const path of Object.keys(nwjsZip.files)) {
      const file = nwjsZip.files[path];

      let newPath = path.replace(nwjsPrefix, packageName);
      if (isWindows) {
        newPath = newPath.replace('nw.exe', `${packageName}.exe`);
      } else if (isMac) {
        newPath = newPath.replace('nwjs.app', `${packageName}.app`);
      } else if (isLinux) {
        newPath = newPath.replace(/nw$/, packageName);
      }

      setFileFast(zip, newPath, file);
    }

    const ICON_NAME = 'icon.png';
    const icon = await Adapter.getAppIcon(this.options.app.icon);
    const manifest = {
      name: packageName,
      main: 'main.js',
      version: this.options.app.version,
      window: {
        width: this.computeWindowSize().width,
        height: this.computeWindowSize().height,
        icon: ICON_NAME
      }
    };

    let dataPrefix;
    if (isWindows) {
      dataPrefix = `${packageName}/`;
    } else if (isMac) {
      const icnsData = await pngToAppleICNS(icon);
      zip.file(`${packageName}/${packageName}.app/Contents/Resources/app.icns`, icnsData);
      dataPrefix = `${packageName}/${packageName}.app/Contents/Resources/app.nw/`;
    } else if (isLinux) {
      const startScript = `#!/bin/bash
cd "$(dirname "$0")"
./${packageName}`;
      zip.file(`${packageName}/start.sh`, startScript, {
        unixPermissions: 0o100755
      });
      dataPrefix = `${packageName}/`;
    }

    // Copy project files and extra NW.js files to the right place
    for (const path of Object.keys(projectZip.files)) {
      setFileFast(zip, dataPrefix + path, projectZip.files[path]);
    }
    zip.file(dataPrefix + ICON_NAME, icon);
    zip.file(dataPrefix + 'package.json', JSON.stringify(manifest, null, 4));
    zip.file(dataPrefix + 'main.js', `
    const start = () => nw.Window.open('index.html', {
      position: 'center',
      new_instance: true
    });
    nw.App.on('open', start);
    start();`);

    const creditsHtmlPath = `${packageName}/credits.html`;
    const creditsHtml = await zip.file(creditsHtmlPath).async('string');
    zip.file(creditsHtmlPath, creditsHtml + generateChromiumLicenseHTML([
      SELF_LICENSE,
      SCRATCH_LICENSE
    ]));

    return zip;
  }

  async addElectron (projectZip) {
    const buffer = await this.fetchLargeAsset(this.options.target, 'arraybuffer');
    const electronZip = await (await getJSZip()).loadAsync(buffer);

    const isWindows = this.options.target.includes('win');
    const isMac = this.options.target.includes('mac');
    const isLinux = this.options.target.includes('linux');

    // See https://www.electronjs.org/docs/latest/tutorial/application-distribution#manual-distribution

    // Electron Windows/Linux folder structure:
    // * (root)
    // +-- electron.exe (executable)
    // +-- resources
    //    +-- default_app.asar (we will delete this)
    //    +-- app (we will create this)
    //      +-- index.html and the other project files (we will create this)
    // +-- LICENSES.chromium.html and everything else

    // Electron macOS folder structure:
    // * (root)
    // +-- Electron.app
    //    +-- Contents
    //      +-- Info.plist (we must update)
    //      +-- MacOS
    //        +-- Electron (executable)
    //      +-- Frameworks
    //        +-- Electron Helper.app
    //          +-- Contents
    //            +-- Info.plist (we must update)
    //        +-- Electron Helper (GPU).app
    //          +-- Contents
    //            +-- Info.plist (we must update)
    //        +-- Electron Helper (Renderer).app
    //          +-- Contents
    //            +-- Info.plist (we must update)
    //        +-- Electron Helper (Plugin).app
    //          +-- Contents
    //            +-- Info.plist (we must update)
    //        +-- and several other helpers which we won't touch
    //      +-- Resources
    //        +-- default_app.asar (we will delete this)
    //        +-- electron.icns (we will update this)
    //        +-- app (we will create this)
    //          +-- index.html and the other project files (we will create this)
    // +-- LICENSES.chromium.html and other license files

    const zip = new (await getJSZip());
    const packageName = this.options.app.packageName;
    for (const path of Object.keys(electronZip.files)) {
      const file = electronZip.files[path];

      // On Windows and Linux, make an inner folder inside the zip. Zip extraction tools will sometimes make
      // a mess if you don't make an inner folder.
      // On macOS, the .app is already itself a folder already and macOS will always make a folder for the
      // extracted files if there's multiple files at the root.
      let newPath;
      if (isMac) {
        newPath = path;
      } else {
        newPath = `${packageName}/${path}`;
      }

      if (isWindows) {
        newPath = newPath.replace('electron.exe', `${packageName}.exe`);
      } else if (isMac) {
        newPath = newPath.replace('Electron.app', `${packageName}.app`);
        newPath = newPath.replace(/Electron$/, packageName);
      } else if (isLinux) {
        newPath = newPath.replace(/electron$/, packageName);
      }

      setFileFast(zip, newPath, file);
    }

    const rootPrefix = isMac ? '' : `${packageName}/`;

    const creditsHtml = await zip.file(`${rootPrefix}LICENSES.chromium.html`).async('string');
    zip.file(`${rootPrefix}licenses.html`, creditsHtml + generateChromiumLicenseHTML([
      SELF_LICENSE,
      SCRATCH_LICENSE,
      ELECTRON_LICENSE
    ]));

    zip.remove(`${rootPrefix}LICENSE.txt`);
    zip.remove(`${rootPrefix}LICENSES.chromium.html`);
    zip.remove(`${rootPrefix}LICENSE`);
    zip.remove(`${rootPrefix}version`);
    zip.remove(`${rootPrefix}resources/default_app.asar`);

    const contentsPrefix = isMac ? `${rootPrefix}${packageName}.app/Contents/` : rootPrefix;
    const resourcesPrefix = isMac ? `${contentsPrefix}Resources/app/` : `${contentsPrefix}resources/app/`;
    const electronMainName = 'electron-main.js';
    const iconName = 'icon.png';

    const icon = await Adapter.getAppIcon(this.options.app.icon);
    zip.file(`${resourcesPrefix}${iconName}`, icon);

    const manifest = {
      name: packageName,
      main: electronMainName,
      version: this.options.app.version
    };
    zip.file(`${resourcesPrefix}package.json`, JSON.stringify(manifest, null, 4));

    const mainJS = `'use strict';
const {app, BrowserWindow, Menu, shell, screen, dialog} = require('electron');
const path = require('path');

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

if (isMac) {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' },
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'windowMenu' },
    { role: 'help' }
  ]));
} else {
  Menu.setApplicationMenu(null);
}

const resourcesURL = Object.assign(new URL('file://'), {
  pathname: path.join(__dirname, '/')
}).href;
const defaultProjectURL = new URL('./index.html', resourcesURL).href;

const createWindow = (windowOptions) => {
  const options = {
    title: ${JSON.stringify(this.options.app.windowTitle)},
    icon: path.resolve(__dirname, ${JSON.stringify(iconName)}),
    useContentSize: true,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: true,
    width: 480,
    height: 360,
    ...windowOptions,
  };

  const activeScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const bounds = activeScreen.workArea;
  options.x = bounds.x + ((bounds.width - options.width) / 2);
  options.y = bounds.y + ((bounds.height - options.height) / 2);

  const window = new BrowserWindow(options);
  return window;
};

const createProjectWindow = (url) => {
  const windowMode = ${JSON.stringify(this.options.app.windowMode)};
  const options = {
    show: false,
    backgroundColor: ${JSON.stringify(this.options.appearance.background)},
    width: ${this.computeWindowSize().width},
    height: ${this.computeWindowSize().height},
    minWidth: 50,
    minHeight: 50,
  };
  // fullscreen === false disables fullscreen on macOS so only set this property when it's true
  if (windowMode === 'fullscreen') {
    options.fullscreen = true;
  }
  const window = createWindow(options);
  if (windowMode === 'maximize') {
    window.maximize();
  }
  window.loadURL(url);
  window.show();
};

const createDataWindow = (dataURI) => {
  const window = createWindow({});
  window.loadURL(dataURI);
};

const isResourceURL = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'file:' && parsedUrl.href.startsWith(resourcesURL);
  } catch (e) {
    // ignore
  }
  return false;
};

const SAFE_PROTOCOLS = [
  'https:',
  'http:',
  'mailto:',
];

const isSafeOpenExternal = (url) => {
  try {
    const parsedUrl = new URL(url);
    return SAFE_PROTOCOLS.includes(parsedUrl.protocol);
  } catch (e) {
    // ignore
  }
  return false;
};

const isDataURL = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'data:';
  } catch (e) {
    // ignore
  }
  return false;
};

const openLink = (url) => {
  if (isDataURL(url)) {
    createDataWindow(url);
  } else if (isResourceURL(url)) {
    createProjectWindow(url);
  } else if (isSafeOpenExternal(url)) {
    shell.openExternal(url);
  }
};

app.on('render-process-gone', (event, webContents, details) => {
  const window = BrowserWindow.fromWebContents(webContents);
  dialog.showMessageBoxSync(window, {
    type: 'error',
    title: 'Error',
    message: 'Renderer process crashed: ' + details.reason + ' (' + details.exitCode + ')'
  });
});

app.on('child-process-gone', (event, details) => {
  dialog.showMessageBoxSync({
    type: 'error',
    title: 'Error',
    message: details.type + ' child process crashed: ' + details.reason + ' (' + details.exitCode + ')'
  });
});

app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler((details) => {
    setImmediate(() => {
      openLink(details.url);
    });
    return {action: 'deny'};
  });
  contents.on('will-navigate', (e, url) => {
    if (!isResourceURL(url)) {
      e.preventDefault();
      openLink(url);
    }
  });
  contents.on('before-input-event', (e, input) => {
    const window = BrowserWindow.fromWebContents(contents);
    if (!window || input.type !== "keyDown") return;
    if (input.key === 'F11' || (input.key === 'Enter' && input.alt)) {
      window.setFullScreen(!window.isFullScreen());
    } else if (input.key === 'Escape' && window.isFullScreen()) {
      window.setFullScreen(false);
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.whenReady().then(() => {
  createProjectWindow(defaultProjectURL);
});
`;
    zip.file(`${resourcesPrefix}${electronMainName}`, mainJS);

    for (const [path, data] of Object.entries(projectZip.files)) {
      setFileFast(zip, `${resourcesPrefix}${path}`, data);
    }

    if (isWindows) {
      const readme = [
        '1) Extract the whole zip',
        `2) Open "${packageName}.exe" to start the app.`,
        'Open "licenses.html" for information regarding open source software used by the app.',
      ].join('\n\n');
      zip.file(`${rootPrefix}README.txt`, readme);
    } else if (isMac) {
      const plist = this.getPlistPropertiesForPrimaryExecutable();
      await this.updatePlist(zip, `${contentsPrefix}Info.plist`, plist);

      // macOS Electron apps also contain several helper apps that we should update.
      const HELPERS = [
        'Electron Helper',
        'Electron Helper (GPU)',
        'Electron Helper (Renderer)',
        'Electron Helper (Plugin)',
      ];
      for (const name of HELPERS) {
        await this.updatePlist(zip, `${contentsPrefix}Frameworks/${name}.app/Contents/Info.plist`, {
          // In the prebuilt Electron binaries on GitHub, the original app has a CFBundleIdentifier of
          // com.github.Electron and all the helpers have com.github.Electron.helper
          [CFBundleIdentifier]: `${plist[CFBundleIdentifier]}.helper`,

          // We shouldn't change the actual name of the helpers because we don't actually rename their .app
          // We also don't rename the executable
          [CFBundleDisplayName]: name.replace('Electron', this.options.app.packageName),

          // electron-builder always updates the helpers to use the same version as the app itself
          [CFBundleVersion]: this.options.app.version,
          [CFBundleShortVersionString]: this.options.app.version,
        });
      }

      const icns = await pngToAppleICNS(icon);
      zip.file(`${contentsPrefix}Resources/electron.icns`, icns);
    } else if (isLinux) {
      // Some Linux distributions can't easily open the executable file from the GUI, so we'll add a simple wrapper that people can use instead.
      const startScript = `#!/bin/bash
cd "$(dirname "$0")"
./${packageName}`;
      zip.file(`${rootPrefix}start.sh`, startScript, {
        unixPermissions: 0o100755
      });
    }

    return zip;
  }

  async addWebViewMac (projectZip) {
    const buffer = await this.fetchLargeAsset(this.options.target, 'arraybuffer');
    const appZip = await (await getJSZip()).loadAsync(buffer);

    // +-- WebView.app
    //   +-- Contents
    //     +-- Info.plist
    //     +-- MacOS
    //       +-- WebView (executable)
    //     +-- Resources
    //       +-- index.html
    //       +-- application_config.json
    //       +-- AppIcon.icns

    const newAppName = `${this.options.app.packageName}.app`;
    const contentsPrefix = `${newAppName}/Contents/`;
    const resourcesPrefix = `${newAppName}/Contents/Resources/`;

    const zip = new (await getJSZip());
    for (const [path, data] of Object.entries(appZip.files)) {
      const newPath = path
        // Rename the .app itself
        .replace('WebView.app', newAppName)
        // Rename the executable
        .replace(/WebView$/, this.options.app.packageName);
      setFileFast(zip, newPath, data);
    }
    for (const [path, data] of Object.entries(projectZip.files)) {
      setFileFast(zip, `${resourcesPrefix}${path}`, data);
    }

    const icon = await Adapter.getAppIcon(this.options.app.icon);
    const icns = await pngToAppleICNS(icon);
    zip.file(`${resourcesPrefix}AppIcon.icns`, icns);
    zip.remove(`${resourcesPrefix}Assets.car`);

    const parsedBackgroundColor = parseInt(this.options.appearance.background.substr(1), 16);
    const applicationConfig = {
      title: this.options.app.windowTitle,
      background: [
        // R, G, B [0-255]
        parsedBackgroundColor >> 16 & 0xff,
        parsedBackgroundColor >> 8 & 0xff,
        parsedBackgroundColor & 0xff,
        // A [0-1]
        1
      ],
      width: this.computeWindowSize().width,
      height: this.computeWindowSize().height
    };
    zip.file(`${resourcesPrefix}application_config.json`, JSON.stringify(applicationConfig));

    await this.updatePlist(zip, `${contentsPrefix}Info.plist`, this.getPlistPropertiesForPrimaryExecutable());

    return zip;
  }

  makeWebSocketProvider () {
    // If using the default turbowarp.org server, we'll add a fallback for the turbowarp.xyz alias.
    // This helps work around web filters as turbowarp.org can be blocked for games and turbowarp.xyz uses
    // a problematic TLD. These are the same server and same variables, just different domain.
    const cloudHost = this.options.cloudVariables.cloudHost === 'wss://clouddata.turbowarp.org' ? [
      'wss://clouddata.turbowarp.org',
      'wss://clouddata.turbowarp.xyz'
    ] : this.options.cloudVariables.cloudHost;
    return `new Scaffolding.Cloud.WebSocketProvider(${JSON.stringify(cloudHost)}, ${JSON.stringify(this.options.projectId)})`;
  }

  makeLocalStorageProvider () {
    return `new Scaffolding.Cloud.LocalStorageProvider(${JSON.stringify(`cloudvariables:${this.options.projectId}`)})`;
  }

  makeCustomProvider () {
    const variables = this.options.cloudVariables.custom;
    let result = '{const providers = {};\n';
    for (const provider of new Set(Object.values(variables))) {
      if (provider === 'ws') {
        result += `providers.ws = ${this.makeWebSocketProvider()};\n`;
      } else if (provider === 'local') {
        result += `providers.local = ${this.makeLocalStorageProvider()};\n`;
      }
    }
    result += 'for (const provider of Object.values(providers)) scaffolding.addCloudProvider(provider);\n';
    for (const variableName of Object.keys(variables)) {
      const providerToUse = variables[variableName];
      result += `scaffolding.addCloudProviderOverride(${JSON.stringify(variableName)}, providers[${JSON.stringify(providerToUse)}] || null);\n`;
    }
    result += '}';
    return result;
  }

  generateFilename (extension) {
    return `${this.options.app.windowTitle}.${extension}`;
  }

  async generateGetProjectData () {
    let result = '';
    let getProjectDataFunction = '';
    let isZip = false;
    let storageProgressStart;
    let storageProgressEnd;

    if (this.options.target === 'html') {
      isZip = this.project.type !== 'blob';
      storageProgressStart = PROGRESS_FETCHED_COMPRESSED;
      storageProgressEnd = PROGRESS_EXTRACTED_COMPRESSED;

      // We break the project into a bunch of small segments to be able to show a good progress bar.
      const SEGMENT_LENGTH = 100000;
      const encoded = encode(this.project.arrayBuffer);
      for (let i = 0; i < encoded.length; i += SEGMENT_LENGTH) {
        const segment = encoded.substr(i, SEGMENT_LENGTH);
        const progress = interpolate(PROGRESS_LOADED_SCRIPTS, PROGRESS_FETCHED_COMPRESSED, i / encoded.length);
        // Progress will always be a number between 0 and 1. We can remove the leading 0 and unnecessary decimals to save space.
        const shortenedProgress = progress.toString().substr(1, 4);
        result += `<script type="p4-project">${segment}</script><script>setProgress(${shortenedProgress})</script>`;
      }

      getProjectDataFunction = `async () => {
        const base85decode = ${decode};
        const dataElements = Array.from(document.querySelectorAll('script[type="p4-project"]'));
        const result = base85decode(dataElements.map(i => i.textContent).join(''));
        dataElements.forEach(i => i.remove());
        return result;
      }`;
    } else {
      let src;
      if (this.project.type === 'blob' || this.options.target === 'zip-one-asset') {
        isZip = this.project.type !== 'blob';
        src = './project.zip';
        storageProgressStart = PROGRESS_FETCHED_COMPRESSED;
        storageProgressEnd = PROGRESS_EXTRACTED_COMPRESSED;
      } else {
        src = './assets/project.json';
        storageProgressStart = PROGRESS_FETCHED_PROJECT_JSON;
        storageProgressEnd = PROGRESS_FETCHED_ASSETS;
      }

      getProjectDataFunction = `() => new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
          resolve(xhr.response);
        };
        xhr.onerror = () => {
          if (location.protocol === 'file:') {
            reject(new Error('Zip environment must be used from a website, not from a file URL.'));
          } else {
            reject(new Error('Request to load project data failed.'));
          }
        };
        xhr.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(interpolate(${PROGRESS_LOADED_SCRIPTS}, ${storageProgressStart}, e.loaded / e.total));
          }
        };
        xhr.responseType = 'arraybuffer';
        xhr.open('GET', ${JSON.stringify(src)});
        xhr.send();
      })`;
    }

    result += `
    <script>
      const getProjectData = (function() {
        const storage = scaffolding.storage;
        storage.onprogress = (total, loaded) => {
          setProgress(interpolate(${storageProgressStart}, ${storageProgressEnd}, loaded / total));
        };
        ${isZip ? `
        storage.addHelper({
          load: (assetType, assetId, dataFormat) => zip.file(assetId + '.' + dataFormat)
            .async('uint8array')
            .then((data) => new storage.Asset(assetType, assetId, dataFormat, data))
        });
        return () => (${getProjectDataFunction})().then(async (data) => {
          zip = await Scaffolding.JSZip.loadAsync(data);
          return zip.file('project.json').async('arraybuffer');
        });` : `
        storage.addWebStore(
          [storage.AssetType.ImageVector, storage.AssetType.ImageBitmap, storage.AssetType.Sound],
          (asset) => new URL('./assets/' + asset.assetId + '.' + asset.dataFormat, location).href
        );
        return ${getProjectDataFunction};`}
      })();
    </script>`;
    return result;
  }

  async generateFavicon () {
    if (this.options.app.icon === null) {
      return '';
    }
    const data = await Adapter.readAsURL(this.options.app.icon, 'app icon');
    return `<link rel="icon" href="${data}">`;
  }

  async generateCursor () {
    if (this.options.cursor.type !== 'custom') {
      return this.options.cursor.type;
    }
    if (!this.options.cursor.custom) {
      // Configured to use a custom cursor but no image was selected
      return 'auto';
    }
    const data = await Adapter.readAsURL(this.options.cursor.custom, 'custom cursor');
    return `url(${data}) ${this.options.cursor.center.x} ${this.options.cursor.center.y}, auto`;
  }

  async package () {
    if (!Adapter) {
      throw new Error('Missing adapter');
    }
    if (this.used) {
      throw new Error('Packager was already used');
    }
    this.used = true;
    this.ensureNotAborted();
    await this.loadResources();
    this.ensureNotAborted();
    const html = `<!DOCTYPE html>
<!-- Created with ${WEBSITE} -->
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <!-- We only include this to explicitly loosen the CSP of various packager environments. It does not provide any security. -->
  <meta http-equiv="Content-Security-Policy" content="default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:">
  <title>${escapeXML(this.options.app.windowTitle)}</title>
  <style>
    body {
      color: ${this.options.appearance.foreground};
      font-family: sans-serif;
      overflow: hidden;
      margin: 0;
      padding: 0;
    }
    :root, body.is-fullscreen {
      background-color: ${this.options.appearance.background};
    }
    [hidden] {
      display: none !important;
    }
    h1 {
      font-weight: normal;
    }
    a {
      color: inherit;
      text-decoration: underline;
      cursor: pointer;
    }

    #app, #loading, #error, #launch {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    .screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      cursor: default;
      user-select: none;
      -webkit-user-select: none;
      background-color: ${this.options.appearance.background};
    }
    #launch {
      background-color: rgba(0, 0, 0, 0.7);
      cursor: pointer;
    }
    .green-flag {
      width: 80px;
      height: 80px;
      padding: 16px;
      border-radius: 100%;
      background: rgba(255, 255, 255, 0.75);
      border: 3px solid hsla(0, 100%, 100%, 1);
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
    }
    #loading {
      ${this.options.loadingScreen.image && this.options.loadingScreen.imageMode === 'stretch'
        ? `background-image: url(${await Adapter.readAsURL(this.options.loadingScreen.image, 'stretched loading screen')});
      background-repeat: no-repeat;
      background-size: contain;
      background-position: center;`
        : ''}
    }
    .progress-bar-outer {
      border: 1px solid currentColor;
      height: 10px;
      width: 200px;
      max-width: 200px;
    }
    .progress-bar-inner {
      height: 100%;
      width: 0;
      background-color: currentColor;
    }
    .loading-text, noscript {
      font-weight: normal;
      font-size: 36px;
      margin: 0 0 16px;
    }
    .loading-image {
      margin: 0 0 16px;
    }
    #error-message, #error-stack {
      font-family: monospace;
      max-width: 600px;
      white-space: pre-wrap;
      user-select: text;
      -webkit-user-select: text;
    }
    #error-stack {
      text-align: left;
      max-height: 200px;
      overflow: auto;
    }
    .control-button {
      width: 2rem;
      height: 2rem;
      padding: 0.375rem;
      border-radius: 0.25rem;
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
      user-select: none;
      -webkit-user-select: none;
      cursor: pointer;
      border: 0;
      border-radius: 4px;
    }
    .control-button:hover {
      background: ${this.options.appearance.accent}26;
    }
    .control-button.active {
      background: ${this.options.appearance.accent}59;
    }
    .fullscreen-button {
      background: white !important;
    }
    .standalone-fullscreen-button {
      position: absolute;
      top: 0;
      right: 0;
      background-color: rgba(0, 0, 0, 0.5);
      border-radius: 0 0 0 4px;
      padding: 4px;
      cursor: pointer;
    }
    .sc-canvas {
      cursor: ${await this.generateCursor()};
    }
    .sc-monitor-root[opcode^="data_"] .sc-monitor-value-color {
      background-color: ${this.options.monitors.variableColor};
    }
    ${this.options.custom.css}
  </style>
  <meta name="theme-color" content="${this.options.appearance.background}">
  ${await this.generateFavicon()}
</head>
<body>
  <div id="app"></div>

  <div id="launch" class="screen" hidden title="Click to start">
    <div class="green-flag">
      <svg viewBox="0 0 16.63 17.5" width="42" height="44">
        <defs><style>.cls-1,.cls-2{fill:#4cbf56;stroke:#45993d;stroke-linecap:round;stroke-linejoin:round;}.cls-2{stroke-width:1.5px;}</style></defs>
        <path class="cls-1" d="M.75,2A6.44,6.44,0,0,1,8.44,2h0a6.44,6.44,0,0,0,7.69,0V12.4a6.44,6.44,0,0,1-7.69,0h0a6.44,6.44,0,0,0-7.69,0"/>
        <line class="cls-2" x1="0.75" y1="16.75" x2="0.75" y2="0.75"/>
      </svg>
    </div>
  </div>

  <div id="loading" class="screen">
    <noscript>Enable JavaScript</noscript>
    ${this.options.loadingScreen.text ? `<h1 class="loading-text">${escapeXML(this.options.loadingScreen.text)}</h1>` : ''}
    ${this.options.loadingScreen.image && this.options.loadingScreen.imageMode === 'normal' ? `<div class="loading-image"><img src="${await Adapter.readAsURL(this.options.loadingScreen.image, 'loading-screen')}"></div>` : ''}
    ${this.options.loadingScreen.progressBar ? '<div class="progress-bar-outer"><div class="progress-bar-inner" id="loading-inner"></div></div>' : ''}
  </div>

  <div id="error" class="screen" hidden>
    <h1>Error</h1>
    <details>
      <summary id="error-message"></summary>
      <p id="error-stack"></p>
    </details>
  </div>

  ${this.options.target === 'html' ? `<script>${this.script}</script>` : '<script src="script.js"></script>'}
  <script>${removeUnnecessaryEmptyLines(`
    const appElement = document.getElementById('app');
    const launchScreen = document.getElementById('launch');
    const loadingScreen = document.getElementById('loading');
    const loadingInner = document.getElementById('loading-inner');
    const errorScreen = document.getElementById('error');
    const errorScreenMessage = document.getElementById('error-message');
    const errorScreenStack = document.getElementById('error-stack');

    const handleError = (error) => {
      console.error(error);
      if (!errorScreen.hidden) return;
      errorScreen.hidden = false;
      errorScreenMessage.textContent = '' + error;
      let debug = error && error.stack || 'no stack';
      debug += '\\nUser agent: ' + navigator.userAgent;
      errorScreenStack.textContent = debug;
    };
    const setProgress = (progress) => {
      if (loadingInner) loadingInner.style.width = progress * 100 + '%';
    };
    const interpolate = (a, b, t) => a + t * (b - a);

    try {
      setProgress(${PROGRESS_LOADED_SCRIPTS});

      const scaffolding = new Scaffolding.Scaffolding();
      scaffolding.width = ${this.options.stageWidth};
      scaffolding.height = ${this.options.stageHeight};
      scaffolding.resizeMode = ${JSON.stringify(this.options.resizeMode)};
      scaffolding.editableLists = ${this.options.monitors.editableLists};
      scaffolding.setup();
      scaffolding.appendTo(appElement);

      const vm = scaffolding.vm;
      window.scaffolding = scaffolding;
      window.vm = scaffolding.vm;
      window.Scratch = {
        vm,
        renderer: vm.renderer,
        audioEngine: vm.runtime.audioEngine,
        bitmapAdapter: vm.runtime.v2BitmapAdapter,
        videoProvider: vm.runtime.ioDevices.video.provider
      };

      scaffolding.setUsername(${JSON.stringify(this.options.username)}.replace(/#/g, () => Math.floor(Math.random() * 10)));
      scaffolding.setAccentColor(${JSON.stringify(this.options.appearance.accent)});

      ${this.options.cloudVariables.mode === 'ws' ?
        `scaffolding.addCloudProvider(${this.makeWebSocketProvider()})` :
        this.options.cloudVariables.mode === 'local' ?
        `scaffolding.addCloudProvider(${this.makeLocalStorageProvider()})` :
        this.options.cloudVariables.mode === 'custom' ?
        this.makeCustomProvider() :
        ''
      };

      ${this.options.controls.greenFlag.enabled ? `
      const greenFlagButton = document.createElement('img');
      greenFlagButton.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16.63 17.5"><path d="M.75 2a6.44 6.44 0 017.69 0h0a6.44 6.44 0 007.69 0v10.4a6.44 6.44 0 01-7.69 0h0a6.44 6.44 0 00-7.69 0" fill="#4cbf56" stroke="#45993d" stroke-linecap="round" stroke-linejoin="round"/><path stroke-width="1.5" fill="#4cbf56" stroke="#45993d" stroke-linecap="round" stroke-linejoin="round" d="M.75 16.75v-16"/></svg>');
      greenFlagButton.className = 'control-button';
      greenFlagButton.addEventListener('click', () => {
        scaffolding.greenFlag();
      });
      scaffolding.addEventListener('PROJECT_RUN_START', () => {
        greenFlagButton.classList.add('active');
      });
      scaffolding.addEventListener('PROJECT_RUN_STOP', () => {
        greenFlagButton.classList.remove('active');
      });
      scaffolding.addControlButton({
        element: greenFlagButton,
        where: 'top-left'
      });` : ''}

      ${this.options.controls.pause.enabled ? `
      const pauseButton = document.createElement('img');
      pauseButton.className = 'control-button';
      let isPaused = false;
      pauseButton.addEventListener('click', () => {
        isPaused = !isPaused;
        vm.setPaused(isPaused);
      });
      const updatePause = () => {
        if (isPaused) {
          pauseButton.src = 'data:image/svg+xml,' + encodeURIComponent('<svg width="16" height="16" viewBox="0 0 4.2333332 4.2333335" xmlns="http://www.w3.org/2000/svg"><path d="m3.95163484 2.02835365-1.66643921.9621191-1.66643913.96211911V.10411543l1.66643922.9621191z" fill="#ffae00"/></svg>');
        } else {
          pauseButton.src = 'data:image/svg+xml,' + encodeURIComponent('<svg width="16" height="16" viewBox="0 0 4.2333332 4.2333335" xmlns="http://www.w3.org/2000/svg"><g fill="#ffae00"><path d="M.389.19239126h1.2631972v3.8485508H.389zM2.5810001.19239126h1.2631972v3.8485508H2.5810001z"/></g></svg>');
        }
      }
      vm.on('P4_PAUSE', updatePause);
      updatePause();
      scaffolding.addControlButton({
        element: pauseButton,
        where: 'top-left'
      });` : ''}

      ${this.options.controls.stopAll.enabled ? `
      const stopAllButton = document.createElement('img');
      stopAllButton.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><path fill="#ec5959" stroke="#b84848" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="M4.3.5h5.4l3.8 3.8v5.4l-3.8 3.8H4.3L.5 9.7V4.3z"/></svg>');
      stopAllButton.className = 'control-button';
      stopAllButton.addEventListener('click', () => {
        scaffolding.stopAll();
      });
      scaffolding.addControlButton({
        element: stopAllButton,
        where: 'top-left'
      });` : ''}

      ${this.options.controls.fullscreen.enabled ? `
      if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
        let isFullScreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
        const fullscreenButton = document.createElement('img');
        fullscreenButton.className = 'control-button fullscreen-button';
        fullscreenButton.addEventListener('click', () => {
          if (isFullScreen) {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            }
          } else {
            if (document.body.requestFullscreen) {
              document.body.requestFullscreen();
            } else if (document.body.webkitRequestFullscreen) {
              document.body.webkitRequestFullscreen();
            }
          }
        });
        const otherControlsExist = ${this.options.controls.greenFlag.enabled || this.options.controls.stopAll.enabled};
        const fillColor = otherControlsExist ? '#575E75' : '${this.options.appearance.foreground}';
        const updateFullScreen = () => {
          isFullScreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
          document.body.classList.toggle('is-fullscreen', isFullScreen);
          if (isFullScreen) {
            fullscreenButton.src = 'data:image/svg+xml,' + encodeURIComponent('<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><g fill="' + fillColor + '" fill-rule="evenodd"><path d="M12.662 3.65l.89.891 3.133-2.374a.815.815 0 011.15.165.819.819 0 010 .986L15.467 6.46l.867.871c.25.25.072.664-.269.664L12.388 8A.397.397 0 0112 7.611V3.92c0-.341.418-.514.662-.27M7.338 16.35l-.89-.89-3.133 2.374a.817.817 0 01-1.15-.166.819.819 0 010-.985l2.37-3.143-.87-.871a.387.387 0 01.27-.664L7.612 12a.397.397 0 01.388.389v3.692a.387.387 0 01-.662.27M7.338 3.65l-.89.891-3.133-2.374a.815.815 0 00-1.15.165.819.819 0 000 .986l2.37 3.142-.87.871a.387.387 0 00.27.664L7.612 8A.397.397 0 008 7.611V3.92a.387.387 0 00-.662-.27M12.662 16.35l.89-.89 3.133 2.374a.817.817 0 001.15-.166.819.819 0 000-.985l-2.368-3.143.867-.871a.387.387 0 00-.269-.664L12.388 12a.397.397 0 00-.388.389v3.692c0 .342.418.514.662.27"/></g></svg>');
          } else {
            fullscreenButton.src = 'data:image/svg+xml,' + encodeURIComponent('<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><g fill="' + fillColor + '" fill-rule="evenodd"><path d="M16.338 7.35l-.89-.891-3.133 2.374a.815.815 0 01-1.15-.165.819.819 0 010-.986l2.368-3.142-.867-.871a.387.387 0 01.269-.664L16.612 3a.397.397 0 01.388.389V7.08a.387.387 0 01-.662.27M3.662 12.65l.89.89 3.133-2.374a.817.817 0 011.15.166.819.819 0 010 .985l-2.37 3.143.87.871c.248.25.071.664-.27.664L3.388 17A.397.397 0 013 16.611V12.92c0-.342.418-.514.662-.27M3.662 7.35l.89-.891 3.133 2.374a.815.815 0 001.15-.165.819.819 0 000-.986L6.465 4.54l.87-.871a.387.387 0 00-.27-.664L3.388 3A.397.397 0 003 3.389V7.08c0 .341.418.514.662.27M16.338 12.65l-.89.89-3.133-2.374a.817.817 0 00-1.15.166.819.819 0 000 .985l2.368 3.143-.867.871a.387.387 0 00.269.664l3.677.005a.397.397 0 00.388-.389V12.92a.387.387 0 00-.662-.27"/></g></svg>');
          }
        };
        updateFullScreen();
        document.addEventListener('fullscreenchange', updateFullScreen);
        document.addEventListener('webkitfullscreenchange', updateFullScreen);
        if (otherControlsExist) {
          fullscreenButton.className = 'control-button fullscreen-button';
          scaffolding.addControlButton({
            element: fullscreenButton,
            where: 'top-right'
          });
        } else {
          fullscreenButton.className = 'standalone-fullscreen-button';
          document.body.appendChild(fullscreenButton);
        }
      }` : ''}

      vm.setTurboMode(${this.options.turbo});
      if (vm.setInterpolation) vm.setInterpolation(${this.options.interpolation});
      if (vm.setFramerate) vm.setFramerate(${this.options.framerate});
      if (vm.renderer.setUseHighQualityRender) vm.renderer.setUseHighQualityRender(${this.options.highQualityPen});
      if (vm.setRuntimeOptions) vm.setRuntimeOptions({
        fencing: ${this.options.fencing},
        miscLimits: ${this.options.miscLimits},
        maxClones: ${this.options.maxClones},
      });
      if (vm.setCompilerOptions) vm.setCompilerOptions({
        enabled: ${this.options.compiler.enabled},
        warpTimer: ${this.options.compiler.warpTimer}
      });

      if (typeof ScaffoldingAddons !== 'undefined') {
        ScaffoldingAddons.run(scaffolding, ${JSON.stringify(this.getAddonOptions())});
      }

      for (const extension of ${JSON.stringify(this.options.extensions.map(i => i.url))}) {
        vm.extensionManager.loadExtensionURL(extension);
      }

      ${this.options.closeWhenStopped ? `vm.runtime.on('PROJECT_RUN_STOP', () => window.close());` : ''}

      ${this.options.target.startsWith('nwjs-') ? `
      if (typeof nw !== 'undefined') {
        const win = nw.Window.get();
        win.on('new-win-policy', (frame, url, policy) => {
          policy.ignore();
          nw.Shell.openExternal(url);
        });
        win.on('navigation', (frame, url, policy) => {
          policy.ignore();
          nw.Shell.openExternal(url);
        });
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && document.fullscreenElement) {
            document.exitFullscreen();
          }
        });
      }` : ''}
    } catch (e) {
      handleError(e);
    }
  `)}</script>
  ${this.options.custom.js ? `<script>
    try {
      ${this.options.custom.js}
    } catch (e) {
      handleError(e);
    }
  </script>` : ''}
  ${await this.generateGetProjectData()}
  <script>
    const run = async () => {
      const projectData = await getProjectData();
      await scaffolding.loadProject(projectData);
      setProgress(1);
      loadingScreen.hidden = true;
      if (${this.options.autoplay}) {
        scaffolding.start();
      } else {
        launchScreen.hidden = false;
        launchScreen.addEventListener('click', () => {
          launchScreen.hidden = true;
          scaffolding.start();
        });
        launchScreen.focus();
      }
    };
    run().catch(handleError);
  </script>
</body>
</html>
`;
    this.ensureNotAborted();

    if (this.options.target !== 'html') {
      let zip;
      if (this.project.type === 'sb3' && this.options.target !== 'zip-one-asset') {
        zip = await (await getJSZip()).loadAsync(this.project.arrayBuffer);
        for (const file of Object.keys(zip.files)) {
          zip.files[`assets/${file}`] = zip.files[file];
          delete zip.files[file];
        }
      } else {
        zip = new (await getJSZip());
        zip.file('project.zip', this.project.arrayBuffer);
      }
      zip.file('index.html', html);
      zip.file('script.js', this.script);

      if (this.options.target.startsWith('nwjs-')) {
        zip = await this.addNwJS(zip);
      } else if (this.options.target.startsWith('electron-')) {
        zip = await this.addElectron(zip);
      } else if (this.options.target === 'webview-mac') {
        zip = await this.addWebViewMac(zip);
      }

      this.ensureNotAborted();
      return {
        data: await zip.generateAsync({
          type: 'arraybuffer',
          compression: 'DEFLATE',
          // Use UNIX permissions so that executable bits are properly set for macOS and Linux
          platform: 'UNIX'
        }, (meta) => {
          this.dispatchEvent(new CustomEvent('zip-progress', {
            detail: {
              progress: meta.percent / 100
            }
          }));
        }),
        type: 'application/zip',
        filename: this.generateFilename('zip')
      };
    }
    return {
      data: html,
      type: 'text/html',
      filename: this.generateFilename('html')
    };
  }
}

Packager.getDefaultPackageNameFromFileName = (title) => {
  // Note: Changing this logic is very dangerous because changing the defaults will cause already packaged projects
  // to loose any data when they are updated.
  title = title.split('.')[0];
  title = title.replace(/[^\-a-z ]/gi, '');
  title = title.trim();
  title = title.replace(/ /g, '-');
  return title.toLowerCase() || 'packaged-project';
};

Packager.getWindowTitleFromFileName = (title) => {
  const split = title.split('.');
  if (split.length > 1) {
    split.pop();
  }
  title = split.join('.').trim();
  return title || 'Packaged Project';
};

Packager.DEFAULT_OPTIONS = () => ({
  turbo: false,
  interpolation: false,
  framerate: 30,
  highQualityPen: false,
  maxClones: 300,
  fencing: true,
  miscLimits: true,
  stageWidth: 480,
  stageHeight: 360,
  resizeMode: 'preserve-ratio',
  autoplay: false,
  username: 'player####',
  closeWhenStopped: false,
  projectId: '',
  custom: {
    css: '',
    js: ''
  },
  appearance: {
    background: '#000000',
    foreground: '#ffffff',
    accent: ACCENT_COLOR
  },
  loadingScreen: {
    progressBar: true,
    text: '',
    imageMode: 'normal',
    image: null
  },
  controls: {
    greenFlag: {
      enabled: false,
    },
    stopAll: {
      enabled: false,
    },
    fullscreen: {
      enabled: false
    },
    pause: {
      enabled: false
    }
  },
  monitors: {
    editableLists: false,
    variableColor: '#ff8c1a'
  },
  compiler: {
    enabled: true,
    warpTimer: false
  },
  target: 'html',
  app: {
    icon: null,
    packageName: Packager.getDefaultPackageNameFromFileName(''),
    windowTitle: Packager.getWindowTitleFromFileName(''),
    windowMode: 'window',
    version: '1.0.0'
  },
  chunks: {
    gamepad: false,
    pointerlock: false,
  },
  cloudVariables: {
    mode: 'ws',
    cloudHost: 'wss://clouddata.turbowarp.org',
    custom: {},
    specialCloudBehaviors: false,
    unsafeCloudBehaviors: false,
  },
  cursor: {
    type: 'auto',
    custom: null,
    center: {
      x: 0,
      y: 0
    }
  },
  extensions: []
});

export default Packager;
