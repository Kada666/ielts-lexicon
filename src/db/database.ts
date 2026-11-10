import { openDB, type DBSchema } from 'idb';
import { defaults, type Backup, type Grade, type Override, type Progress, type Review, type ReviewEvent, type Settings, type Snapshot, type TimedAttempt, type Word } from '../types';
import { ALGORITHM, freshProgress, replayReviews, schedule, upgradeProgress } from '../review/scheduler';
import { mergeNotebookOverride, mergeWords, notebookChanges, parseBackup, parseSyncEvent, validateWords } from '../utils/validation';
import { correctContinuationOrigins } from '../utils/originCorrections';
import edition from '../../edition.json';
export const DATABASE_NAME = edition.database_name;
interface Schema extends DBSchema {
  words: { key: string; value: Word }; progress: { key: string; value: Progress };
  reviews: { key: string; value: Review }; overrides: { key: string; value: Override };
  meta: { key: string; value: Settings | string };
}
export function connect(name = DATABASE_NAME) {
  // Version 3 prevents older open clients from writing the previous scheduling rules.
  return openDB<Schema>(name, 3, { upgrade(db, old) {
    if (old < 1) { db.createObjectStore('words', {keyPath:'id'}); db.createObjectStore('progress',{keyPath:'word_id'}); db.createObjectStore('reviews',{keyPath:'id'}); db.createObjectStore('meta'); }
    if (old < 2) db.createObjectStore('overrides',{keyPath:'word_id'});
  }, blocked() { if (typeof window !== 'undefined') window.dispatchEvent(new Event('lexicon-db-blocked')); }, blocking(_a,_b,event) { (event.target as IDBDatabase).close(); } });
}

function legacySchedules(words: Word[], progress: Progress[], reviews: Review[]) {
  const legacy = new Map(progress.filter(p => p.algorithm !== ALGORITHM).map(p => [p.word_id, p]));
  const history = new Map<string, Review[]>();
  for (const review of reviews) {
    if (!legacy.has(review.word_id)) continue;
    const entries = history.get(review.word_id) ?? [];
    entries.push(review);
    history.set(review.word_id, entries);
  }
  return words.flatMap(word => {
    const previous = legacy.get(word.id);
    if (!previous) return [];
    const events = history.get(word.id);
    return [events?.length ? replayReviews(word, events) : { progress: upgradeProgress(previous), reviews: [] }];
  });
}

