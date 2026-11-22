import type { MnemonicEdit, Override, Word } from '../types';
import { validateMnemonics } from '../utils/validation';

export interface MnemonicRecord { word_id: string; at: number; edit_id: string; payload: string }
export const MAX_MNEMONIC_BYTES=60000;
export const compareMnemonicEdits=(left:MnemonicRecord,right:MnemonicRecord)=>
 left.at-right.at||(left.edit_id===right.edit_id?0:left.edit_id>right.edit_id?1:-1);

export function decodeMnemonicRecord(value:unknown,wordId:string) {
 if(!value||typeof value!=='object')return null;
 const {word_id,at,edit_id,payload}=value as Partial<MnemonicRecord>;
 if(word_id!==wordId||typeof word_id!=='string'||word_id.length>180||!/^word_[a-z]+(?:[_'-][a-z]+)*$/.test(word_id)||
  typeof at!=='number'||!Number.isSafeInteger(at)||at<0||at>253402300799999||
  typeof edit_id!=='string'||!/^[a-z0-9-]{1,40}$/.test(edit_id)||
  typeof payload!=='string'||new TextEncoder().encode(payload).length>MAX_MNEMONIC_BYTES)return null;
 try {
  const mnemonics:unknown=JSON.parse(payload);
  validateMnemonics(mnemonics);
  return {record:{word_id,at,edit_id,payload},mnemonics};
 } catch{return null;}
}

export function encodeMnemonics(wordId:string,mnemonics:Override['mnemonics'],edit:MnemonicEdit):MnemonicRecord {
 return {word_id:wordId,at:edit.at,edit_id:edit.id,payload:JSON.stringify(mnemonics.map(note=>({
  id:note.id,type:note.type,title:note.title,content:note.content,source:note.source,status:note.status,preferred:note.preferred,
  cue:note.cue,segments:note.segments?.map(({part,meaning,cue})=>({part,meaning,cue})),
  related:note.related?.map(({term,meaning})=>({term,meaning})),reference:note.reference,revision:note.revision,
 })))};
}

export function localMnemonicRecord(word:Word,override:Override) {
 const record=encodeMnemonics(word.id,override.mnemonics,override.mnemonic_edit??{at:override.updated_at,id:'legacy'});
 if(!override.mnemonic_edit&&record.payload===encodeMnemonics(word.id,word.mnemonics,{at:0,id:'legacy'}).payload)return null;
 return record;
}
