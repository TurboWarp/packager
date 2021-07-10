import {derived} from 'svelte/store';
import writablePersistentStore from '../packager/persistent-store';
import localeNames from './locale-names.json';

const unstructure = (messages) => {
  for (const key of Object.keys(messages)) {
    const value = messages[key];
    if (typeof value === 'object') {
      if (value.string) {
        messages[key] = value.string;
      } else {
        unstructure(value);
      }
    }
  }
  return messages;
};

const englishMessages = unstructure(require('./en.json'));
const allMessages = {
  en: () => englishMessages,
  // Generated code:
  /*===*/
  "de": () => require("./de.json"),
  "es": () => require("./es.json"),
  "fi": () => require("./fi.json"),
  "fr": () => require("./fr.json"),
  "it": () => require("./it.json"),
  "ja": () => require("./ja.json"),
  "ko": () => require("./ko.json"),
  "nb": () => require("./nb.json"),
  "nl": () => require("./nl.json"),
  "pl": () => require("./pl.json"),
  "pt": () => require("./pt.json"),
  "ro": () => require("./ro.json"),
  "ru": () => require("./ru.json"),
  "sl": () => require("./sl.json"),
  "sv": () => require("./sv.json"),
  "tr": () => require("./tr.json"),
  "zh-cn": () => require("./zh-cn.json"),
  "zh-tw": () => require("./zh-tw.json"),
  /*===*/
};

const supportedLocales = {};
// Iterate over localeNames to preserve order
for (const key of Object.keys(localeNames)) {
  if (allMessages[key]) {
    supportedLocales[key] = localeNames[key];
  }
}

const getInitialLocale = () => [
  navigator.language.toLowerCase(),
  navigator.language.toLowerCase().split('-')[0]
].find(i => allMessages[i]) || 'en';

const locale = writablePersistentStore('P4.locale', getInitialLocale());
locale.subscribe((locale) => {
  document.documentElement.lang = locale;
});

const getProperty = (obj, id) => {
  const parts = id.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    obj = obj[parts[i]];
    if (!obj) {
      return null;
    }
  }
  return obj[parts[parts.length - 1]] || null;
};

const translate = derived(locale, (locale) => {
  const localMessages = allMessages[locale]();
  /**
   * @param {string} id Message ID
   * @returns {string} Translated message
   */
  return (id) => {
    return getProperty(localMessages, id) || getProperty(englishMessages, id) || id;
  };
});

export {
  locale,
  supportedLocales,
  translate as _
};
