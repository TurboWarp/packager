import gamepad from './gamepad/index.js';
import pointerlock from './pointerlock.js';
import specialCloudBehaviors from './special-cloud-behaviors.js';
import unsafeCloudBehaviors from './unsafe-cloud-behaviors.js';
import pause from './pause.js';

const run = (scaffolding, options) => {
  const api = {
    scaffolding,
    options
  };

  if (options.gamepad) gamepad(api);
  if (options.pointerlock) pointerlock(api);
  if (options.specialCloudBehaviors) specialCloudBehaviors(api);
  if (options.unsafeCloudBehaviors) unsafeCloudBehaviors(api);
  if (options.pause) pause(api);
};

window.ScaffoldingAddons = {
  run
};
