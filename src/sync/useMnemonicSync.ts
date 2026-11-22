import { useEffect, useMemo, useRef, useState } from 'react';
import type { Repository } from '../db/database';
import type { Snapshot } from '../types';
import type { createCloud } from './firebase';
import { compareMnemonicEdits, decodeMnemonicRecord, localMnemonicRecord, type MnemonicRecord } from './mnemonics';

export function useMnemonicSync({repo,cloud,uid,snapshot,online,retry,refresh}:{
 repo:Repository;cloud:ReturnType<typeof createCloud>|null;uid:string|null;snapshot:Snapshot;
 online:boolean;retry:number;refresh:()=>Promise<void>;
}){
 const [enabledFor,setEnabledFor]=useState<string|null>(null);
 const [saving,setSaving]=useState(false);
 const [remoteState,setRemote]=useState<{uid:string;retry:number;records:MnemonicRecord[]}|null>(null);
 const [error,setError]=useState('');
 const [uploading,setUploading]=useState(false);
 const sent=useRef(new Set<string>());
 const enabled=!!uid&&enabledFor===uid;
 useEffect(()=>{
  let active=true;
  setEnabledFor(null);
  if(uid)void repo.mnemonicSyncEnabled(uid).then(value=>{if(active&&value)setEnabledFor(uid);})
   .catch(()=>{if(active)setError('无法读取本机联想同步设置。');});
  return ()=>{active=false;};
 },[repo,uid]);
 useEffect(()=>{
  setRemote(null);
  setError('');
  setUploading(false);
  const queue=new Set<string>();
  sent.current=queue;
  if(!uid||!cloud||!enabled||!online)return;
  let active=true;
  const stop=cloud.watchMnemonics(uid,records=>{if(active)setRemote({uid,retry,records});},cause=>{
   if(active)setError('code' in cause&&cause.code==='permission-denied'
    ?'云端尚未启用联想同步，请在新版 Firebase 规则发布后重试。'
    :'无法读取云端联想，请检查网络后重试。');
  });
  return ()=>{active=false;sent.current=new Set();stop();};
 },[cloud,uid,enabled,online,retry]);
 const remote=enabled&&online&&remoteState?.uid===uid&&remoteState.retry===retry?remoteState.records:null;
 const plan=useMemo(()=>{
  const words=new Map(snapshot.words.map(word=>[word.id,word]));
  const local=new Map<string,MnemonicRecord>();
  let oversized=0;
  for(const override of snapshot.overrides){
   const word=words.get(override.word_id);
   if(!word)continue;
   const note=localMnemonicRecord(word,override);
   if(!note)continue;
   local.set(note.word_id,note);
   if(!decodeMnemonicRecord(note,note.word_id))oversized++;
  }
  const cloudNotes=new Map(remote?.map(note=>[note.word_id,note]));
  return {oversized,missing:remote?.filter(note=>!words.has(note.word_id)).length??0,
   up:remote?[...local.values()].filter(note=>decodeMnemonicRecord(note,note.word_id)&&(!cloudNotes.has(note.word_id)||compareMnemonicEdits(note,cloudNotes.get(note.word_id)!)>0)):[],
   down:remote?.filter(note=>words.has(note.word_id)&&(!local.has(note.word_id)||compareMnemonicEdits(note,local.get(note.word_id)!)>0))??[],
   count:remote?.filter(note=>words.has(note.word_id)&&local.has(note.word_id)&&compareMnemonicEdits(note,local.get(note.word_id)!)===0).length??0};
 },[snapshot.words,snapshot.overrides,remote]);
 useEffect(()=>{
  if(!uid||!remote||!plan.down.length||error)return;
  let active=true;
  void repo.mergeMnemonicRecords(uid,plan.down).then(changed=>{if(changed)return refresh();})
   .catch(()=>{if(active)setError('无法将云端联想合并到本机，可重试。');});
  return ()=>{active=false;};
 },[uid,repo,remote,plan.down,error,refresh]);
 useEffect(()=>{
  if(!uid||!cloud||!remote||uploading||error)return;
  const queue=sent.current;
  const key=(note:MnemonicRecord)=>JSON.stringify([note.word_id,note.at,note.edit_id]);
  const pending=plan.up.filter(note=>!queue.has(key(note)));
  if(!pending.length)return;
  for(const note of pending)queue.add(key(note));
  setUploading(true);
  void cloud.uploadMnemonics(uid,pending,()=>sent.current===queue).then(()=>{
   if(sent.current===queue)setUploading(false);
  }).catch(()=>{
   if(sent.current!==queue)return;
   setUploading(false);
   setError('联想已保存在本机，云端上传失败，可重试。');
  });
 },[uid,cloud,remote,uploading,error,plan.up]);
 async function toggle(value:boolean){
  if(!uid||saving)return;
  setSaving(true);
  try {
   await repo.setMnemonicSync(uid,value);
   setEnabledFor(value?uid:null);
  } catch{setError('无法保存联想同步设置。');}
  finally{setSaving(false);}
 }
 const status=!online?'离线 · 联想保存在本机':error?'联想同步未完成':
  !remote?'正在连接联想同步…':uploading||plan.up.length||plan.down.length?'正在同步个人联想…':`已同步 ${plan.count} 个词的个人联想`;
 return {enabled,saving,toggle,uploading,error,status,missing:plan.missing,oversized:plan.oversized};
}
