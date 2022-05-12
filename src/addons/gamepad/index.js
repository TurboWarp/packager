import gamepadUserscript from './userscript.js';
import gamepadUserstyle from '!raw-loader!./style.css'

const addStylesheet = (css) => {
  const stylesheet = document.createElement('style');
  stylesheet.textContent = css;
  document.head.appendChild(stylesheet);
};

const run = ({ scaffolding, options }) => {
  gamepadUserscript(scaffolding, options.pointerlock);
  addStylesheet(gamepadUserstyle);
};

export default run;
