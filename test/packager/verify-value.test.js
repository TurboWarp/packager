import {isValidListValue, isValidVariableValue} from "../../src/scaffolding/verify-value"

test('isValidVariableValue', () => {
  expect(isValidVariableValue('')).toBe(true);
  expect(isValidVariableValue('d')).toBe(true);
  expect(isValidVariableValue(0)).toBe(true);
  expect(isValidVariableValue(NaN)).toBe(true);
  expect(isValidVariableValue(Infinity)).toBe(true);
  expect(isValidVariableValue(true)).toBe(true);
  expect(isValidVariableValue(false)).toBe(true);
  expect(isValidVariableValue(null)).toBe(false);
  expect(isValidVariableValue(undefined)).toBe(false);
  expect(isValidVariableValue([])).toBe(false);
  expect(isValidVariableValue({})).toBe(false);
});

test('isValidListValue', () => {
  expect(isValidListValue('')).toBe(false);
  expect(isValidListValue('d')).toBe(false);
  expect(isValidListValue(0)).toBe(false);
  expect(isValidListValue(NaN)).toBe(false);
  expect(isValidListValue(Infinity)).toBe(false);
  expect(isValidListValue(true)).toBe(false);
  expect(isValidListValue(false)).toBe(false);
  expect(isValidListValue(null)).toBe(false);
  expect(isValidListValue(undefined)).toBe(false);
  expect(isValidListValue({})).toBe(false);
  expect(isValidListValue([])).toBe(true);
  expect(isValidListValue([1, 2, NaN, Infinity, '', 'a', false, true])).toBe(true);
  expect(isValidListValue([{}])).toBe(false);
  expect(isValidListValue([null])).toBe(false);
  expect(isValidListValue([undefined])).toBe(false);
  expect(isValidListValue(new Array(1))).toBe(false); // array with hole
  expect(isValidListValue(new Set())).toBe(false);
});
