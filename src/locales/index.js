import {getLocaleFromNavigator} from 'svelte-i18n';

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

const STORAGE_KEY = 'p4:initialLocale';
const initialLocaleFromNavigator = getLocaleFromNavigator();

export const getInitialLocale = () => {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    return local;
  }
  return initialLocaleFromNavigator;
};

export const setInitialLocale = (locale) => {
  if (locale === initialLocaleFromNavigator) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, locale);
  }
};

const messages = {
  en: unstructure(require('./en.json')),
  // Generated code:
  /*===*/
  "de": require("./de.json"),
  "es": require("./es.json"),
  "fi": require("./fi.json"),
  "fr": require("./fr.json"),
  "it": require("./it.json"),
  "ja": require("./ja.json"),
  "ko": require("./ko.json"),
  "nb": require("./nb.json"),
  "nl": require("./nl.json"),
  "pl": require("./pl.json"),
  "pt": require("./pt.json"),
  "ro": require("./ro.json"),
  "ru": require("./ru.json"),
  "sl": require("./sl.json"),
  "sv": require("./sv.json"),
  "tr": require("./tr.json"),
  "zh-cn": require("./zh-cn.json"),
  "zh-tw": require("./zh-tw.json"),
  /*===*/
};

export default messages;
