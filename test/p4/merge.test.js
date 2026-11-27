import {test} from 'node:test';
import assert from 'node:assert';
import merge from '../../src/p4/merge.js';

test('defaults', () => {
  assert.deepStrictEqual(merge({
    a: {
      b: {
        c: 3,
        d: ['123', '456']
      }
    },
    test: ''
  }, {
    a: {
      b: {
        c: 4,
        d: []
      }
    },
    test: '3'
  }), {
    a: {
      b: {
        c: 3,
        d: ['123', '456']
      }
    },
    test: ''
  });
  assert.deepStrictEqual(merge({
    cloudVariables: {
      filter: ['test1', 'test2']
    }
  }, {
    cloudVariables: {
      filter: []
    }
  }), {
    cloudVariables: {
      filter: ['test1', 'test2']
    }
  });
});

test('type mismatch', () => {
  assert.deepStrictEqual(merge(undefined, {a: 2}), {a: 2});
  assert.deepStrictEqual(merge([], {a: 2}), {a: 2});
  assert.deepStrictEqual(merge(null, {a: 2}), {a: 2});
  assert.deepStrictEqual(merge(1, {a: 2}), {a: 2});
  assert.deepStrictEqual(merge('2', {a: 2}), {a: 2});
  assert.deepStrictEqual(merge(true, {a: 2}), {a: 2});
  assert.deepStrictEqual(merge({
    a: []
  }, {
    a: 3
  }), {
    a: 3
  });
});

test('removes extra', () => {
  assert.deepStrictEqual(merge({
    a: 1,
    b: 2
  }, {
    a: 3
  }), {
    a: 1
  });
});
