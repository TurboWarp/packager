import serialize from '../../src/p4/serialize';

global.Blob = class Blob {};

test('no changes returns null', () => {
  expect(serialize({
    a: 2
  }, {
    a: 2
  })).toBe(null);
});

test('does not serialize missing keys', () => {
  expect(serialize({
    a: 1,
    b: 2
  }, {
    a: 2
  })).toStrictEqual({
    a: 1
  })
});

test('does not care about types', () => {
  expect(serialize({
    a: '1'
  }, {
    a: []
  })).toStrictEqual({
    a: '1'
  })
});

test('arrays', () => {
  expect(serialize({
    a: [1]
  }, {
    a: [1]
  })).toStrictEqual(null);
  expect(serialize({
    a: [2]
  }, {
    a: [1]
  })).toStrictEqual({
    a: [2]
  });
});

test('does not serialize blobs', () => {
  expect(serialize({
    a: new Blob(['Hello world']),
    b: 2
  }, {
    a: null,
    b: 0
  })).toStrictEqual({
    b: 2
  });
});

test('deep', () => {
  expect(serialize({
    cloud: {
      test: {
        a: 2
      },
      b: 1
    },
    c: '3'
  }, {
    cloud: {
      test: {
        a: 3,
        z: 9
      }
    }
  })).toStrictEqual({
    cloud: {
      test: {
        a: 2
      }
    }
  });
});

test('unexpected array', () => {
  expect(serialize({
    a: [1]
  }, {
    a: 1
  })).toBe(null);
});