export class Repository {
  constructor(public name = DATABASE_NAME) {}
  async snapshot(): Promise<Snapshot> {
    const db = await connect(this.name); const tx = db.transaction(['words','progress','reviews','overrides','meta'], 'readonly');
    const [words,progress,reviews,overrides,settings] = await Promise.all([tx.objectStore('words').getAll(),tx.objectStore('progress').getAll(),tx.objectStore('reviews').getAll(),tx.objectStore('overrides').getAll(),tx.objectStore('meta').get('settings')]);
    await tx.done;
    const misclassified = words.filter(word => correctContinuationOrigins(word) !== word);
    if (misclassified.length) {
      try {
        const update = db.transaction('words', 'readwrite');
        for (const { id } of misclassified) {
          const current = await update.store.get(id);
          if (!current) continue;
          const corrected = correctContinuationOrigins(current);
          if (corrected !== current) await update.store.put(corrected);
        }
        await update.done;
      } finally { db.close(); }
      return this.snapshot();
    }
    if (progress.some(p => p.algorithm !== ALGORITHM)) {
      try {
        const migration = db.transaction(['words','progress','reviews'], 'readwrite');
        const wordStore = migration.objectStore('words');
        const progressStore = migration.objectStore('progress');
        const reviewStore = migration.objectStore('reviews');
        const current = await Promise.all([wordStore.getAll(), progressStore.getAll(), reviewStore.getAll()] as const);
        for (const change of legacySchedules(...current)) {
          await progressStore.put(change.progress);
          for (const review of change.reviews) await reviewStore.put(review);
        }
        await migration.done;
      } finally { db.close(); }
      return this.snapshot();
    }
    db.close();
    return { words, progress, reviews, overrides, settings: { ...defaults, ...(typeof settings === 'object' ? settings : {}) } };
  }
  async importWords(words: Word[]) {
    validateWords(words); const db = await connect(this.name); const tx = db.transaction(['words','progress','overrides'], 'readwrite');
    const previous = await tx.objectStore('words').getAll();
    const previousById = new Map(previous.map(word => [word.id, word]));
    const merged = mergeWords(previous,words);
    for (const incoming of words) {
      const old = previousById.get(incoming.id);
      if (!old) continue;
      const changes = notebookChanges(old, incoming);
      if (!changes.length) continue;
      const overrides = tx.objectStore('overrides');
      const override = await overrides.get(incoming.id);
      if (override) await overrides.put(mergeNotebookOverride(override, old, changes));
    }
    for (const w of merged) { await tx.objectStore('words').put(w); if (!await tx.objectStore('progress').get(w.id)) await tx.objectStore('progress').put(freshProgress(w)); }
    await tx.done; db.close();
  }
  async applyNotebookRevisions(revisions: Word[]) {
    const db = await connect(this.name);
    try {
      const tx = db.transaction(['words', 'overrides'], 'readwrite');
      for (const revised of revisions) {
        const old = await tx.objectStore('words').get(revised.id);
        if (!old) continue;
        const changes = notebookChanges(old, revised);
        if (!changes.length) continue;
        const [word] = mergeWords([old], [{...old, mnemonics: changes}]);
        await tx.objectStore('words').put(word);
        const override = await tx.objectStore('overrides').get(old.id);
        if (override) await tx.objectStore('overrides').put(mergeNotebookOverride(override, old, changes));
      }
      await tx.done;
    } finally {
      db.close();
    }
  }
  async grade(wordId: string, grade: Grade, now = Date.now(), attempt?: TimedAttempt) {
    const db = await connect(this.name);
    try {
      const tx = db.transaction(['words','progress','reviews'], 'readwrite');
      const word = await tx.objectStore('words').get(wordId);
      if (!word) { await tx.done; throw new Error('单词不存在，请刷新后重试'); }
      const progressStore = tx.objectStore('progress');
      const reviewStore = tx.objectStore('reviews');
      const before = await progressStore.get(wordId) ?? freshProgress(word);
      const event = { id: crypto.randomUUID(), word_id: wordId, at: now, grade, initial_level: word.initial_level, ...(attempt ? { attempt } : {}) };
      if (before.last_review !== null && (before.last_review >= now || before.algorithm !== ALGORITHM)) {
        const history = (await reviewStore.getAll()).filter(review => review.word_id === wordId);
        const replayed = replayReviews(word, [...history, event]);
        if (history.length) {
          for (const review of replayed.reviews) await reviewStore.put(review);
          await progressStore.put(replayed.progress);
          await tx.done;
          return;
        }
      }
      const after = schedule(word, before, grade, now, attempt);
      await reviewStore.put({ ...event, before, after });
      await progressStore.put(after);
      await tx.done;
    } finally { db.close(); }
  }
  async claimSyncOwner(owner: string) {
    const db=await connect(this.name);
    try {
      const tx=db.transaction('meta','readwrite');
      const current=await tx.store.get('sync-owner');
      if(!current)await tx.store.put(owner,'sync-owner');
      await tx.done;
      return !current||current===owner;
    } finally {db.close();}
  }
  async syncOwner() {
    const db=await connect(this.name);
    try {return await db.get('meta','sync-owner');}
    finally {db.close();}
  }
  async mergeReviewEvents(events: ReviewEvent[], bundled: Word[]) {
    const db=await connect(this.name);
    try {
      const tx=db.transaction(['words','reviews','progress'],'readwrite');
      const wordStore=tx.objectStore('words'),reviewStore=tx.objectStore('reviews');
      const [localWords,localReviews]=await Promise.all([wordStore.getAll(),reviewStore.getAll()]);
      const words=new Map(localWords.map(word=>[word.id,word]));
      const known=new Set(localReviews.map(review=>review.id));
      const available=new Map(bundled.map(word=>[word.id,word]));
      const additions=new Map<string,ReviewEvent[]>();
      for(const value of events){
        const event=parseSyncEvent(value);
        if(!event||known.has(event.id))continue;
        const word=words.get(event.word_id)??available.get(event.word_id);
        if(!word)continue;
        if(!words.has(word.id)){
          words.set(word.id,word);
          await wordStore.put({...word,transcription_status:'reviewed'});
        }
        known.add(event.id);
        const list=additions.get(word.id)??[];
        list.push(event);
        additions.set(word.id,list);
      }
      if(additions.size){
        for(const review of localReviews)additions.get(review.word_id)?.push(review);
        for(const [wordId,history] of additions){
          const word=words.get(wordId)!;
          const { progress, reviews } = replayReviews(word, history);
          for (const review of reviews) await reviewStore.put(review);
          await tx.objectStore('progress').put(progress);
        }
      }
      await tx.done;
      return additions.size>0;
    } finally {db.close();}
  }
  async saveOverride(value: Override) { const db = await connect(this.name); await db.put('overrides',value); db.close(); }
  async saveSettings(value: Settings) { const db = await connect(this.name); await db.put('meta',value,'settings'); db.close(); }
  async backup(): Promise<Backup> { return {format:'ielts-lexicon-backup',schema_version:2,exported_at:new Date().toISOString(),...await this.snapshot()}; }
  async restore(input: unknown) {
    const backup = parseBackup(input); // 任何验证失败均发生在事务之前。
    const db = await connect(this.name); const tx = db.transaction(['words','progress','reviews','overrides','meta'],'readwrite');
    for (const store of ['words','progress','reviews','overrides'] as const) await tx.objectStore(store).clear();
    for (const w of backup.words) await tx.objectStore('words').put(correctContinuationOrigins(w));
    for (const p of backup.progress) await tx.objectStore('progress').put(p);
    for (const r of backup.reviews) await tx.objectStore('reviews').put(r);
    for (const o of backup.overrides) await tx.objectStore('overrides').put(o);
    await tx.objectStore('meta').put(backup.settings,'settings'); await tx.done; db.close();
  }
}
export function effectiveWords(s: Snapshot) { return s.words.map(w => { const o = s.overrides.find(x=>x.word_id===w.id); return o ? {...w,meaning:o.meaning,example:o.example,example_zh:o.example_zh,collocations:o.collocations,mnemonics:o.mnemonics} : w; }); }
