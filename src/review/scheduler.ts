import type { Grade, Progress, Word } from '../types';
export const DAY = 86400000;
export function freshProgress(w: Pick<Word, 'id' | 'initial_level'>): Progress {
  return { word_id: w.id, state: 'new', due: 0, interval: 0, streak: 0, lapses: 0, reviews: 0, last_review: null, algorithm: 'simple-v1' };
}
export function schedule(word: Pick<Word, 'id' | 'initial_level'>, current: Progress, grade: Grade, now: number): Progress {
  let interval: number, streak = 0;
  if (grade === 'again') interval = 10 / 1440;
  else if (grade === 'hard') interval = current.interval ? Math.max(30 / 1440, Math.min(1, current.interval * .5)) : (word.initial_level === 'unknown' ? .25 : .5);
  else { streak = current.streak + 1; interval = current.interval < 1 ? (word.initial_level === 'unknown' ? 1 : 2) : Math.min(180, Math.max(current.interval + 1, Math.round(current.interval * 2.2))); }
  return { ...current, interval, streak, due: now + Math.round(interval * DAY), reviews: current.reviews + 1,
    lapses: current.lapses + Number(grade === 'again'), last_review: now,
    state: grade !== 'good' ? 'learning' : streak >= 3 && interval >= 7 ? 'mastered' : 'review' };
}
export function dayKey(time: number) { const d = new Date(time); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
