const CACHE='faeyza-store-v38-static';
const CORE=['/','/offline.html','/style.css','/app.js','/pwa.js','/manifest.webmanifest'];
const STATIC_RE=/\.(?:css|js|png|jpg|jpeg|webp|svg|ico|woff2?)$/i;
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function networkFirst(req){try{const r=await fetch(req);if(r.ok){const c=await caches.open(CACHE);c.put(req,r.clone());}return r;}catch(e){return (await caches.match(req))||caches.match('/offline.html');}}
async function staticFirst(req){const hit=await caches.match(req);if(hit){fetch(req).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(req,r.clone()));}).catch(()=>{});return hit;}try{const r=await fetch(req);if(r.ok)caches.open(CACHE).then(c=>c.put(req,r.clone()));return r;}catch(e){return caches.match('/offline.html');}}
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==self.location.origin||e.request.method!=='GET'||u.pathname.startsWith('/api/')||u.pathname.startsWith('/admin/'))return;e.respondWith(STATIC_RE.test(u.pathname)?staticFirst(e.request):networkFirst(e.request));});
