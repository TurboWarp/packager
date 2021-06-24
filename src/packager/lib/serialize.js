const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * @returns {*|null} null means "do not store"
 */
const serialize = (value, defaultValue) => {
  // Never serialize blobs.
  // Check for Blob existing because this can run in node
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
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
  if (value === defaultValue) {
    return null;
  }
  return value;
};

export default serialize;
