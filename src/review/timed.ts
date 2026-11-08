import type { Grade, TimedAttempt, Word } from '../types';

export const FAST_MS = 5000;
export const LIMIT_MS = 10000;

export function timedResult(correct: boolean, elapsed: number): { grade: Grade; attempt: TimedAttempt } {
 const elapsed_ms = Math.min(LIMIT_MS, Math.max(0, Math.floor(elapsed)));
 const result = elapsed_ms >= LIMIT_MS ? 'timeout' : correct ? 'correct' : 'incorrect';
 const grade = result !== 'correct' ? 'again' : elapsed_ms < FAST_MS ? 'good' : 'hard';
 return {grade,attempt:{version:'timed-v1',result,elapsed_ms}};
}

export interface Question { word: Word; choices: { id: string; text: string }[] }
const senses = (word: Word) => word.meaning.flatMap(value=>value.normalize('NFKC').toLowerCase()
 .split(/[；;、,，/]+/u).map(s=>s.replace(/[\p{P}\s]/gu,'')).filter(Boolean));

function overlap(left: string[], right: string[]) {
 return left.some(a=>right.some(b=>a===b||(a.length>=2&&b.length>=2&&(a.includes(b)||b.includes(a)))));
}

function shuffle<T>(items: T[], random:()=>number) {
 const copy=[...items];
 for(let i=copy.length-1;i>0;i--){
  const j=Math.floor(random()*(i+1));
  [copy[i],copy[j]]=[copy[j],copy[i]];
 }
 return copy;
}

export function makeQuestions(targets: Word[], pool: Word[], limit: number, random=Math.random): Question[] {
 const candidates=pool.flatMap(word=>{
  const text=word.meaning.find(value=>value.trim())?.trim();
  return text?[{word,text,senses:senses(word)}]:[];
 });
 const byId=new Map(candidates.map(entry=>[entry.word.id,entry]));
 const questions:Question[]=[];
 for(const word of targets){
  const answer=byId.get(word.id);
  if(!answer)continue;
  const wrong=shuffle(candidates,random).filter(entry=>entry.word.id!==word.id);
  wrong.sort((a,b)=>Number(b.word.part_of_speech.some(p=>word.part_of_speech.includes(p)))-
   Number(a.word.part_of_speech.some(p=>word.part_of_speech.includes(p))));
  const picks=[answer];
  for(const candidate of wrong){
   if(picks.some(pick=>overlap(pick.senses,candidate.senses)))continue;
   picks.push(candidate);
   if(picks.length===4)break;
  }
  if(picks.length===4)questions.push({word,choices:shuffle(picks.map(({word,text})=>({id:word.id,text})),random)});
  if(questions.length===limit)break;
 }
 return questions;
}
