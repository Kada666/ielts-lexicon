import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function list(dir) { let all=[]; for(const e of await readdir(dir,{withFileTypes:true})) {const p=`${dir}/${e.name}`; if(e.isDirectory()) all.push(...await list(p)); else if(e.name!=='sw.js') all.push(p);} return all; }
const files = await list('dist'); const hash=createHash('sha256'); for(const f of files.sort()) hash.update(await readFile(f));
hash.update(await readFile(new URL(import.meta.url)));
const edition=JSON.parse(await readFile('edition.json','utf8'));
const version=hash.digest('hex').slice(0,12); const urls=files.map(f=>'./'+f.slice(5));
await writeFile('dist/sw.js', `const PREFIX='ielts-lexicon-'+${JSON.stringify(edition.id)}+'::'+self.registration.scope+'::';
const CACHE=PREFIX+${JSON.stringify(version)}, ASSETS=${JSON.stringify(urls)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('message',e=>{if(e.data==='ACTIVATE')self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith(PREFIX)&&k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
e.respondWith((async()=>{const c=await caches.open(CACHE); if(e.request.mode==='navigate')return await c.match('./index.html',{ignoreVary:true})||fetch(e.request);return await c.match(e.request,{ignoreVary:true})||fetch(e.request)})())});`);
console.log(`Offline shell ready: ${version}, ${urls.length} files`);
