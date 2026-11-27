import {test, mock} from 'node:test';
import assert from 'node:assert';
import Cloud from '../../src/scaffolding/cloud.js';

const cloudManager = () => new Cloud.CloudManager({
  vm: {
    runtime: {
      hasCloudData: () => true
    }
  }
});

const mockProvider = () => ({
  enable: () => {},
  handleUpdateVariable: mock.fn()
});

test('CloudManager providers and overrides', () => {
  const manager = cloudManager();
  const provider1 = mockProvider();
  const provider2 = mockProvider();
  assert.throws(() => manager.addProviderOverride('test', provider1), {message: 'Manager is not aware of this provider'});

  manager.addProvider(provider1);
  manager.addProvider(provider2);
  manager.updateVariable('test', '123');
  assert.strictEqual(provider1.handleUpdateVariable.mock.callCount(), 1);
  assert.strictEqual(provider2.handleUpdateVariable.mock.callCount(), 1);

  manager.addProviderOverride('test', provider1);
  manager.updateVariable('test', '456');
  assert.strictEqual(provider1.handleUpdateVariable.mock.callCount(), 2);
  assert.strictEqual(provider2.handleUpdateVariable.mock.callCount(), 1);

  manager.addProviderOverride('test2', null);
  manager.updateVariable('test2', '789');
  assert.strictEqual(provider1.handleUpdateVariable.mock.callCount(), 2);
  assert.strictEqual(provider2.handleUpdateVariable.mock.callCount(), 1);
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
    enable: mock.fn(),
    reload: mock.fn(),
    handleUpdateVariable: () => {}
  };
  // Providers don't need to implement reload
  const provider2 = {
    enable: mock.fn(),
    handleUpdateVariable: () => {}
  };
  manager.addProvider(provider1);
  manager.addProvider(provider2);
  assert.strictEqual(provider1.enable.mock.callCount(), 0);

  // Project without cloud data does nothing
  manager.projectReady();
  assert.strictEqual(provider1.enable.mock.callCount(), 0);
  assert.strictEqual(provider2.enable.mock.callCount(), 0);

  // Project with cloud data enables providers
  hasCloudData = true;
  manager.projectReady();
  assert.strictEqual(provider1.enable.mock.callCount(), 1);
  assert.strictEqual(provider2.enable.mock.callCount(), 1);
  assert.strictEqual(provider1.reload.mock.callCount(), 0);

  // Loading another project with cloud data does not enable again
  manager.projectReady();
  assert.strictEqual(provider1.enable.mock.callCount(), 1);
  assert.strictEqual(provider2.enable.mock.callCount(), 1);
  assert.strictEqual(provider1.reload.mock.callCount(), 1);

  // Loading project without cloud data does nothing
  hasCloudData = false;
  manager.projectReady();
  assert.strictEqual(provider1.reload.mock.callCount(), 1);

  // Providers added after being enabled are enabled immediately
  const provider3 = {
    enable: mock.fn(),
    handleUpdateVariable: () => {}
  };
  manager.addProvider(provider3);
  assert.strictEqual(provider3.enable.mock.callCount(), 1);
});
