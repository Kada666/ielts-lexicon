import { expect, test } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { devices } from 'playwright';
test('离线应用壳预缓存资源完整且重载后可启动',async({page,context})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('button',{name:'核对并导入初始词库'})).toBeVisible();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise<void>(r=>navigator.serviceWorker.addEventListener('controllerchange',()=>r(),{once:true}));});
 const resources=await page.evaluate(async()=>{const items=[];for(const name of await caches.keys()){const c=await caches.open(name);for(const req of await c.keys()){const res=await c.match(req);items.push({url:req.url,size:(await res!.arrayBuffer()).byteLength,status:res?.status});}}return items;});
 expect(resources.length).toBeGreaterThanOrEqual(7);expect(resources.every(r=>r.size>0&&r.status===200)).toBe(true);
 await context.setOffline(true);await page.reload();
 await expect(page.getByRole('button',{name:'核对并导入初始词库'})).toBeVisible();
 expect(errors).toEqual([]);
});

test('手机离线缓存不会装入旧版首页', async ({ browser }) => {
 const shell = await readFile('dist/index.html', 'utf8');
 const staleShell = shell.replace(/\.\/assets\/[^"]+\.js/, './assets/retired-entry.js');
 const mime: Record<string,string> = {js:'text/javascript', html:'text/html', css:'text/css'};
 const server = createServer(async (req, res) => {
   const path = new URL(req.url!, 'http://localhost').pathname.replace(/^\/lexicon\//, '');
   try {
     const file = path || 'index.html';
     const body = path === 'index.html' ? staleShell : await readFile('dist/' + file);
     res.writeHead(200, {'Content-Type':mime[file.split('.').at(-1)!] ?? 'application/octet-stream'});
     res.end(body);
   } catch { res.writeHead(404).end(); }
 });
 await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
 const address = server.address() as {port:number};
 const context = await browser.newContext(devices['Pixel 7']);
 try {
   const page = await context.newPage();
   await page.goto(`http://127.0.0.1:${address.port}/lexicon/`);
   const entry = page.getByRole('button', { name: '核对并导入初始词库' });
   await expect(entry).toBeVisible();
   await page.waitForFunction(() => !!navigator.serviceWorker.controller);
   await context.setOffline(true);
   await page.reload();
   await expect(entry).toBeVisible();
 } finally {
   await context.close();
   server.close();
 }
});

test('手机加载不到主脚本时显示可重试页面', async ({ browser }) => {
 const context = await browser.newContext({...devices['Pixel 7'],serviceWorkers:'block'});
 try {
   const page = await context.newPage();
   const entry = /\/assets\/index-[^/]+\.js$/;
   await page.route(entry, route => route.abort());
   await page.goto('http://127.0.0.1:4173/');
   await expect(page.getByRole('status')).toContainText('请检查网络');
   await page.unroute(entry);
   await page.getByRole('link', {name:'重新打开'}).click();
   await expect(page.getByRole('button', {name:'核对并导入初始词库'})).toBeVisible();
 } finally {
   await context.close();
 }
});
