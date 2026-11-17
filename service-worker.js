const CACHE='dart-score-v19-browser-1';
const ASSETS=['./','./index.html','./style.css','./style-ultrawide.css','./app.js','./roasts.js','./manifest.json','./icon-192.png','./icon-512.png'];
const assetUrls=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(key=>key.startsWith('dart-score-')&&key!==CACHE).map(key=>caches.delete(key))
  )).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const {request}=event;
  const url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  if(url.pathname.startsWith(new URL('api/',self.registration.scope).pathname))return;
  if(request.mode!=='navigate'&&!assetUrls.has(url.href))return;

  event.respondWith(fetch(request).catch(async()=>{
    const cache=await caches.open(CACHE);
    return (await cache.match(request))||(request.mode==='navigate'&&await cache.match('./index.html'))||Response.error();
  }));
});
