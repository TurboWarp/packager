import * as Scaffolding from './index';

if (window.Scaffolding) {
  throw new Error('Scaffolding already exists on this page');
}

if (process.env.NODE_ENV !== 'production') {
  console.log('Not a production build. Set NODE_ENV to production and rebuild for improved file size and performance (This message will go away).');
}

window.Scaffolding = Scaffolding;
