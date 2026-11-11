/* EMPIRE - service worker: permette di giocare anche offline.
   Strategia: prima la rete (così gli aggiornamenti arrivano subito), poi la copia salvata. */
const CACHE = 'empire-v9';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'css/soft.css', 'css/fix.css', 'css/theme.css',
  'js/util.js', 'js/calendar.js', 'js/data.js', 'js/state.js', 'js/finance.js', 'js/business.js', 'js/sim.js',
  'js/shifts.js', 'js/advisor.js', 'js/events.js', 'js/help.js', 'js/ui.js', 'js/views_main.js', 'js/views_biz.js',
  'js/views_more.js', 'js/overview.js', 'js/groups.js', 'js/progress.js', 'js/visual.js', 'js/people.js', 'js/tutorial.js', 'js/main.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
    );
  } else if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});
