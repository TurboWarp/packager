const type = (obj) => {
  if (obj === null) return 'null';
  if (Array.isArray(obj)) return 'array';
  if (typeof Blob !== 'undefined' && obj instanceof Blob) return 'blob';
  return typeof obj;
};

const merge = (into, from) => {
  const typeInto = type(into);
  const typeFrom = type(from);
  if (from === null && typeInto === 'blob') {
    return into;
  }
  if (typeInto !== typeFrom || typeInto === 'undefined') {
    return from;
  }
  if (typeInto === 'object') {
    for (const key of Object.keys(from)) {
      into[key] = merge(into[key], from[key]);
    }
    for (const key of Object.keys(into)) {
      if (!Object.prototype.hasOwnProperty.call(from, key)) {
        delete into[key];
      }
    }
  }
  return into;
};

export default merge;
