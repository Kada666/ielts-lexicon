import type { Word } from '../types';

export interface ImportRef { word_id: string; list: number }
export const importRefId = ({list,word_id}:ImportRef) => `${list}_${word_id}`;

export function parseImportRef(value:unknown):ImportRef|null {
 if(!value||typeof value!=='object')return null;
 const {word_id,list}=value as Partial<ImportRef>;
 if(typeof word_id!=='string'||word_id.length>180||!/^word_[a-z]+(?:[_'-][a-z]+)*$/.test(word_id)||
  typeof list!=='number'||!Number.isInteger(list)||list<1||list>50)return null;
 return {word_id,list};
}

export function bundledImports(bundled:Word[]) {
 const refs=new Map<string,Word>();
 for(const word of bundled)for(const list of word.list_ids) {
  const origins=word.origins.filter(origin=>origin.list===list);
  if(!origins.length)continue;
  refs.set(importRefId({word_id:word.id,list}),{
   ...word,origins,list_ids:[list],initial_level:origins.some(origin=>origin.symbol==='○')?'unknown':'uncertain',
   transcription_status:'reviewed',
  });
 }
 return refs;
}
