import gamepad from './gamepad';
import pointerlock from './pointerlock';
import specialCloudBehaviors from './special-cloud-behaviors';
import unsafeCloudBehaviors from './unsafe-cloud-behaviors';
import pause from './pause';

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
