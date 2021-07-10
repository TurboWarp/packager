const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

const areArraysEqual = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

/**
 * @returns {*|null} null means "do not store"
 */
const serialize = (value, defaultValue) => {
  // Never serialize blobs.
  if (value instanceof Blob) {
    return null;
  }
  if (isObject(defaultValue)) {
    const result = {};
    for (const key of Object.keys(defaultValue)) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        continue;
      }
      const serialized = serialize(value[key], defaultValue[key]);
      if (serialized !== null) {
        result[key] = serialized;
      }
    }
    if (Object.keys(result).length === 0) {
      return null;
    }
    return result;
  }
  if (Array.isArray(value)) {
    if (Array.isArray(defaultValue)) {
      if (areArraysEqual(value, defaultValue)) {
        return null;
      }
    } else {
      return null;
    }
  }
  if (value === defaultValue) {
    return null;
  }
  return value;
};

export default serialize;
