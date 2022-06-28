// Parses and generates Apple Info.plist files
// Example file:
/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>BuildMachineOSBuild</key>
  <string>20F71</string>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>WebView</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>CFBundleIconName</key>
  <string>AppIcon</string>
  <key>CFBundleIdentifier</key>
  <string>org.turbowarp.webviews.mac</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>WebView</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>CFBundleSupportedPlatforms</key>
  <array>
    <string>MacOSX</string>
  </array>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>DTCompiler</key>
  <string>com.apple.compilers.llvm.clang.1_0</string>
  <key>DTPlatformBuild</key>
  <string>12E507</string>
  <key>DTPlatformName</key>
  <string>macosx</string>
  <key>DTPlatformVersion</key>
  <string>11.3</string>
  <key>DTSDKBuild</key>
  <string>20E214</string>
  <key>DTSDKName</key>
  <string>macosx11.3</string>
  <key>DTXcode</key>
  <string>1251</string>
  <key>DTXcodeBuild</key>
  <string>12E507</string>
  <key>LSApplicationCategoryType</key>
  <string>public.app-category.games</string>
  <key>LSMinimumSystemVersion</key>
  <string>10.12</string>
  <key>NSMainStoryboardFile</key>
  <string>Main</string>
  <key>NSPrincipalClass</key>
  <string>NSApplication</string>
  <key>ExampleBooleanTrue</key>
  <true/>
  <key>ExampleBooleanFalse</key>
  <false/>
</dict>
</plist>
*/

const xmlToValue = (node) => {
  if (node.tagName === 'dict') {
    const result = {};
    for (const child of node.children) {
      if (child.tagName === 'key') {
        result[child.textContent] = xmlToValue(child.nextElementSibling);
      }
    }
    return result;
  } else if (node.tagName === 'array') {
    return Array.from(node.children).map(xmlToValue);
  } else if (node.tagName === 'string') {
    return node.textContent;
  } else if (node.tagName === 'true') {
    return true;
  } else if (node.tagName === 'false') {
    return false;
  }
  console.warn('unknown plist xml', node);
  return null;
};

const valueToXml = (doc, value) => {
  if (Array.isArray(value)) {
    const node = doc.createElement('array');
    for (const listItem of value) {
      node.appendChild(valueToXml(doc, listItem));
    }
    return node;
  } else if (typeof value === 'object') {
    const node = doc.createElement('dict');
    for (const [key, keyValue] of Object.entries(value)) {
      const keyNode = doc.createElement('key');
      keyNode.textContent = key;
      const valueNode = valueToXml(doc, keyValue);
      node.appendChild(keyNode);
      node.appendChild(valueNode);
    }
    return node;
  } else if (typeof value === 'string') {
    const node = doc.createElement('string');
    node.textContent = value;
    return node;
  } else if (typeof value === 'boolean') {
    const node = doc.createElement(value.toString());
    return node;
  }
  console.warn('unknown plist value', value);
  return valueToXml(doc, `${value}`);
};

export const parsePlist = (string) => {
  const xml = new DOMParser().parseFromString(string, 'text/xml');
  const rootNode = xml.children[0];
  const rootDict = rootNode.children[0];
  return xmlToValue(rootDict);
};

export const generatePlist = (values) => {
  const xml = document.implementation.createDocument(null, "plist");
  const rootNode = xml.documentElement;
  rootNode.setAttribute('version', '1.0');
  rootNode.appendChild(valueToXml(xml, values));
  const serialized = new XMLSerializer().serializeToString(xml);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
${serialized}`;
};
