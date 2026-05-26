const CACHE='cuida-v8';
const FILES=['/','index.html','css/estil.css','css/fonts/ibm-plex-mono-400.woff2','js/main.js','js/dades.js','js/emmagatzematge.js','js/calendari.js','js/traduccions.js','imatges/avi-joan.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()).then(()=>self.clients.matchAll({type:'window'})).then(clients=>clients.forEach(c=>c.postMessage({type:'SW_UPDATE'})))));
self.addEventListener('push',e=>{
  e.waitUntil((async()=>{
    const MOMENTS={esmorzar:'Pastilles del matí',dinar:'Pastilles del migdia',sopar:'Pastilles del vespre'};
    const hora=new Date().getHours();
    const moment=hora<11?'esmorzar':hora<17?'dinar':'sopar';
    try{
      const r=await fetch('/api/dades');
      if(r.ok){
        const d=await r.json();
        // SOS té prioritat màxima
        if(d.estic_sol&&d.estic_sol.alerta){
          const nom=(d.pacient&&d.pacient.nom)||'El pacient';
          await self.registration.showNotification('⚠️ ALERTA — Mode Estic sol',{
            body:nom+' no ha confirmat que estava bé. Comprova-ho immediatament.',
            icon:'/icones/icon-192.png',badge:'/icones/icon-192.png',
            tag:'sos-estic-sol',requireInteraction:true,
            vibrate:[300,100,300,100,300,100,300],
            data:{url:'/'}
          });
          return;
        }
        // Medicació
        const llista=(d.medicacio||[]).filter(m=>m.moment===moment&&m.nom).map(m=>m.nom);
        const meds=llista.length?'• '+llista.join('\n• '):'Consulta la medicació a l\'app';
        await self.registration.showNotification(MOMENTS[moment],{body:meds,icon:'/icones/icon-192.png',badge:'/icones/icon-192.png',tag:'med-'+moment,data:{url:'/'}});
        // Diari (només al matí si no hi ha nota)
        const avui=new Date().toISOString().split('T')[0];
        const teDiari=(d.diari||[]).some(e=>e.data===avui);
        if(!teDiari&&hora<11){
          await self.registration.showNotification('Diari de seguiment',{body:'Ningú ha escrit la nota d\'avui.',icon:'/icones/icon-192.png',tag:'diari-avui',data:{url:'/'}});
        }
        return;
      }
    }catch(err){}
    await self.registration.showNotification(MOMENTS[moment],{body:'Consulta la medicació a l\'app',icon:'/icones/icon-192.png',tag:'med-'+moment});
  })());
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=(e.notification.data&&e.notification.data.url)||'/';
  e.waitUntil(clients.matchAll({type:'window'}).then(cs=>{const c=cs.find(x=>x.url.includes(self.location.origin)&&'focus'in x);if(c)return c.focus();return clients.openWindow(url)}));
});
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(url.pathname.startsWith('/api/'))return;e.respondWith(fetch(e.request).then(r=>{const clone=r.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));return r}).catch(()=>caches.match(e.request)));});
