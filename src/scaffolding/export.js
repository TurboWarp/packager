import * as Scaffolding from './scaffolding';

if (window.Scaffolding) {
  throw new Error('Scaffolding already exists on this page');
}

if (process.env.NODE_ENV !== 'production') {
  console.log('This is not a production build. Set NODE_ENV to production or use `npm run build-prod` for improved file size and performance (This message will go away).');
}

window.Scaffolding = Scaffolding;
