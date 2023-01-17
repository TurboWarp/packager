This is the source code for the prebuilt binaries for the WKWebView environment.

This is an Xcode project. Open WebView.xcodeproj to edit.

To make an unsigned build:

```
xcodebuild -scheme WebView -configuration Release clean archive -archivePath build/app.xcarchive CODE_SIGNING_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO
```

The output WebView.app is generated as build/app.xcarchive/Products/Applications/WebView.app (alternatively, with GUI: open build/app.xcarchive -> Distribute -> Copy App -> Select a place like your desktop)

WebView.app is just a folder. Important files:

 - WebView.app/Contents/Info.plist contains properties like `CFBundleIdentifier` (unique app ID), `CFBundleName` (short app title), `CFBundleExecutable` (see below), and `LSApplicationCategoryType` that you may want to change.
 - WebView.app/Contents/MacOS/WebView is the executable program, make sure `CFBundleExecutable` in Info.plist matches.
 - WebView.app/Contents/Resources/index.html is the file that will be opened
 - WebView.app/Contents/Resources/application_config.json is a JSON object with properties:
   - `title` (string) - window title
   - `width` (number) - window width
   - `height` (number) - window height
   - `background` (array of numbers) - a 4 number array of R, G, B [0-255], and A [0-1]
 - WebView.app/Contents/Resources/AppIcon.icns is the app icon
  - Delete WebView.app/Contents/Resources/Assets.car, otherwise AppIcon.icns gets ignored for some reason

WebView.app can be renamed, of course.

Zip WebView.app through context menu > compress, then upload to the server and update the large-assets manifest.
