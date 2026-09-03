/* Service worker do painel de parceiro (almazstore.com.br/parceiros/).
   Existe por dois motivos: sem ele o navegador não oferece "instalar na tela
   inicial", e o parceiro que abre o app sem sinal veria uma tela de erro do
   navegador em vez do app.

   Os caminhos são relativos à pasta /parceiros/ de propósito. O escopo de um
   service worker é a pasta onde ele está, então cachear "/" daqui não
   funcionaria — e ainda por cima pisaria no site principal.

   Estratégia deliberadamente burra: cache só do casco (HTML, manifest, logo),
   e NUNCA das chamadas de API. Saldo e indicações têm que vir sempre do
   servidor: mostrar saldo velho em cache é pior do que não mostrar nada. */
const CACHE = 'almaz-parceiros-v1';
const CASCO = ['./', './index.html', './manifest.json', './logo.png'];

self.addEventListener('install', (e) => {
  // addAll falha inteiro se UM arquivo faltar, e aí o SW nem instala.
  // Por isso cada um vai por conta própria.
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(CASCO.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API nunca passa pelo cache: dado de dinheiro tem que ser o de agora.
  if (url.pathname.startsWith('/api/') || url.hostname.includes('onrender.com')) return;
  if (e.request.method !== 'GET') return;

  // Rede primeiro, cache só como rede de segurança quando estiver offline.
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        if (resp && resp.ok && url.origin === self.location.origin) {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {});
        }
        return resp;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html'))),
  );
});
