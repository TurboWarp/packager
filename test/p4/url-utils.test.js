import {test} from 'node:test';
import assert from 'node:assert';
import {extractProjectId, getTitleFromURL, isValidURL} from '../../src/p4/url-utils.js';

test('extractProjectId', () => {
  assert.strictEqual(extractProjectId('https://scratch.mit.edu/projects/104'), '104');
});

test('getTitleFromURL', () => {
  assert.strictEqual(getTitleFromURL('https://example.github.io/path/Mario.sb3'), 'Mario');
  assert.strictEqual(getTitleFromURL('https://example.github.io/path/Mario.sb'), 'Mario');
  assert.strictEqual(getTitleFromURL('https://example.github.io/path/Mario.sb2'), 'Mario');
});

test('isValidURL', () => {
  assert.strictEqual(isValidURL('https://example.github.io'), true);
  assert.strictEqual(isValidURL('file:///etc/passwd'), false);
  assert.strictEqual(isValidURL('ihuwergji'), false);
});
