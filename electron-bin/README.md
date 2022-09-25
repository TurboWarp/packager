# Electron binaries

These are scripts used to generate the Electron binaries used by the packager.

Electron version is defined in version.json.

## macOS

Electron does not provide pre-built Universal binaries, so we have to make them ourselves.

Script can only be run on macOS:

```
node generate-macos.js
```

Output will be stored in temp/macos.

## Windows

For Windows, we change the icon of the executable to avoid misusing the Electron trademark.

Script should work on non-Windows systems if Wine is installed.

```
node generate-windows.js
```

Output will be stored in temp/windows.

## Linux

On Linux we use the exact binaries provided by the Electron project.
