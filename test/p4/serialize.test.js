import {test} from 'node:test';
import assert from 'node:assert';
import serialize from '../../src/p4/serialize.js';

global.Blob = class Blob {};

test('no changes returns null', () => {
  assert.strictEqual(serialize({
    a: 2
  }, {
    a: 2
  }), null);
});

test('does not serialize missing keys', () => {
  assert.deepStrictEqual(serialize({
    a: 1,
    b: 2
  }, {
    a: 2
  }), {
    a: 1
  })
});

test('does not care about types', () => {
  assert.deepStrictEqual(serialize({
    a: '1'
  }, {
    a: []
  }), {
    a: '1'
  })
});

test('arrays', () => {
  assert.deepStrictEqual(serialize({
    a: [1]
  }, {
    a: [1]
  }), null);
  assert.deepStrictEqual(serialize({
    a: [2]
  }, {
    a: [1]
  }), {
    a: [2]
  });
});

test('does not serialize blobs', () => {
  assert.deepStrictEqual(serialize({
    a: new Blob(['Hello world']),
    b: 2
  }, {
    a: null,
    b: 0
  }), {
    b: 2
  });
});

test('deep', () => {
  assert.deepStrictEqual(serialize({
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
  }), {
    cloud: {
      test: {
        a: 2
      }
    }
  });
});

test('unexpected array', () => {
  assert.strictEqual(serialize({
    a: [1]
  }, {
    a: 1
  }), null);
});
