import P4 from './P4.svelte';
import serviceWorker from '!!file-loader?name=sw.js!./sw.js';
import './analytics';

const app = new P4({
  target: document.getElementById('app')
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(serviceWorker)
    .then(() => {
      console.log('SW registered');
    }).catch((error) => {
      console.log('SW error', error);
    });
}
