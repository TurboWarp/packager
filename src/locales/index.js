import en from './en.json';

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
}

const messages = {
  en: unstructure(en)
};

export default messages;
