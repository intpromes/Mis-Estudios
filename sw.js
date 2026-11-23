// Mis Estudios - service worker (funciona sin internet después de la primera carga)
const CACHE = 'misestudios-v1';
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
const ARCHIVOS = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png',
  PDFJS + 'pdf.min.js', PDFJS + 'pdf.worker.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Página principal: primero red (para recibir actualizaciones), si no hay, caché
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => {
      const copia = r.clone(); caches.open(CACHE).then(c => c.put('index.html', copia)); return r;
    }).catch(() => caches.match('index.html')));
    return;
  }
  // Resto (íconos, pdf.js): primero caché
  if (url.origin === location.origin || url.href.startsWith(PDFJS)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const copia = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return res;
    })));
  }
});
