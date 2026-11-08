import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { collection, doc, getFirestore, onSnapshot, writeBatch } from 'firebase/firestore';
import type { ReviewEvent } from '../types';
import { parseSyncEvent } from '../utils/validation';

export function createCloud(config: FirebaseOptions) {
 const app=getApps().find(entry=>entry.name==='lexicon-sync')??initializeApp(config,'lexicon-sync');
 const auth=getAuth(app),db=getFirestore(app);
 const reviews=(uid:string)=>collection(db,'users',uid,'reviews');
 return {
  watchUser:(callback:(user:User|null)=>void)=>onAuthStateChanged(auth,callback),
  signIn:(email:string,password:string)=>signInWithEmailAndPassword(auth,email,password),
  signOut:()=>signOut(auth),
  watchReviews:(uid:string,update:(events:ReviewEvent[])=>void,fail:(error:Error)=>void)=>
   onSnapshot(reviews(uid),{includeMetadataChanges:true},snapshot=>{
    if(snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites)return;
    const events=snapshot.docs.flatMap(row=>{
     const event=parseSyncEvent(row.data());
     return event?.id===row.id?[event]:[];
    });
    update(events);
   },fail),
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
