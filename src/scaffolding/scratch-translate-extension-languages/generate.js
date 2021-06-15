const fs = require('fs');
const path = require('path');

const languageNames = require('scratch-translate-extension-languages');
const menuMap = languageNames.menuMap;
for (const key of Object.keys(menuMap)) {
  menuMap[key] = [{code: '', name: ''}];
}
languageNames.spokenLanguages = {};

fs.writeFileSync(path.join(__dirname, 'languages.json'), JSON.stringify(languageNames));
