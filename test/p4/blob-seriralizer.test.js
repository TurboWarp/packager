import {test} from 'node:test';
import assert from 'node:assert';
import {recursivelyDeserializeBlobs, recursivelySerializeBlobs} from "../../src/p4/blob-serializer.js";

global.Blob = class {};

test('basic cloning functionality', async () => {
  const object = {
    a: {
      b: [
        {
          c: 3,
          d: "test"
        }
      ],
      z: [
        'abcdef'
      ]
    },
    e: true
  };
  const serialized = await recursivelySerializeBlobs(object);
  const deserialized = recursivelyDeserializeBlobs(serialized);
  assert.deepStrictEqual(serialized, object);
  assert.deepStrictEqual(deserialized, object);
});

test('cant serialize __isBlob', async () => {
  await assert.rejects(recursivelySerializeBlobs({
    __isBlob: true
  }), new Error(`Can't serialize special key: __isBlob`));
});
