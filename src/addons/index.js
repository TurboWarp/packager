import gamepad from './gamepad';
import pointerlock from './pointerlock';
import specialCloudBehaviors from './special-cloud-behaviors';
import unsafeCloudBehaviors from './unsafe-cloud-behaviors';
import pause from './pause';

const run = (scaffolding, options) => {
  if (options.gamepad) gamepad(scaffolding);
  if (options.pointerlock) pointerlock(scaffolding);
  if (options.specialCloudBehaviors) specialCloudBehaviors(scaffolding);
  if (options.unsafeCloudBehaviors) unsafeCloudBehaviors(scaffolding);
  if (options.pause) pause(scaffolding);
};

window.ScaffoldingAddons = {
  run
};
