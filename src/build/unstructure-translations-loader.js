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

module.exports = function (source) {
  const parsed = JSON.parse(source);
  unstructure(parsed);
  return JSON.stringify(parsed);
};
