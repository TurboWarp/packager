import * as Scaffolding from './index';

if (window.Scaffolding) {
  throw new Error('Scaffolding already exists on this page');
}

window.Scaffolding = Scaffolding;
