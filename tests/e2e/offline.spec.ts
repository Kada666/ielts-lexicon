import { expect, test } from '@playwright/test';
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
