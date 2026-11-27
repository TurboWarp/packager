import {test} from 'node:test';
import assert from 'node:assert';
import Packager from '../../src/packager/packager.js';

test('getWindowTitleFromFileName', () => {
  assert.strictEqual(Packager.getWindowTitleFromFileName('Test123.sb'), 'Test123');
  assert.strictEqual(Packager.getWindowTitleFromFileName('Test 123.sb2'), 'Test 123');
  assert.strictEqual(Packager.getWindowTitleFromFileName('Test123  .sb3'), 'Test123');
  assert.strictEqual(Packager.getWindowTitleFromFileName(' Test123.zip'), 'Test123');
  assert.strictEqual(Packager.getWindowTitleFromFileName('Test123 '), 'Test123');
  assert.strictEqual(Packager.getWindowTitleFromFileName('.sb3'), 'Packaged Project');
  assert.strictEqual(Packager.getWindowTitleFromFileName('.sb2'), 'Packaged Project');
  assert.strictEqual(Packager.getWindowTitleFromFileName('.'), 'Packaged Project');
  assert.strictEqual(Packager.getWindowTitleFromFileName(''), 'Packaged Project');
  assert.strictEqual(Packager.getWindowTitleFromFileName('Appel v1.4.sb3'), 'Appel v1.4');
});
