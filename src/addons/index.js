import gamepadUserscript from './gamepad/userscript.js';
import gamepadUserstyle from '!raw-loader!./gamepad/style.css'

const addStylesheet = (css) => {
  const stylesheet = document.createElement('style');
  stylesheet.textContent = css;
  document.head.appendChild(stylesheet);
};

const run = (scaffolding) => {
  gamepadUserscript(scaffolding);
  addStylesheet(gamepadUserstyle);
};

window.ScaffoldingAddons = {
  run
};
