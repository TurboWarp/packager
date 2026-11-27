import {test} from 'node:test';
import assert from 'node:assert';
import Packager from "../../src/packager/packager.js";

test('DEFAULT_OPTIONS', () => {
  assert.strictEqual(Packager.usesUnsafeOptions(Packager.DEFAULT_OPTIONS()), false);
});

test('custom JS', () => {
  const options = Packager.DEFAULT_OPTIONS();
  options.custom.js = 'alert(1)';
  assert.strictEqual(Packager.usesUnsafeOptions(options), true);
});

test('custom CSS', () => {
  const options = Packager.DEFAULT_OPTIONS();
  options.custom.css = 'body { display: none; }';
  assert.strictEqual(Packager.usesUnsafeOptions(options), true);
});

test('unsafe cloud behaviors', () => {
  const options = Packager.DEFAULT_OPTIONS();
  options.cloudVariables.unsafeCloudBehaviors = true;
  assert.strictEqual(Packager.usesUnsafeOptions(options), true);
});
