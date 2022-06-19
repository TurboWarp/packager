import Packager from '../../src/packager/packager';

test('getWindowTitleFromFileName', () => {
  expect(Packager.getWindowTitleFromFileName('Test123.sb')).toBe('Test123');
  expect(Packager.getWindowTitleFromFileName('Test 123.sb2')).toBe('Test 123');
  expect(Packager.getWindowTitleFromFileName('Test123  .sb3')).toBe('Test123');
  expect(Packager.getWindowTitleFromFileName(' Test123.zip')).toBe('Test123');
  expect(Packager.getWindowTitleFromFileName('Test123 ')).toBe('Test123');
  expect(Packager.getWindowTitleFromFileName('.sb3')).toBe('Packaged Project');
  expect(Packager.getWindowTitleFromFileName('.sb2')).toBe('Packaged Project');
  expect(Packager.getWindowTitleFromFileName('.')).toBe('Packaged Project');
  expect(Packager.getWindowTitleFromFileName('')).toBe('Packaged Project');
  expect(Packager.getWindowTitleFromFileName('Appel v1.4.sb3')).toBe('Appel v1.4');
});
