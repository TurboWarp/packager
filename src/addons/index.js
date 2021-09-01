import gamepad from './gamepad';
import pointerlock from './pointerlock';
import specialCloudBehaviors from './special-cloud-behaviors';

const run = (scaffolding, options) => {
  if (options.gamepad) gamepad(scaffolding);
  if (options.pointerlock) pointerlock(scaffolding);
  if (options.specialCloudBehaviors) specialCloudBehaviors(scaffolding);
};

window.ScaffoldingAddons = {
  run
};
