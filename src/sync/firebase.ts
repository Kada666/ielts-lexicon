import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { collection, doc, getFirestore, onSnapshot, runTransaction, writeBatch } from 'firebase/firestore';
import type { ReviewEvent } from '../types';
import { parseSyncEvent } from '../utils/validation';
import { importRefId, parseImportRef, type ImportRef } from './imports';
import { compareMnemonicEdits, decodeMnemonicRecord, type MnemonicRecord } from './mnemonics';

export function createCloud(config: FirebaseOptions) {
 const app=getApps().find(entry=>entry.name==='lexicon-sync')??initializeApp(config,'lexicon-sync');
 const auth=getAuth(app),db=getFirestore(app);
 const reviews=(uid:string)=>collection(db,'users',uid,'reviews');
 const imports=(uid:string)=>collection(db,'users',uid,'imports');
 const mnemonics=(uid:string)=>collection(db,'users',uid,'mnemonics');
 return {
  watchUser:(callback:(user:User|null)=>void)=>onAuthStateChanged(auth,callback),
  signIn:(email:string,password:string)=>signInWithEmailAndPassword(auth,email,password),
  signOut:()=>signOut(auth),
  watchMnemonics:(uid:string,update:(notes:MnemonicRecord[])=>void,fail:(error:Error)=>void)=>
   onSnapshot(mnemonics(uid),{includeMetadataChanges:true},snapshot=>{
    if(snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites)return;
    update(snapshot.docs.flatMap(row=>{
     const note=decodeMnemonicRecord(row.data(),row.id);
     return note?[note.record]:[];
    }));
   },fail),
  async uploadMnemonics(uid:string,notes:MnemonicRecord[],active:()=>boolean){
   for(let offset=0;offset<notes.length;offset+=20){
    if(!active()||auth.currentUser?.uid!==uid)return;
    const group=notes.slice(offset,offset+20);
    await runTransaction(db,async tx=>{
     if(!active()||auth.currentUser?.uid!==uid)return;
     const rows=group.map(note=>({note,ref:doc(mnemonics(uid),note.word_id)}));
     const stored=await Promise.all(rows.map(({ref})=>tx.get(ref)));
     if(!active()||auth.currentUser?.uid!==uid)return;
     rows.forEach(({ref,note},index)=>{
      const other=decodeMnemonicRecord(stored[index].data(),note.word_id)?.record;
      if(!other||compareMnemonicEdits(note,other)>0)tx.set(ref,note);
     });
    });
   }
  },
  watchReviews:(uid:string,update:(events:ReviewEvent[])=>void,fail:(error:Error)=>void)=>
   onSnapshot(reviews(uid),{includeMetadataChanges:true},snapshot=>{
    if(snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites)return;
    const events=snapshot.docs.flatMap(row=>{
     const event=parseSyncEvent(row.data());
     return event?.id===row.id?[event]:[];
    });
    update(events);
   },fail),
  watchImports:(uid:string,update:(refs:ImportRef[])=>void,fail:(error:Error)=>void)=>
   onSnapshot(imports(uid),{includeMetadataChanges:true},snapshot=>{
    if(snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites)return;
    update(snapshot.docs.flatMap(row=>{
     const ref=parseImportRef(row.data());
     return ref&&importRefId(ref)===row.id?[ref]:[];
    }));
   },fail),
  async uploadImports(uid:string,refs:ImportRef[]){
   for(let index=0;index<refs.length;index+=200){
    if(auth.currentUser?.uid!==uid)throw new Error('同步账号已退出。');
    const batch=writeBatch(db);
    for(const ref of refs.slice(index,index+200))batch.set(doc(imports(uid),importRefId(ref)),ref);
    await batch.commit();
   }
  },
  async upload(uid:string,events:ReviewEvent[]){
   for(let i=0;i<events.length;i+=200){
    if(auth.currentUser?.uid!==uid)throw new Error('同步账号已退出。');
    const batch=writeBatch(db);
    for(const event of events.slice(i,i+200))batch.set(doc(reviews(uid),event.id),event);
    await batch.commit();
   }
  }
 };
}
