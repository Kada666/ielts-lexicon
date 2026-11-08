import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function list(dir) { let all=[]; for(const e of await readdir(dir,{withFileTypes:true})) {const p=`${dir}/${e.name}`; if(e.isDirectory()) all.push(...await list(p)); else if(e.name!=='sw.js') all.push(p);} return all; }
const files = await list('dist'); const hash=createHash('sha256'); for(const f of files.sort()) hash.update(await readFile(f));
hash.update(await readFile(new URL(import.meta.url)));
const edition=JSON.parse(await readFile('edition.json','utf8'));
const version=hash.digest('hex').slice(0,12);
const urls=files.filter(f=>f!=='dist/index.html').map(f=>'./'+f.slice(5));
// Bind the HTML to this build, even if a CDN still serves an older index.html.
const shell=await readFile('dist/index.html','utf8');
await writeFile('dist/sw.js', `const PREFIX='ielts-lexicon-'+${JSON.stringify(edition.id)}+'::'+self.registration.scope+'::';
const CACHE=PREFIX+${JSON.stringify(version)}, ASSETS=${JSON.stringify(urls)};
const SHELL=${JSON.stringify(shell)}, SCOPE=new URL(self.registration.scope);
const previousCaches=async()=> (await caches.keys()).filter(k=>k.startsWith(PREFIX)&&k!==CACHE);
self.addEventListener('install',e=>e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  try {
    await c.addAll(ASSETS);
    await c.put('./index.html',new Response(SHELL,{headers:{'Content-Type':'text/html; charset=utf-8'}}));
  } catch(error) {
    await caches.delete(CACHE);
    throw error;
  }
  await self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  // An open page may still need a lazy chunk from the previous build.
  for(const k of (await previousCaches()).slice(0,-1))await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET'||url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;
  e.respondWith((async()=>{
    if(e.request.mode==='navigate'&&(url.pathname===SCOPE.pathname||url.pathname===SCOPE.pathname+'index.html')) {
      return new Response(SHELL,{headers:{'Content-Type':'text/html; charset=utf-8'}});
    }
    const current=await caches.match(e.request,{cacheName:CACHE,ignoreVary:true});
    if(current)return current;
    if(url.pathname.startsWith(SCOPE.pathname+'assets/')){
      for(const name of (await previousCaches()).reverse()){
        const previous=await caches.match(e.request,{cacheName:name,ignoreVary:true});
        if(previous)return previous;
      }
    }
    return fetch(e.request);
  })());
});`);
console.log(`Offline shell ready: ${version}, ${urls.length+1} files`);
