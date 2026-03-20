// Blank Service Worker to pass the PWA install criteria
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

// Removido fetch handler vazio para evitar overhead e avisos do browser
