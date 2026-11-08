import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCheck } from 'lucide-react';
import type { Grade, Settings, TimedAttempt, Word } from '../types';
import { LIMIT_MS, timedResult, type Question } from '../review/timed';
import RecallCard from './RecallCard';

type RecordAnswer = (id:string, grade:Grade, attempt:TimedAttempt)=>Promise<void>;
type Answer = ReturnType<typeof timedResult> & { selected?:string };

function QuizQuestion({question,settings,record,onEdit,onNext,last}:{question:Question;settings:Settings;record:RecordAnswer;onEdit:()=>void;onNext:(attempt:TimedAttempt)=>void;last:boolean}){
 const timer=useRef({elapsed:0,started:null as number|null,done:false});
 const [answer,setAnswer]=useState<Answer|null>(null);
 const [paused,setPaused]=useState(false);
 const [saved,setSaved]=useState(false);
 const [error,setError]=useState(false);
 const save=useCallback(async (value:Answer)=>{
  setError(false);
  try{await record(question.word.id,value.grade,value.attempt);setSaved(true);}
  catch{setError(true);}
 },[question,record]);
 const submit=useCallback((selected?:string)=>{
  const time=timer.current;
  if(time.done||time.started===null||document.hidden)return;
  const elapsed=time.elapsed+performance.now()-time.started;
  time.done=true;
  const value={...timedResult(selected===question.word.id,selected?elapsed:Math.max(LIMIT_MS,elapsed)),selected};
  setAnswer(value);
  void save(value);
 },[question,save]);
 useEffect(()=>{
  let deadline:number|undefined;
  const time=timer.current;
  function pause(){
   window.clearTimeout(deadline);
   if(time.started!==null){time.elapsed+=performance.now()-time.started;time.started=null;}
   if(!time.done)setPaused(true);
  }
  function resume(){
   if(document.hidden||time.done||time.started!==null)return;
   time.started=performance.now();
   setPaused(false);
   deadline=window.setTimeout(()=>submit(),Math.ceil(Math.max(0,LIMIT_MS-time.elapsed)));
  }
  function visibility(){if(document.hidden)pause();else resume();}
  resume();
  document.addEventListener('visibilitychange',visibility);
  window.addEventListener('blur',pause);
  window.addEventListener('focus',resume);
  window.addEventListener('pagehide',pause);
  window.addEventListener('pageshow',resume);
  return ()=>{
   window.clearTimeout(deadline);
   time.started=null;
   document.removeEventListener('visibilitychange',visibility);
   window.removeEventListener('blur',pause);
   window.removeEventListener('focus',resume);
   window.removeEventListener('pagehide',pause);
   window.removeEventListener('pageshow',resume);
  };
 },[submit]);
 if(answer){
  const label=answer.attempt.result==='timeout'?'超时':answer.attempt.result==='incorrect'?'答错了':answer.grade==='good'?'快速认出':'犹豫后认出';
  return <>
   <div className="quiz-result" role="status"><strong>{label}</strong> · {(Math.floor(answer.attempt.elapsed_ms/100)/10).toFixed(1)} 秒</div>
   {answer.attempt.result==='incorrect'&&<p className="quiz-selected">你的选择：{question.choices.find(choice=>choice.id===answer.selected)?.text}</p>}
   <RecallCard word={question.word} flipped settings={settings} onEditMnemonic={onEdit}/>
   <div className="quiz-actions">{error?<button className="secondary" onClick={()=>void save(answer)}>保存失败，点击重试</button>:
    <button className="primary" disabled={!saved} onClick={()=>onNext(answer.attempt)}>{saved?(last?'完成快测':'下一题'):'正在保存…'} <ArrowRight size={18}/></button>}</div>
  </>;
 }
 return <section className="panel quiz-question" aria-label="计时快测题目">
  <p>{paused?'计时已暂停':'选出最符合的中文释义'}</p>
  <h2 lang="en">{question.word.word}</h2>
  <div className="quiz-choices">{question.choices.map(choice=><button key={choice.id} className="secondary" disabled={paused} onClick={()=>submit(choice.id)}>{choice.text}</button>)}</div>
 </section>;
}

export default function TimedQuiz({questions,settings,record,onEdit,onClose}:{questions:Question[];settings:Settings;record:RecordAnswer;onEdit:(word:Word)=>void;onClose:()=>void}){
 const [results,setResults]=useState<TimedAttempt[]>([]);
 const question=questions[results.length];
 if(!question)return <section className="panel review-start">
  <div className="round-icon"><CheckCheck size={30}/></div><h2>快测完成</h2>
  <p>{results.length} 题 · 答对 {results.filter(a=>a.result==='correct').length} · 超时 {results.filter(a=>a.result==='timeout').length}</p>
  <button className="primary" onClick={onClose}>返回复习</button>
 </section>;
 return <div className="study-workspace timed-quiz">
  <div className="study-top"><button className="study-exit" onClick={onClose}><ArrowLeft size={18}/> 结束快测</button>
   <span>第 <strong>{results.length+1}</strong> / {questions.length}</span>
  </div>
  <QuizQuestion key={question.word.id} question={question} settings={settings} record={record}
   onEdit={()=>onEdit(question.word)} last={results.length+1===questions.length}
   onNext={attempt=>setResults(previous=>[...previous,attempt])}/>
 </div>;
}
