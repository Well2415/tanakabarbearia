// Blank Service Worker to pass the PWA install criteria
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Faz nada especial, apenas passa a requisição pra frente (Network primeiro)
  // Isso impede que o app quebre se fizermos atualizações drásticas, 
  // e ainda satisfaz o Chrome for Android para mostrar o prompt de download.
});
