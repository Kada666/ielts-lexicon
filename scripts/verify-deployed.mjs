// 隔离浏览器验收；不读取或修改用户日常浏览器数据库。
import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const url=process.argv[2]??'https://kada666.github.io/ielts-lexicon/';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const response=await page.goto(url);
 expect(response.status()).toBe(200);
 await expect(page.getByRole('heading',{name:'让每一个单词，留下来。'})).toBeVisible();
 expect(await page.locator('.source-references img').count()).toBe(0);
 const photo=await page.request.get(new URL('sources/list_01.jpg',url).href);expect(photo.status()).toBe(404);
 await page.getByRole('button',{name:'核对并导入初始词库'}).click();
 await expect(page.getByRole('button',{name:'确认导入 132 词'})).toBeDisabled();
 await page.getByRole('checkbox',{name:'我已核对以上词形'}).check();
 await page.getByRole('button',{name:'确认导入 132 词'}).click();
 await expect(page.getByRole('status')).toContainText('已合并 132');
 await page.getByRole('button',{name:'学习概览',exact:true}).click();
 await page.getByRole('button',{name:'关闭提示'}).click();
 await expect(page.locator('.metric').filter({hasText:'个人词汇'})).toContainText('132');
 await mkdir('docs/screenshots',{recursive:true});
 await page.screenshot({path:'docs/screenshots/public-live.png',fullPage:true});
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 await context.setOffline(true);await page.reload();
 await expect(page.getByText('当前离线',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'闪卡复习',exact:true}).click();
 await page.getByRole('button',{name:'开始复习',exact:true}).click();
 await page.getByRole('button',{name:'查看答案',exact:true}).click();
 await expect(page.locator('.core-meaning')).toBeVisible();
 await page.getByRole('button',{name:'记住了'}).click();await page.reload();
 await expect(page.locator('.metric').filter({hasText:'今日已复习'})).toContainText('1');
 expect(errors).toEqual([]);
 console.log(JSON.stringify({url,http:200,handwritten_image_http:404,imported:132,offline_reload:true,offline_rating_persisted:true,page_errors:0}));
}finally{await browser.close();}
