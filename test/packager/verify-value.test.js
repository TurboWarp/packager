import {test} from 'node:test';
import assert from 'node:assert';
import {isValidListValue, isValidVariableValue} from "../../src/scaffolding/verify-value.js"

test('isValidVariableValue', () => {
  assert.strictEqual(isValidVariableValue(''), true);
  assert.strictEqual(isValidVariableValue('d'), true);
  assert.strictEqual(isValidVariableValue(0), true);
  assert.strictEqual(isValidVariableValue(NaN), true);
  assert.strictEqual(isValidVariableValue(Infinity), true);
  assert.strictEqual(isValidVariableValue(true), true);
  assert.strictEqual(isValidVariableValue(false), true);
  assert.strictEqual(isValidVariableValue(null), false);
  assert.strictEqual(isValidVariableValue(undefined), false);
  assert.strictEqual(isValidVariableValue([]), false);
  assert.strictEqual(isValidVariableValue({}), false);
});

test('isValidListValue', () => {
  assert.strictEqual(isValidListValue(''), false);
  assert.strictEqual(isValidListValue('d'), false);
  assert.strictEqual(isValidListValue(0), false);
  assert.strictEqual(isValidListValue(NaN), false);
  assert.strictEqual(isValidListValue(Infinity), false);
  assert.strictEqual(isValidListValue(true), false);
  assert.strictEqual(isValidListValue(false), false);
  assert.strictEqual(isValidListValue(null), false);
  assert.strictEqual(isValidListValue(undefined), false);
  assert.strictEqual(isValidListValue({}), false);
  assert.strictEqual(isValidListValue([]), true);
  assert.strictEqual(isValidListValue([1, 2, NaN, Infinity, '', 'a', false, true]), true);
  assert.strictEqual(isValidListValue([{}]), false);
  assert.strictEqual(isValidListValue([null]), false);
  assert.strictEqual(isValidListValue([undefined]), false);
  assert.strictEqual(isValidListValue(new Array(1)), false); // array with hole
  assert.strictEqual(isValidListValue(new Set()), false);
});
