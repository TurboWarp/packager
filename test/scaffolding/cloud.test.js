import Cloud from '../../src/scaffolding/cloud';

const cloudManager = () => new Cloud.CloudManager({
  vm: {
    runtime: {
      hasCloudData: () => true
    }
  }
});

const mockProvider = () => ({
  enable: () => {},
  handleUpdateVariable: jest.fn()
});

test('CloudManager providers and overrides', () => {
  const manager = cloudManager();
  const provider1 = mockProvider();
  const provider2 = mockProvider();
  expect(() => manager.addProviderOverride('test', provider1)).toThrow('Manager is not aware of this provider');

  manager.addProvider(provider1);
  manager.addProvider(provider2);
  manager.updateVariable('test', '123');
  expect(provider1.handleUpdateVariable).toHaveBeenCalledTimes(1);
  expect(provider2.handleUpdateVariable).toHaveBeenCalledTimes(1);

  manager.addProviderOverride('test', provider1);
  manager.updateVariable('test', '456');
  expect(provider1.handleUpdateVariable).toHaveBeenCalledTimes(2);
  expect(provider2.handleUpdateVariable).toHaveBeenCalledTimes(1);

  manager.addProviderOverride('test2', null);
  manager.updateVariable('test2', '789');
  expect(provider1.handleUpdateVariable).toHaveBeenCalledTimes(2);
  expect(provider2.handleUpdateVariable).toHaveBeenCalledTimes(1);
});
