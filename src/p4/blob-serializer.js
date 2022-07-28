import {readAsArrayBuffer} from '../common/readers';

const BLOB_IDENTIFIER = '__isBlob';

const isObjectOrArray = (value) => value !== null && typeof value === 'object';

/**
 * Generate an object where any child properties of type Blob will have their data inlined.
 * @param {unknown} object 
 * @returns {Promise<unknown>}
 */
const recursivelySerializeBlobs = async (object) => {
  if (Array.isArray(object)) {
    return Promise.all(object.map(recursivelySerializeBlobs));
  }
  const result = {};
  for (const key of Object.keys(object)) {
    const value = object[key];
    if (value instanceof Blob) {
      const binaryData = await readAsArrayBuffer(value);
      result[key] = {
        [BLOB_IDENTIFIER]: true,
        type: value.type,
        name: value.name || '',
        data: Array.from(new Uint8Array(binaryData))
      };
    } else if (isObjectOrArray(value)) {
      result[key] = await recursivelySerializeBlobs(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

/**
 * Generate an object where any child properties inlined by recursivelySerializeBlobs will be converted
 * back to a blob.
 * @param {unknown} object
 * @returns {unknown}
 */
const recursivelyDeserializeBlobs = (object) => {
  if (Array.isArray(object)) {
    return object.map(recursivelyDeserializeBlobs);
  }
  const result = {};
  for (const key of Object.keys(object)) {
    const value = object[key];
    if (isObjectOrArray(value)) {
      if (value[BLOB_IDENTIFIER]) {
        const blob = new Blob([new Uint8Array(value.data)], {
          type: value.type
        });
        blob.name = value.name;
        result[key] = blob;
      } else {
        result[key] = recursivelyDeserializeBlobs(value);
      }
    } else {
      result[key] = value;
    }
  }
  return result;
};

export {
  recursivelySerializeBlobs,
  recursivelyDeserializeBlobs
};
