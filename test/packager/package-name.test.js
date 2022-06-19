import Packager from '../../src/packager/packager';

test('getDefaultPackageNameFromFileName', () => {
  expect(Packager.getDefaultPackageNameFromFileName('Appel v1.4.sb3')).toBe('appel-v');
  expect(Packager.getDefaultPackageNameFromFileName('  test  .sb3')).toBe('test');
  expect(Packager.getDefaultPackageNameFromFileName(' test 123 abc.sb')).toBe('test--abc');
  expect(Packager.getDefaultPackageNameFromFileName(' test 123 abc.sb.sb')).toBe('test--abc');
  expect(Packager.getDefaultPackageNameFromFileName('test 123!@#$%^&*()_+{}|:"<>?-=[]\\;\',/  xyz .sb2')).toBe('test----xyz');
  expect(Packager.getDefaultPackageNameFromFileName('.zip')).toBe('packaged-project');
});
