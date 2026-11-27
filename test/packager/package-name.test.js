import {test} from 'node:test';
import assert from 'node:assert';
import Packager from '../../src/packager/packager.js';

test('getDefaultPackageNameFromFileName', () => {
  assert.strictEqual(Packager.getDefaultPackageNameFromFileName('Appel v1.4.sb3'), 'appel-v');
  assert.strictEqual(Packager.getDefaultPackageNameFromFileName('  test  .sb3'), 'test');
  assert.strictEqual(Packager.getDefaultPackageNameFromFileName(' test 123 abc.sb'), 'test--abc');
  assert.strictEqual(Packager.getDefaultPackageNameFromFileName(' test 123 abc.sb.sb'), 'test--abc');
  assert.strictEqual(Packager.getDefaultPackageNameFromFileName('test 123!@#$%^&*()_+{}|:"<>?-=[]\\;\',/  xyz .sb2'), 'test----xyz');
  assert.strictEqual(Packager.getDefaultPackageNameFromFileName('.zip'), 'packaged-project');
});
