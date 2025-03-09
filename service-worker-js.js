const CACHE_NAME = 'occhiali-sim-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/img/occhiali-fermi.jpg',
  '/img/immagine-ottica.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Installazione del Service Worker
self.addEventListener('install', (event) => {
  // Forza l'attivazione immediata senza attendere che le altre schede si chiudano
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aperta');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Attivazione del Service Worker
self.addEventListener('activate', (event) => {
  // Prendi il controllo di tutte le pagine client immediatamente
  event.waitUntil(clients.claim());
  
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Gestione delle richieste di rete
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - restituisce la risorsa dalla cache
        if (response) {
          return response;
        }
        
        // Altrimenti, fetch dalla rete
        return fetch(event.request)
          .then((response) => {
            // Controlla che la risposta sia valida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona la risposta poiché body può essere consumato solo una volta
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Fallback per pagina offline
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Per le immagini, mostra un'immagine di fallback
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return caches.match('/img/occhiali-fermi.jpg');
            }
          });
      })
  );
});

// Gestione degli eventi push
self.addEventListener('push', function(event) {
  const title = 'Simulatore Occhiali';
  const options = {
    body: 'Torna a sperimentare con il simulatore di occhiali!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Gestione del clic sulle notifiche
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
