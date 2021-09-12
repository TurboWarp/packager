const fs = require('fs');
const path = require('path');

const languageNames = require('scratch-translate-extension-languages');
const menuMap = languageNames.menuMap;
for (const languageCode of Object.keys(menuMap)) {
  // Keep a language's own translation as its used by the "language" block.
  menuMap[languageCode] = menuMap[languageCode].filter(({code}) => code === languageCode);
}
delete languageNames.spokenLanguages;

fs.writeFileSync(path.join(__dirname, 'languages.json'), JSON.stringify(languageNames));
