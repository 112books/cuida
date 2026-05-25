const CACHE='cuida-v8';
const FILES=['/','index.html','css/estil.css','css/fonts/ibm-plex-mono-400.woff2','js/main.js','js/dades.js','js/emmagatzematge.js','js/calendari.js','js/traduccions.js','imatges/avi-joan.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()).then(()=>self.clients.matchAll({type:'window'})).then(clients=>clients.forEach(c=>c.postMessage({type:'SW_UPDATE'})))));
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(cs=>{const c=cs.find(x=>x.focus);if(c)return c.focus();return clients.openWindow('/')}))});
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(url.pathname.startsWith('/api/'))return;e.respondWith(fetch(e.request).then(r=>{const clone=r.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));return r}).catch(()=>caches.match(e.request)));});
