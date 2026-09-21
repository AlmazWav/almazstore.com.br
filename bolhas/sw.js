// Service worker mínimo: só existe pra o navegador oferecer "Instalar app".
// Não guarda cache: saldo e partida têm que vir sempre do servidor.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
