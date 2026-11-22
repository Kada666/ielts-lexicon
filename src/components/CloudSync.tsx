import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { FirebaseOptions } from 'firebase/app';
import type { User } from 'firebase/auth';
import type { Repository } from '../db/database';
import type { ReviewEvent, Snapshot, Word } from '../types';
import type { createCloud } from '../sync/firebase';
import { parseSyncEvent } from '../utils/validation';
import { bundledImports, importRefId, type ImportRef } from '../sync/imports';
import { useMnemonicSync } from '../sync/useMnemonicSync';

function loadConfig():FirebaseOptions|null{
 try{
  const options=JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG??'null');
  if(options&&['apiKey','authDomain','projectId','appId'].every(key=>typeof options[key]==='string'&&options[key]))return options;
 }catch{/* Invalid configuration leaves cloud sync disabled. */}
 return null;
}
const config=loadConfig();
type Cloud = ReturnType<typeof createCloud>;

export default function CloudSync({repo,snapshot,bundled,online,visible,refresh}:{repo:Repository;snapshot:Snapshot;bundled:Word[];online:boolean;visible:boolean;refresh:()=>Promise<void>}){
 const [cloud,setCloud]=useState<Cloud|null>(null);
 const [session,setSession]=useState<{user:User;linked:boolean;conflict:boolean}|null>(null);
 const [cloudSnapshot,setCloudSnapshot]=useState<{uid:string;retry:number;events:ReviewEvent[]}|null>(null);
 const [importSnapshot,setImportSnapshot]=useState<{uid:string;retry:number;refs:ImportRef[]}|null>(null);
 const [error,setError]=useState('');
 const [importError,setImportError]=useState('');
 const [action,setAction]=useState(false);
 const [retry,setRetry]=useState(0);
 const [uploading,setUploading]=useState(false);
 const [uploadingImports,setUploadingImports]=useState(false);
 const sent=useRef(new Set<string>());
 const sentImports=useRef(new Set<string>());
 const importCatalog=useMemo(()=>bundledImports(bundled),[bundled]);
 const localImports=useMemo(()=>new Map(snapshot.words.flatMap(word=>word.list_ids.flatMap(list=>{
  const ref={word_id:word.id,list},id=importRefId(ref);
  return importCatalog.has(id)?[[id,ref] as const]:[];
 }))),[snapshot.words,importCatalog]);
 const localEvents=useMemo(()=>{
  const words=new Map(snapshot.words.map(word=>[word.id,word]));
  return snapshot.reviews.flatMap(review=>{
   const event=parseSyncEvent({...review,initial_level:review.initial_level??words.get(review.word_id)?.initial_level});
   return event?[event]:[];
  });
 },[snapshot.reviews,snapshot.words]);
 const reviewIds=useMemo(()=>new Set(snapshot.reviews.map(review=>review.id)),[snapshot.reviews]);
 useEffect(()=>{
  if(!import.meta.env.VITE_FIREBASE_CONFIG||!config)return;
  let active=true;
  let stop:undefined|(()=>void);
  let authVersion=0;
  void import('../sync/firebase').then(({createCloud})=>{
   if(!active)return;
   const client=createCloud(config);
   setCloud(client);
   stop=client.watchUser(user=>{
    const version=++authVersion;
    setSession(null);
    if(!user)return;
    void repo.syncOwner().then(owner=>{
     if(active&&version===authVersion)setSession({user,linked:owner===user.uid,conflict:!!owner&&owner!==user.uid});
    }).catch(()=>{if(active&&version===authVersion)setError('无法读取本机同步设置。');});
   });
  }).catch(()=>{if(active)setError('同步服务初始化失败。');});
  return ()=>{active=false;stop?.();};
 },[repo]);
 const uid=session?.linked?session.user.uid:null;
 const mnemonicSync=useMnemonicSync({repo,cloud,uid,snapshot,online,retry,refresh});
 const remote=cloudSnapshot?.uid===uid&&cloudSnapshot.retry===retry?cloudSnapshot.events:null;
 const remoteImports=importSnapshot?.uid===uid&&importSnapshot.retry===retry?importSnapshot.refs:null;
 const pendingImports=useMemo(()=>{
  if(!remoteImports)return [];
  const ids=new Set(remoteImports.map(importRefId));
  return [...localImports].filter(([id])=>!ids.has(id)).map(([,ref])=>ref);
 },[localImports,remoteImports]);
 const missingImports=useMemo(()=>remoteImports?.filter(ref=>!localImports.has(importRefId(ref)))??[],[remoteImports,localImports]);
 const importDownloads=useMemo(()=>missingImports.filter(ref=>importCatalog.has(importRefId(ref))),[missingImports,importCatalog]);
 const missing=useMemo(()=>remote?.filter(event=>!reviewIds.has(event.id))??[],[remote,reviewIds]);
 const downloads=useMemo(()=>{
  const available=new Set([...bundled,...snapshot.words].map(word=>word.id));
  return missing.filter(event=>available.has(event.word_id));
 },[missing,bundled,snapshot.words]);
 const uploads=useMemo(()=>{
  if(!remote)return [];
  const cloudIds=new Set(remote.map(event=>event.id));
  return localEvents.filter(event=>!cloudIds.has(event.id));
 },[remote,localEvents]);
 useEffect(()=>{
  setCloudSnapshot(null);
  setUploading(false);
  sent.current=new Set();
  if(!uid||!cloud)return;
  let active=true;
  const stop=cloud.watchReviews(uid,events=>{if(active)setCloudSnapshot({uid,retry,events});},()=>{
   if(active)setError('无法读取云端进度，请检查网络或同步权限。');
  });
  return ()=>{active=false;stop();};
 },[cloud,uid,retry]);
 useEffect(()=>{
  setImportSnapshot(null);
  setUploadingImports(false);
  setImportError('');
  sentImports.current=new Set();
  if(!uid||!cloud)return;
  let active=true;
  const stop=cloud.watchImports(uid,refs=>{if(active)setImportSnapshot({uid,retry,refs});},(cause)=>{
   if(active)setImportError('code' in cause&&cause.code==='permission-denied'
    ?'云端尚未授权词库同步。站点管理员发布新版 Firebase 规则后，请重试。'
    :'无法读取云端词库，请检查网络后重试。');
  });
  return ()=>{active=false;stop();};
 },[cloud,uid,retry]);
 const canDownloadImports=!!importDownloads.length&&!importError;
 useEffect(()=>{
  if(!uid||(!canDownloadImports&&(!downloads.length||error)))return;
  let active=true;
  async function merge(owner:string){
   let changed=false;
   if(canDownloadImports){
    try{changed=await repo.mergeImportedWords(owner,importDownloads,importCatalog);}
    catch{if(active)setImportError('本机暂时无法合并云端词库。');}
   }
   if(active&&downloads.length&&!error){
    try{changed=await repo.mergeReviewEvents(downloads,bundled,owner)||changed;}
    catch{if(active)setError('本机暂时无法合并云端进度。');}
   }
   if(changed)await refresh();
  }
  void merge(uid).catch(()=>{if(active)setError('本机数据已写入，刷新页面后可查看。');});
  return ()=>{active=false;};
 },[downloads,importDownloads,canDownloadImports,uid,repo,bundled,importCatalog,refresh,error]);
 useEffect(()=>{
  if(!remoteImports||!uid||!cloud||!online||uploadingImports||importError)return;
  const queue=sentImports.current;
  const pending=pendingImports.filter(ref=>!queue.has(importRefId(ref)));
  if(!pending.length)return;
  for(const ref of pending)queue.add(importRefId(ref));
  setUploadingImports(true);
  void cloud.uploadImports(uid,pending).then(()=>{
   if(sentImports.current===queue)setUploadingImports(false);
  }).catch(()=>{
   if(sentImports.current!==queue)return;
   for(const ref of pending)queue.delete(importRefId(ref));
   setImportError('词库已保存在本机。云端上传失败，可重试。');
   setUploadingImports(false);
  });
 },[remoteImports,uid,cloud,online,pendingImports,uploadingImports,importError]);
 useEffect(()=>{
  if(!remote||!uid||!cloud||!online||uploading||error)return;
  const queue=sent.current;
  const pending=uploads.filter(event=>!queue.has(event.id));
  if(!pending.length)return;
  for(const event of pending)queue.add(event.id);
  setUploading(true);
  void cloud.upload(uid,pending).then(()=>{
   if(sent.current===queue)setUploading(false);
  }).catch(()=>{
   if(sent.current!==queue)return;
   for(const event of pending)queue.delete(event.id);
   setError('进度已保存在本机。云端上传失败，可重试。');
   setUploading(false);
  });
 },[remote,uid,cloud,online,uploads,uploading,error]);
 async function login(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!cloud||action)return;
  const data=new FormData(event.currentTarget);
  event.currentTarget.reset();
  setAction(true);setError('');
  try{await cloud.signIn(String(data.get('email')).trim(),String(data.get('password')));}
  catch{setError('登录失败。请检查网络、邮箱和密码。');}
  finally{setAction(false);}
 }
 async function link(){
  if(!session||action)return;
  setAction(true);setError('');
  try{
   const allowed=await repo.claimSyncOwner(session.user.uid);
   setSession(current=>current?.user.uid===session.user.uid?{...current,linked:allowed,conflict:!allowed}:current);
  }catch{setError('无法启用本机同步。');}
  finally{setAction(false);}
 }
 async function logout(){
  try{await cloud?.signOut();setError('');}
  catch{setError('退出失败，请重试。');}
 }
 function syncNow(){
  setError('');
  setRetry(value=>value+1);
 }
 let status='等待连接云端…';
 if(!online)status='离线 · 记录保存在本机';
 else if(error)status='同步未完成';
 else if(uploading)status='正在上传进度…';
 else if(downloads.length)status='正在合并云端进度…';
 else if(uploads.length)status='等待云端确认…';
 else if(remote)status=`已同步 ${remote.length-missing.length} 条复习记录`;
 let importStatus='等待连接云端…';
 if(!online)importStatus='离线 · 词库保存在本机';
 else if(importError)importStatus='词库同步未完成';
 else if(uploadingImports||pendingImports.length)importStatus='正在同步本机导入的词汇…';
 else if(importDownloads.length)importStatus='正在合并云端词汇…';
 else if(remoteImports){
  const synced=remoteImports.filter(ref=>localImports.has(importRefId(ref)));
  const lists=[...new Set(synced.map(ref=>ref.list))].sort((left,right)=>left-right);
  importStatus=`已同步 ${new Set(synced.map(ref=>ref.word_id)).size} 个内置词汇${lists.length?' · List '+lists.join('、'):''}`;
 }
 if(!visible)return null;
 return <section className="panel settings-panel cloud-sync" aria-label="跨设备同步">
  <h3>跨设备同步</h3>
  {!config?<p>云端同步尚未配置。复习记录当前保存在本机，可在「导入与备份」导出。</p>:
   !session?<form onSubmit={login}><p>电脑和手机登录同一个账号并启用同步，可同步已导入的内置词汇、复习历史和到期时间。</p>
    <label>邮箱<input name="email" type="email" autoComplete="username" required/></label>
    <label>密码<input name="password" type="password" autoComplete="current-password" required/></label>
    <button className="primary" disabled={!cloud||action}>登录</button>
   </form>:<>
    <p>{session.user.email}</p>
    {session.conflict?<p>此浏览器已绑定另一个同步账号。请用独立浏览器配置文件登录。</p>:
     session.linked?<>
      <p role="status">{status}</p>
      <p role="status">{importStatus}</p>
      {missingImports.length>importDownloads.length&&<p>有新词需要最新版看板，联网刷新后可继续同步。</p>}
      {missing.length>downloads.length&&<p>另有 {missing.length-downloads.length} 条记录需先导入对应词条。</p>}
      <label className="setting-row"><div><strong>同步个人联想</strong><p>将本机的联想、口诀、词块和关联词保存到此账号。要在另一台设备接收，请在那边也开启此项。</p></div><input type="checkbox" aria-label="同步个人联想" checked={mnemonicSync.enabled} disabled={mnemonicSync.saving} onChange={e=>void mnemonicSync.toggle(e.target.checked)}/></label>
      {mnemonicSync.enabled&&<p role="status">{mnemonicSync.status}</p>}
      {mnemonicSync.enabled&&mnemonicSync.missing>0&&<p>有 {mnemonicSync.missing} 个词的联想等待对应词条。内置词会随词库同步，自建词需先在本机导入。</p>}
      {mnemonicSync.enabled&&mnemonicSync.oversized>0&&<p>有 {mnemonicSync.oversized} 个词的联想无法上传，内容仍保存在本机，可导出备份。</p>}
      <button className="primary" disabled={!online||uploading||uploadingImports||mnemonicSync.uploading} onClick={syncNow}>{error||importError||mnemonicSync.error?'重试同步':'立即同步'}</button>
     </>:
     <><p>此设备尚未启用同步。启用后会把已导入的内置词汇与复习历史合并到此账号。</p><button className="primary" disabled={action} onClick={()=>void link()}>同步本机进度</button></>}
    <button className="secondary" disabled={action} onClick={()=>void logout()}>退出登录</button>
   </>}
  {error&&<p role="alert">{error}</p>}
  {importError&&<p role="alert">{importError}</p>}
  {mnemonicSync.error&&<p role="alert">{mnemonicSync.error}</p>}
 </section>;
}
