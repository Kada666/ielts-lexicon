import type { Grade, Progress, ReviewEvent, TimedAttempt, Word } from '../types';
import { FAST_MS } from './timed';
export const DAY = 86400000;
export const RECALL_TARGET = .85;
export const ALGORITHM = 'recall-v2' as const;
const intervalFactor = -Math.log2(RECALL_TARGET);
const lapseInterval = 10 / 1440;
const minInterval = 30 / 1440;
const maxInterval = 180;
const maxStability = maxInterval / intervalFactor;
type ReviewWord = Pick<Word, 'id' | 'initial_level'>;

export function freshProgress(w: Pick<Word, 'id' | 'initial_level'>): Progress {
  return { word_id: w.id, state: 'new', due: 0, interval: 0, streak: 0, lapses: 0, reviews: 0, last_review: null, algorithm: ALGORITHM, stability_days: 0 };
}

export function upgradeProgress(progress: Progress): Progress {
  if (progress.algorithm === ALGORITHM) return progress;
  const stability_days = progress.reviews ? Math.min(maxStability, Math.max(lapseInterval, progress.interval) / intervalFactor) : 0;
  return { ...progress, algorithm: ALGORITHM, stability_days };
}

export function recallAt(progress: Progress, at: number): number | null {
  if (progress.last_review === null || !progress.reviews) return null;
  const stability = upgradeProgress(progress).stability_days!;
  return 2 ** (-Math.max(0, at - progress.last_review) / DAY / stability);
}

export function schedule(word: ReviewWord, current: Progress, grade: Grade, now: number, attempt?: TimedAttempt): Progress {
  const prior = upgradeProgress(current).stability_days!;
  const streak = grade === 'good' ? current.streak + 1 : 0;
  const initial = word.initial_level === 'unknown' ? 1 : 2;
  let stability: number;
  if (grade === 'again') {
    stability = Math.min(.18, Math.max(.035, prior * .35));
  } else if (!prior) {
    const firstInterval = grade === 'good' ? initial : attempt ? .5 + (initial - 1) * .25 : initial * .25;
    stability = firstInterval / intervalFactor;
  } else {
    // Correct recall after a meaningful gap is stronger evidence than immediate repetition.
    const challenge = Math.min(1, (1 - (recallAt(current, now) ?? 1)) / (1 - RECALL_TARGET));
    if (grade === 'good') {
      const gain = attempt ? .7 + .3 * (1 - attempt.elapsed_ms / FAST_MS) : 1.2;
      const recovery = current.interval === lapseInterval ? .25 / intervalFactor : 0;
      stability = Math.max(recovery, prior * (1 + gain * challenge));
    } else {
      // A slower correct choice confirms recognition, while a fuzzy flashcard rating gives weaker evidence.
      stability = attempt ? prior * (.8 + .35 * challenge) : prior * .55;
    }
  }
  const stability_days = Math.min(maxStability, Math.max(minInterval / intervalFactor, stability));
  const interval = grade === 'again' ? lapseInterval : Math.min(maxInterval, stability_days * intervalFactor);
  const state = grade === 'again' || (grade === 'hard' && !attempt) ? 'learning' :
    streak >= 3 && interval >= 7 ? 'mastered' : 'review';
  return { ...current, algorithm: ALGORITHM, stability_days, interval, streak, due: now + Math.round(interval * DAY),
    reviews: current.reviews + 1, lapses: current.lapses + Number(grade === 'again'), last_review: now, state };
}

export function replayReviews(word: ReviewWord, history: ReviewEvent[]) {
  let progress = freshProgress(word);
  const reviews = [...history].sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).map(event => {
    const before = progress;
    progress = schedule({ ...word, initial_level: event.initial_level ?? word.initial_level }, before, event.grade, event.at, event.attempt);
    return { ...event, before, after: progress };
  });
  return { progress, reviews };
}
export function dayKey(time: number) { const d = new Date(time); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
