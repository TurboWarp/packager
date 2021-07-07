import {readable} from 'svelte/store';

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

const getLocalMessages = () => {
  let language = navigator.language;
  if (allMessages[language]) return allMessages[language]();
  language = language.split('-')[0];
  if (allMessages[language]) return allMessages[language]();
  return {};
}

const englishMessages = unstructure(require('./en.json'));
const allMessages = {
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
const localMessages = getLocalMessages();

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

/**
 * @param {string} n Message ID
 * @returns {string} Translated message
 */
const translate = (n) => getProperty(localMessages, n) || getProperty(englishMessages, n) || n;

const exportedTranslate = readable(translate);

export {
  exportedTranslate as _
};
