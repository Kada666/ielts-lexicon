import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';
import { initialLabels, initialMark, type Word } from '../types';

const scaleKey='lexicon.desktop-vocabulary-scale';
const minScale=90;
const maxScale=160;

function savedScale(){
 try{
  const value=Number(localStorage.getItem(scaleKey));
  if(value>=minScale&&value<=maxScale)return value;
 }catch{/* Storage can be unavailable in restricted browsing contexts. */}
 return 100;
}

function DesktopMeaning({word}:{word:Word}){
 const [touchRevealed,setTouchRevealed]=useState(false);
 return <span className={`meaning-reveal${touchRevealed?' touch-revealed':''}`} tabIndex={0}
  onPointerUp={event=>{if(event.pointerType==='touch')setTouchRevealed(visible=>!visible);}}
  onBlur={()=>setTouchRevealed(false)}>
  <span>{word.meaning.join('；')}</span>
 </span>;
}

export default function VocabularyRows({words,onEdit}:{words:Word[];onEdit:(word:Word)=>void}){
 const [limit,setLimit]=useState(40),sentinel=useRef<HTMLDivElement>(null);
 const [scale,setScale]=useState(savedScale);
 useEffect(()=>setLimit(40),[words.map(w=>w.id).join('|')]);
 useEffect(()=>{if(!sentinel.current||limit>=words.length)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting)setLimit(n=>Math.min(n+40,words.length));},{rootMargin:'300px'});observer.observe(sentinel.current);return()=>observer.disconnect();},[limit,words.length]);
 function changeScale(value:number){
  setScale(value);
  try{localStorage.setItem(scaleKey,String(value));}catch{/* Keep the preference for this view. */}
 }
 const source=(word:Word)=>word.list_ids.length?word.list_ids.map(n=>`L${String(n).padStart(2,'0')}`).join(' · '):word.origins[0]?.source??'其他';
 return <>
  <div className="desktop-vocabulary" style={{'--vocabulary-scale':scale/100} as CSSProperties}>
   <div className="vocabulary-reading-tools">
    <span>悬停释义查看</span>
    <label>字号 <input type="range" aria-label="词库字号" min={minScale} max={maxScale} step={5} value={scale}
     aria-valuetext={`${scale}%`} onChange={e=>changeScale(e.currentTarget.valueAsNumber)}/><span className="vocabulary-scale-value" aria-hidden="true">{scale}%</span></label>
   </div>
   {!!words.length&&<table aria-label="桌面词库">
    <thead><tr><th scope="col">单词</th><th scope="col">释义</th></tr></thead>
    <tbody>{words.slice(0,limit).map(word=>{
     const mark=initialMark(word);
     return <tr key={word.id}>
      <td><div className="desktop-word-line">
       <span className={`level-symbol ${word.initial_level}`} role="img" aria-label={initialLabels[mark]} title={initialLabels[mark]}>{mark}</span>
       <button className="word-link" onClick={()=>onEdit(word)} aria-label={`编辑 ${word.word}`}>{word.word}</button>
       <span className="desktop-word-source">{source(word)}</span>
      </div></td>
      <td><DesktopMeaning word={word}/></td>
     </tr>;
    })}</tbody>
   </table>}
  </div>
  <ul className="mobile-vocabulary" aria-label="词汇速览">{words.slice(0,limit).map(w=><li key={w.id}><button className="mobile-word-row" aria-label={`编辑 ${w.word}`} onClick={()=>onEdit(w)}><span className="mobile-word-main"><span className="mobile-word-line"><span className={`level-symbol ${w.initial_level}`} title={initialLabels[initialMark(w)]}>{initialMark(w)}</span><strong className={w.word.length>13?'long-word':''}>{w.word}</strong></span><span className="mobile-word-source">{source(w)}</span></span><span className="mobile-word-meaning">{w.meaning.join('；')}</span></button></li>)}</ul>
  {limit<words.length&&<div className="load-more" ref={sentinel}><button className="secondary" onClick={()=>setLimit(n=>n+40)}>继续显示词汇 <ChevronDown size={17}/></button></div>}
 </>;
}
