import { expect, test, type Page } from '@playwright/test';
async function seed(page:Page,all=false){
 await page.goto('/');await page.getByRole('button',{name:'核对并导入初始词库'}).click();
 if(!all)await page.getByRole('combobox',{name:'导入范围'}).selectOption('initial');
 await page.getByRole('checkbox',{name:'我已核对以上词形'}).check();
 await page.getByRole('button',{name:`确认导入 ${all?139:49} 词`}).click();
 await expect(page.getByRole('status')).toContainText(`已合并 ${all?139:49}`);
 await page.getByRole('button',{name:'关闭提示'}).click();
}
test('手机词库左右布局、大字体、滚动连续加载且不显示学习状态',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await seed(page,true);
 await page.getByRole('button',{name:'我的词库',exact:true}).click();
 const rows=page.locator('.mobile-word-row');await expect(page.locator('.mobile-vocabulary')).toBeVisible();await expect(page.locator('.desktop-vocabulary')).toBeHidden();await expect(page.getByRole('combobox',{name:'按当前状态筛选'})).toHaveCount(0);
 const first=rows.first();const word=await first.locator('.mobile-word-main').boundingBox(),meaning=await first.locator('.mobile-word-meaning').boundingBox();expect(meaning!.x).toBeGreaterThan(word!.x+word!.width);
 expect(await first.locator('strong').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(20);
 expect(await first.locator('.mobile-word-meaning').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(17);
 await expect(page.locator('.mobile-vocabulary')).not.toContainText('未学习');await expect(page.locator('.mobile-vocabulary')).not.toContainText('现在可学');
 await page.screenshot({path:info.outputPath('mobile-library-390.png'),fullPage:false});
 for(let i=0;i<4&&await rows.count()<139;i++){const count=await rows.count();await rows.last().scrollIntoViewIfNeeded();await expect.poll(()=>rows.count()).toBeGreaterThan(count);}
 await expect(rows).toHaveCount(139);
 await page.getByRole('textbox',{name:'搜索英文单词'}).fill('cardiovascular');
 await expect(rows).toHaveCount(1);
 for(const width of [320,390,430]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
test('触屏前后切换不评分、收起、大按钮、长按编辑持久化与英式发音',async({page,context},info)=>{
 await page.addInitScript(()=>{
  const spoken:unknown[]=[];
  Object.defineProperty(window,'__lexiconSpoken',{value:spoken});
  Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class {text:string;constructor(text:string){this.text=text;}}});
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{name:'UK local test',lang:'en-GB',localService:true}],cancel:()=>{},speak:(u:{text:string;lang:string;voice:{name:string};onend?:()=>void})=>{spoken.push({word:u.text,lang:u.lang,voice:u.voice.name});setTimeout(()=>u.onend?.(),0);}}});
 });
 await page.setViewportSize({width:390,height:844});await seed(page);
 await page.getByRole('button',{name:'闪卡复习',exact:true}).click();await page.getByRole('button',{name:'开始复习',exact:true}).click();
 await expect(page.locator('.answer-word h2')).toHaveText('apace');
 await page.getByRole('button',{name:'播放 apace 英式发音'}).tap();await expect.poll(()=>page.evaluate('window.__lexiconSpoken.length')).toBe(1);expect(await page.evaluate('window.__lexiconSpoken[0]')).toEqual({word:'apace',lang:'en-GB',voice:'UK local test'});await expect(page.locator('.core-meaning')).toHaveCount(0);
 await page.screenshot({path:info.outputPath('mobile-study-front-390.png'),fullPage:false});
 await page.getByRole('button',{name:'下一个单词'}).tap();await expect(page.locator('.answer-word h2')).not.toHaveText('apace');await page.getByRole('button',{name:'上一个单词'}).tap();await expect(page.locator('.answer-word h2')).toHaveText('apace');
 await page.getByRole('button',{name:'查看答案',exact:true}).tap();await page.getByRole('button',{name:'收起答案',exact:true}).first().tap();await expect(page.locator('.core-meaning')).toHaveCount(0);await page.getByRole('button',{name:'查看答案',exact:true}).tap();
 expect(await page.locator('.quick-memory p').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(18);
 await expect(page.locator('.collocations')).toHaveCount(0);await expect(page.locator('blockquote')).toHaveCount(0);
 for(const name of ['上一个单词','下一个单词','收起答案']){const button=page.getByRole('button',{name,exact:true}).first();const box=await button.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);}
 await page.screenshot({path:info.outputPath('mobile-study-back-390.png'),fullPage:false});
 const cue=page.locator('.quick-memory'),text=cue.locator(':scope > p');await text.scrollIntoViewIfNeeded();const box=await text.boundingBox();const x=box!.x+10,y=box!.y+10;
 const cdp=await context.newCDPSession(page);
 // 滚动位移必须取消长按，避免快速浏览时误弹编辑器。
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-30}]});await page.waitForTimeout(650);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(page.getByRole('dialog')).toHaveCount(0);
 await text.scrollIntoViewIfNeeded();const held=await text.boundingBox();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:held!.x+10,y:held!.y+10}]});await page.waitForTimeout(650);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect(page.getByRole('dialog',{name:'apace'})).toBeVisible();await page.getByRole('textbox',{name:'联想内容'}).fill('手机长按写下的新联想；前后切换后仍然保留。');await page.screenshot({path:info.outputPath('mobile-mnemonic-editor-390.png'),fullPage:false});await page.getByRole('button',{name:'保存联想'}).tap();
 await expect(cue).toContainText('手机长按写下的新联想');
 await page.getByRole('button',{name:'记住了'}).tap();await page.getByRole('button',{name:'上一个单词'}).tap();await page.getByRole('button',{name:'查看答案',exact:true}).tap();await expect(page.getByRole('button',{name:'记住了'})).toBeDisabled();
 await page.reload();await page.getByRole('button',{name:'学习概览',exact:true}).click();await expect(page.locator('.metric').filter({hasText:'今日已复习'})).toContainText('1');
 await page.getByRole('button',{name:'我的词库',exact:true}).click();await page.getByRole('textbox',{name:'搜索英文单词'}).fill('apace');await page.getByRole('button',{name:'编辑 apace',exact:true}).click();await expect(page.getByRole('textbox',{name:'记忆内容'})).toHaveValue('手机长按写下的新联想；前后切换后仍然保留。');
});
