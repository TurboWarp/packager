These are scripts used to generate Electron binaries.

## macOS

Electron does not provide pre-built Universal binaries, so we have to make them ourselves.

Electron version is defined in version.json.

Script can only be run on macOS:

```
node generate-macos.js
```

Output will be stored in temp/macos.
