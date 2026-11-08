import { useEffect, useRef, type PointerEvent } from 'react';
import { ChevronUp, Pencil, Sparkles } from 'lucide-react';
import type { Mnemonic, Settings, Word } from '../types';
import { mnemonicLabels } from '../types';
import Pronunciation from './Pronunciation';
function MemoryText({note}:{note:Mnemonic}){
 return <>
  <div className="mnemonic-heading"><span>{mnemonicLabels[note.type]}</span>{note.status==='needs_review'&&<span className="cue-review">候选</span>}</div>
  {['etymology','morphology'].includes(note.type)&&!!note.segments?.length&&<div className="segments">{note.segments.map((s,i)=><div key={i}><strong>{s.part}</strong><span>{s.meaning}</span></div>)}</div>}
  <p>{note.content}</p>
  {note.id.startsWith('pdf_note_')&&note.reference&&<small className="memory-hold-hint">{note.reference}</small>}
 </>;
}
function MemoryCue({mnemonic,alternatives,onEdit}:{mnemonic?:Mnemonic;alternatives:Mnemonic[];onEdit:()=>void}){
 const hold=useRef<ReturnType<typeof setTimeout>|null>(null),start=useRef({x:0,y:0});
 const cancel=()=>{if(hold.current)clearTimeout(hold.current);hold.current=null;};
 useEffect(()=>cancel,[]);
 function down(e:PointerEvent<HTMLElement>){
  if(e.button!==0||(e.target as HTMLElement).closest('button,details'))return;
  cancel();start.current={x:e.clientX,y:e.clientY};hold.current=setTimeout(()=>{hold.current=null;onEdit();},550);
 }
 return <section className="mnemonic quick-memory" aria-label="联想记忆" onPointerDown={down} onPointerMove={e=>{if(Math.hypot(e.clientX-start.current.x,e.clientY-start.current.y)>12)cancel();}} onPointerUp={cancel} onPointerCancel={cancel} onPointerLeave={cancel} onContextMenu={e=>e.preventDefault()}>
  <div className="memory-cue-toolbar"><span><Sparkles size={17}/> 联想</span><button type="button" className="memory-edit-button" onClick={onEdit} aria-label="快速编辑联想"><Pencil size={17}/> 编辑</button></div>
  {mnemonic?<MemoryText note={mnemonic}/>:<p>写一个属于你的小故事，让这个词留下来。</p>}
  {!!alternatives.length&&<details className="memory-alternatives"><summary>其他记忆线索</summary>{alternatives.map(note=><div key={note.id}><MemoryText note={note}/></div>)}</details>}
  <span className="memory-hold-hint">长按这里，快速修改联想</span>
 </section>;
}
export default function RecallCard({word,flipped,onFlip,onEditMnemonic,settings}:{word:Word;flipped:boolean;onFlip:()=>void;onEditMnemonic:()=>void;settings:Settings}){
 const preferred=word.mnemonics.find(m=>m.preferred)??word.mnemonics[0];
 return <article className={`flashcard recall-card ${flipped?'back':''}`} aria-label={`${word.word} 词汇卡片`} onClick={event=>{if(!flipped&&!(event.target as HTMLElement).closest('button,input,textarea,select'))onFlip();}}>
  <div className={flipped?'card-answer':'card-front'}>
   <div className="answer-word"><h2>{word.word}</h2></div>
   <Pronunciation word={word.word} phonetic={word.phonetic} showPhonetic={settings.phonetic}/>
   {flipped?<><div className="core-meaning"><span className="mini-label">意思</span><p>{word.meaning.join('；')}</p></div>{settings.mnemonics&&<MemoryCue key={word.id} mnemonic={preferred} alternatives={word.mnemonics.filter(note=>note.id!==preferred?.id)} onEdit={onEditMnemonic}/>}<button type="button" className="card-collapse" onClick={onFlip}><ChevronUp size={19}/> 收起答案</button></>:<button type="button" className="card-recall-prompt" aria-label={`翻转 ${word.word} 查看答案`} onClick={onFlip}><span>先想一想，这个词是什么意思？</span><strong>轻点翻开</strong></button>}
  </div>
 </article>;
}
