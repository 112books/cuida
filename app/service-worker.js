const CACHE='cuida-v1';
const FILES=['/','index.html','css/estil.css','js/main.js','js/dades.js','js/emmagatzematge.js','js/calendari.js','js/traduccions.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
