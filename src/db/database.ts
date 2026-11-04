import { openDB, type DBSchema } from 'idb';
import { defaults, type Backup, type Grade, type Override, type Progress, type Review, type Settings, type Snapshot, type Word } from '../types';
import { freshProgress, schedule } from '../review/scheduler';
import { mergeWords, parseBackup, validateWords } from '../utils/validation';
import edition from '../../edition.json';
export const DATABASE_NAME = edition.database_name;
interface Schema extends DBSchema {
  words: { key: string; value: Word }; progress: { key: string; value: Progress };
  reviews: { key: string; value: Review }; overrides: { key: string; value: Override };
  meta: { key: string; value: Settings | string };
}
export function connect(name = DATABASE_NAME) {
  return openDB<Schema>(name, 2, { upgrade(db, old) {
    if (old < 1) { db.createObjectStore('words', {keyPath:'id'}); db.createObjectStore('progress',{keyPath:'word_id'}); db.createObjectStore('reviews',{keyPath:'id'}); db.createObjectStore('meta'); }
    if (old < 2) db.createObjectStore('overrides',{keyPath:'word_id'});
  }, blocked() { if (typeof window !== 'undefined') window.dispatchEvent(new Event('lexicon-db-blocked')); }, blocking(_a,_b,event) { (event.target as IDBDatabase).close(); } });
}
export class Repository {
  constructor(public name = DATABASE_NAME) {}
  async snapshot(): Promise<Snapshot> {
    const db = await connect(this.name); const tx = db.transaction(['words','progress','reviews','overrides','meta'], 'readonly');
    const [words,progress,reviews,overrides,settings] = await Promise.all([tx.objectStore('words').getAll(),tx.objectStore('progress').getAll(),tx.objectStore('reviews').getAll(),tx.objectStore('overrides').getAll(),tx.objectStore('meta').get('settings')]);
    await tx.done; db.close(); return {words,progress,reviews,overrides,settings: typeof settings === 'object' ? settings : {...defaults}};
  }
  async importWords(words: Word[]) {
    validateWords(words); const db = await connect(this.name); const tx = db.transaction(['words','progress'], 'readwrite');
    const merged = mergeWords(await tx.objectStore('words').getAll(),words);
    for (const w of merged) { await tx.objectStore('words').put(w); if (!await tx.objectStore('progress').get(w.id)) await tx.objectStore('progress').put(freshProgress(w)); }
    await tx.done; db.close();
  }
  async grade(wordId: string, grade: Grade, now = Date.now()) {
    const db = await connect(this.name); const tx = db.transaction(['words','progress','reviews'],'readwrite');
    const word = await tx.objectStore('words').get(wordId); if (!word) { tx.abort(); throw new Error('单词不存在，请刷新后重试'); }
    const before = await tx.objectStore('progress').get(wordId) ?? freshProgress(word); const after = schedule(word,before,grade,now);
    await tx.objectStore('reviews').put({id:crypto.randomUUID(),word_id:wordId,at:now,grade,before,after}); await tx.objectStore('progress').put(after); await tx.done; db.close();
  }
  async saveOverride(value: Override) { const db = await connect(this.name); await db.put('overrides',value); db.close(); }
  async saveSettings(value: Settings) { const db = await connect(this.name); await db.put('meta',value,'settings'); db.close(); }
  async backup(): Promise<Backup> { return {format:'ielts-lexicon-backup',schema_version:2,exported_at:new Date().toISOString(),...await this.snapshot()}; }
  async restore(input: unknown) {
    const backup = parseBackup(input); // 任何验证失败均发生在事务之前。
    const db = await connect(this.name); const tx = db.transaction(['words','progress','reviews','overrides','meta'],'readwrite');
    for (const store of ['words','progress','reviews','overrides','meta'] as const) await tx.objectStore(store).clear();
    for (const w of backup.words) await tx.objectStore('words').put(w);
    for (const p of backup.progress) await tx.objectStore('progress').put(p);
    for (const r of backup.reviews) await tx.objectStore('reviews').put(r);
    for (const o of backup.overrides) await tx.objectStore('overrides').put(o);
    await tx.objectStore('meta').put(backup.settings,'settings'); await tx.done; db.close();
  }
}
export function effectiveWords(s: Snapshot) { return s.words.map(w => { const o = s.overrides.find(x=>x.word_id===w.id); return o ? {...w,meaning:o.meaning,example:o.example,example_zh:o.example_zh,collocations:o.collocations,mnemonics:o.mnemonics} : w; }); }
