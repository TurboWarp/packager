import gamepad from './gamepad';
import pointerlock from './pointerlock';

const run = (scaffolding, options) => {
  if (options.gamepad) gamepad(scaffolding);
  if (options.pointerlock) pointerlock(scaffolding);
};

window.ScaffoldingAddons = {
  run
};
