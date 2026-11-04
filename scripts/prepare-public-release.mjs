// 创建无 Git 旧历史、无手写图片的独立公开发布目录。
import { mkdir, cp, readdir, writeFile, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const root=process.cwd(),out=resolve(root,'public-release');
if(out!==join(root,'public-release'))throw new Error('Unexpected export target');
try{await access(join(out,'.git'));throw new Error('Release already has Git metadata. Refusing to overwrite a repository.');}catch(e){if(e.code!=='ENOENT')throw e;}
const files=['.gitignore','README.md','README.en.md','edition.json','package.json','package-lock.json','index.html','tsconfig.json','vite.config.ts','vitest.config.ts','playwright.config.ts','start-lexicon.cmd'];
for(const file of files){await mkdir(out,{recursive:true});await cp(join(root,file),join(out,file));}
for(const dir of ['src','tests','data','.github'])await cp(join(root,dir),join(out,dir),{recursive:true});
await mkdir(join(out,'scripts'),{recursive:true});
for(const name of ['build-vocabulary.mjs','build-sw.mjs','open-lexicon.ps1','install-desktop-shortcut.ps1','prepare-initial.mjs','enrich-initial.mjs','enrich-lists-03-04.mjs','prepare-public-release.mjs'])await cp(join(root,'scripts',name),join(out,'scripts',name));
await mkdir(join(out,'public'),{recursive:true});
for(const name of ['icon.svg','icon-192.png','icon-512.png','lexicon.ico','manifest.webmanifest'])await cp(join(root,'public',name),join(out,'public',name));
await mkdir(join(out,'docs','screenshots'),{recursive:true});
for(const name of ['technical-guide.zh-CN.md','verification.md','deployment.md'])await cp(join(root,'docs',name),join(out,'docs',name));
for(const name of ['desktop.png','ipad.png','ipad-card.png','phone-card.png','phone-library.png'])await cp(join(root,'docs','screenshots',name),join(out,'docs','screenshots',name));
async function walk(dir){let result=[];for(const e of await readdir(dir,{withFileTypes:true})){const path=join(dir,e.name);if(e.isDirectory())result.push(...await walk(path));else result.push(path);}return result;}
const exported=await walk(out);
if(exported.some(p=>/\.(jpe?g|webp|heic|pdf)$/i.test(p)||p.slice(out.length+1).split(/[\\/]/).some(part=>part==='sources'||part==='.git')))throw new Error('Handwritten-source or history material found');
await writeFile(join(out,'PUBLIC_RELEASE.json'),JSON.stringify({format:'ielts-lexicon-public-release',handwritten_images_included:false,learning_history_included:false,source_history_included:false,files:exported.map(p=>p.slice(out.length+1).replaceAll('\\','/')).sort()},null,2)+'\n');
console.log(`Clean public release prepared: ${exported.length} files, no handwritten images or prior Git history.`);
