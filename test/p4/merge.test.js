import merge from '../../src/p4/merge';

test('defaults', () => {
  expect(merge({
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
  })).toStrictEqual({
    a: {
      b: {
        c: 3,
        d: ['123', '456']
      }
    },
    test: ''
  });
  expect(merge({
    cloudVariables: {
      filter: ['test1', 'test2']
    }
  }, {
    cloudVariables: {
      filter: []
    }
  })).toStrictEqual({
    cloudVariables: {
      filter: ['test1', 'test2']
    }
  });
});

test('type mismatch', () => {
  expect(merge(undefined, {a: 2})).toStrictEqual({a: 2});
  expect(merge([], {a: 2})).toStrictEqual({a: 2});
  expect(merge(null, {a: 2})).toStrictEqual({a: 2});
  expect(merge(1, {a: 2})).toStrictEqual({a: 2});
  expect(merge('2', {a: 2})).toStrictEqual({a: 2});
  expect(merge(true, {a: 2})).toStrictEqual({a: 2});
  expect(merge({
    a: []
  }, {
    a: 3
  })).toStrictEqual({
    a: 3
  });
});

test('removes extra', () => {
  expect(merge({
    a: 1,
    b: 2
  }, {
    a: 3
  })).toStrictEqual({
    a: 1
  });
});
