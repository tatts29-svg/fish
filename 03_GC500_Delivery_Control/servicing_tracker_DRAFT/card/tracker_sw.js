/* GC500 servicing tracker offline card. Author: Andrew Fisher.
   Scope is one token. Never caches API reads, writes, other cards or the main page. */
'use strict';
const CARD_PATH = new URL(self.location.href).pathname.replace(/\/sw\.js$/, '');
const CARD_URL = self.location.origin + CARD_PATH;
const CACHE = 'gc500-servicing-card-v1067:' + CARD_PATH;
function isCard(url) { return url.origin === self.location.origin && (url.pathname === CARD_PATH || url.pathname === CARD_PATH + '/') && !url.search; }
async function loadCard() {
  const response = await fetch(CARD_URL, { cache: 'no-store', credentials: 'same-origin', redirect: 'error' });
  try {
    const cache = await caches.open(CACHE);
    if (response.status === 404 || response.status === 410) await cache.delete(CARD_URL);
    if (!response.ok || !(response.headers.get('content-type') || '').includes('text/html')) return false;
    await cache.put(CARD_URL, response.clone());
    return true;
  } catch (_) { return false; } /* A cache failure cannot claim offline readiness. */
}
self.addEventListener('install', event => { event.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('message', event => {
  if (!event.data || event.data.type !== 'CACHE_CARD' || !event.source || !isCard(new URL(event.source.url))) return;
  event.waitUntil((async () => {
    let ready = false;
    try { ready = await loadCard(); }
    catch (_) { try { ready = !!(await caches.open(CACHE).then(cache => cache.match(CARD_URL))); } catch (_) {} }
    if (event.ports[0]) event.ports[0].postMessage({ ready });
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' || !isCard(new URL(event.request.url))) return;
  event.respondWith((async () => {
    let response;
    try { response = await fetch(event.request); }
    catch (error) {
      const saved = await caches.open(CACHE).then(cache => cache.match(CARD_URL));
      if (saved) return saved;
      throw error;
    }
    /* Cache writes are best effort. Storage denial/quota must never replace a valid online response. */
    try {
      const cache = await caches.open(CACHE);
      if (response.ok && (response.headers.get('content-type') || '').includes('text/html')) await cache.put(CARD_URL, response.clone());
      else if (response.status === 404 || response.status === 410) await cache.delete(CARD_URL);
    } catch (_) {}
    return response;
  })());
});
