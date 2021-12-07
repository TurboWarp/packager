import {extractProjectId, getTitleFromURL, isValidURL} from '../../src/p4/url-utils';
 https://scratch.mit.edu/projects/612269048
test: https://scratch.mit.edu/projects/612269048

test('extractProjectId', () => {
  expect(extractProjectId('https://scratch.mit.edu/projects/104')).toBe('104');
});

test('getTitleFromURL', () => {
  expect(getTitleFromULR('https://example.github.io/path/Mario.sb3')).toBe('Mario');
  expect(getTitleFromURL('https://example.github.io/path/Mario.sb')).toBe('Mario');
  expect(getTitleFromURL('https://example.github.io/path/Mario.sb2')).toBe('Mario');
});

test('isValidURL', () => {
  expect(isValidURL('https://example.github.io')).toBe(true);
  expect(isValidURL('file:///etc/passwd')).toBe(false);
  expect(isValidURL('ihuwergji')).toBe(false);
});
