import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { mnemonicLabels, type Mnemonic, type MnemonicType, type Override, type Word } from '../types';
export default function MnemonicEditor({word,busy,onClose,onSave}:{word:Word;busy:boolean;onClose:()=>void;onSave:(value:Override)=>Promise<void>}){
 const original=word.mnemonics.find(m=>m.preferred)??word.mnemonics[0];
 const [text,setText]=useState(original?.content??''),[type,setType]=useState<MnemonicType>(original?.type??'association');
 const ref=useRef<HTMLDivElement>(null),textarea=useRef<HTMLTextAreaElement>(null),previousFocus=useRef(document.activeElement as HTMLElement);
 useEffect(()=>{const overflow=document.body.style.overflow;document.body.style.overflow='hidden';textarea.current?.focus();return()=>{document.body.style.overflow=overflow;previousFocus.current?.focus();};},[]);
 function save(){if(!text.trim()||busy)return;
  const mnemonic:Mnemonic={...(original??{id:crypto.randomUUID(),title:'我的联想',status:'reviewed' as const}),type,content:text.trim(),source:'user',preferred:true};
  if(original&&original.type!==type)mnemonic.title=mnemonicLabels[type];
  if(['etymology','morphology','word_family'].includes(type))mnemonic.status='needs_review';
  if(!['etymology','morphology'].includes(type)){delete mnemonic.segments;if(!mnemonic.id.startsWith('pdf_note_'))delete mnemonic.reference;}
  const mnemonics=word.mnemonics.filter(m=>m.id!==original?.id).map(m=>({...m,preferred:false}));
  mnemonics.unshift(mnemonic);
  void onSave({word_id:word.id,meaning:word.meaning,example:word.example,example_zh:word.example_zh,collocations:word.collocations,mnemonics,updated_at:Date.now()});
 }
 return <div className="modal-backdrop quick-editor-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}><div className="quick-editor" role="dialog" aria-modal="true" aria-labelledby="quick-editor-title" ref={ref} onKeyDown={e=>{if(e.key==='Escape'&&!busy)onClose();if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();save();}if(e.key==='Tab'){const nodes=ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),textarea,select');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}>
  <header><div><span>快速编辑联想</span><h2 id="quick-editor-title">{word.word}</h2></div><button className="icon-button" aria-label="关闭联想编辑" disabled={busy} onClick={onClose}><X size={23}/></button></header>
  <label>记忆方式<select value={type} onChange={e=>setType(e.target.value as MnemonicType)}>{Object.entries(mnemonicLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
  <label>联想内容<textarea ref={textarea} rows={6} value={text} placeholder="写一个画面、一句口诀，或者你自己的故事…" onChange={e=>setText(e.target.value)}/></label>
  <p>只保存到你的浏览器，保留其他词义和记忆候选。</p>
  <div className="quick-editor-actions"><button className="secondary" disabled={busy} onClick={onClose}>取消</button><button className="primary" disabled={busy||!text.trim()} onClick={save}><Check size={20}/> 保存联想</button></div>
 </div></div>;
}
