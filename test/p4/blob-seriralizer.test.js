import {recursivelyDeserializeBlobs, recursivelySerializeBlobs} from "../../src/p4/blob-serializer";

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
  expect(serialized).toEqual(object);
  expect(deserialized).toEqual(object);
});

test('cant serialize __isBlob', async () => {
  await expect(recursivelySerializeBlobs({
    __isBlob: true
  })).rejects.toEqual(new Error(`Can't serialize special key: __isBlob`));
});
