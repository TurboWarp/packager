import P4 from './P4.svelte';

const app = new P4({
  target: document.getElementById('app')
});

document.body.setAttribute('p4-loaded', '');

// Forcibly unregister any old service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}
