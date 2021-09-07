// These will be replaced at build-time by generate-service-worker-plugin.js
const ASSETS = [/* __ASSETS__ */];
const CACHE_NAME = '__CACHE_NAME__';
const ENV = '__ENV__';

const base = location.pathname.substr(0, location.pathname.indexOf('sw.js'));

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(i => i !== CACHE_NAME).map(i => caches.delete(i))))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  url.search = '';
  const pathname = url.pathname;
  const relativePathname = pathname.substr(base.length);
  const isImmutable = ENV === 'production' && !!relativePathname && ASSETS.includes(relativePathname);
  if (isImmutable) {
    event.respondWith(
      caches.match(new Request(url)).then((res) => res || fetch(event.request))
    );
  }
});
