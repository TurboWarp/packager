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

test('CloudManager enables providers once and notifies them of reloads', () => {
  let hasCloudData = false;
  const manager = new Cloud.CloudManager({
    vm: {
      runtime: {
        hasCloudData: () => hasCloudData
      }
    }
  });
  const provider1 = {
    enable: jest.fn(),
    reload: jest.fn(),
    handleUpdateVariable: () => {}
  };
  // Providers don't need to implement reload
  const provider2 = {
    enable: jest.fn(),
    handleUpdateVariable: () => {}
  };
  manager.addProvider(provider1);
  manager.addProvider(provider2);
  expect(provider1.enable).toHaveBeenCalledTimes(0);

  // Project without cloud data does nothing
  manager.projectReady();
  expect(provider1.enable).toHaveBeenCalledTimes(0);
  expect(provider2.enable).toHaveBeenCalledTimes(0);

  // Project with cloud data enables providers
  hasCloudData = true;
  manager.projectReady();
  expect(provider1.enable).toHaveBeenCalledTimes(1);
  expect(provider2.enable).toHaveBeenCalledTimes(1);
  expect(provider1.reload).toHaveBeenCalledTimes(0);

  // Loading another project with cloud data does not enable again
  manager.projectReady();
  expect(provider1.enable).toHaveBeenCalledTimes(1);
  expect(provider2.enable).toHaveBeenCalledTimes(1);
  expect(provider1.reload).toHaveBeenCalledTimes(1);

  // Loading project without cloud data does nothing
  hasCloudData = false;
  manager.projectReady();
  expect(provider1.reload).toHaveBeenCalledTimes(1);

  // Providers added after being enabled are enabled immediately
  const provider3 = {
    enable: jest.fn(),
    handleUpdateVariable: () => {}
  };
  manager.addProvider(provider3);
  expect(provider3.enable).toHaveBeenCalledTimes(1);
});
