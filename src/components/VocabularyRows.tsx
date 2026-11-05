import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Pencil } from 'lucide-react';
import type { Progress, Word } from '../types';
const labels={new:'未学习',learning:'巩固中',review:'复习中',mastered:'已掌握'};
export default function VocabularyRows({words,onEdit,progressFor,now}:{words:Word[];onEdit:(word:Word)=>void;progressFor:(word:Word)=>Progress;now:number}){
 const [limit,setLimit]=useState(40),sentinel=useRef<HTMLDivElement>(null);
 useEffect(()=>setLimit(40),[words.map(w=>w.id).join('|')]);
 useEffect(()=>{if(!sentinel.current||limit>=words.length)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting&&window.matchMedia('(max-width:760px)').matches)setLimit(n=>Math.min(n+40,words.length));},{rootMargin:'300px'});observer.observe(sentinel.current);return()=>observer.disconnect();},[limit,words.length]);
 const source=(word:Word)=>word.list_ids.length?word.list_ids.map(n=>`L${String(n).padStart(2,'0')}`).join(' · '):word.origins[0]?.source??'其他';
 return <>
  <div className="table-scroll desktop-vocabulary"><table><thead><tr><th>单词 / 核心义</th><th>来源</th><th>初始分类</th><th>学习状态</th><th>下次复习</th><th><span className="sr-only">编辑</span></th></tr></thead><tbody>{words.slice(0,limit).map(w=>{const p=progressFor(w);return <tr key={w.id}><td><button className="word-link" onClick={()=>onEdit(w)}>{w.word}</button><span className="table-meaning">{w.meaning.join('；')}</span></td><td><span className="source-chip">{source(w)}</span></td><td><span className={w.initial_level==='unknown'?'unknown-label':'uncertain-label'}>{w.initial_level==='unknown'?'○ 陌生':'△ 模糊'}</span></td><td><span className="badge">{labels[p.state]}</span></td><td className="muted">{p.due<=now?'现在可学':new Date(p.due).toLocaleDateString()}</td><td><button className="icon-button" aria-label={`编辑 ${w.word}`} onClick={()=>onEdit(w)}><Pencil size={16}/></button></td></tr>;})}</tbody></table></div>
  <ul className="mobile-vocabulary" aria-label="词汇速览">{words.slice(0,limit).map(w=><li key={w.id}><button className="mobile-word-row" aria-label={`编辑 ${w.word}`} onClick={()=>onEdit(w)}><span className="mobile-word-main"><span className="mobile-word-line"><span className={`level-symbol ${w.initial_level}`} title={w.initial_level==='unknown'?'初始陌生':'初始模糊'}>{w.initial_level==='unknown'?'○':'△'}</span><strong className={w.word.length>13?'long-word':''}>{w.word}</strong></span><span className="mobile-word-source">{source(w)}</span></span><span className="mobile-word-meaning">{w.meaning.join('；')}</span></button></li>)}</ul>
  {limit<words.length&&<div className="load-more" ref={sentinel}><button className="secondary" onClick={()=>setLimit(n=>n+40)}>继续显示词汇 <ChevronDown size={17}/></button></div>}
 </>;
}
