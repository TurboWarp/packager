import optimizeSb3 from '../../src/packager/minify/sb3';

const clone = (obj) => JSON.parse(JSON.stringify(obj));

test('does not throw if project does not have monitors', () => {
  const data = {
    targets: [],
    meta: {}
  };
  optimizeSb3(clone(data));
});
