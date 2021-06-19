const deepClone = (obj) => {
  if (obj instanceof Blob) {
    return obj;
  }
  if (Array.isArray(obj)) {
    const result = [];
    for (const value of obj) {
      result.push(deepClone(value));
    }
    return result;
  }
  if (obj && typeof obj === 'object') {
    // TODO: there's probably some prototype pollution in here
    const result = {};
    for (const key of Object.keys(obj)) {
      result[key] = deepClone(obj[key]);
    }
    return result;
  }
  // Primitive type
  return obj;
};

export default deepClone;
