import { expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { Repository } from '../../src/db/database';
import { makeQuestions, timedResult } from '../../src/review/timed';
import { parseBackup, parseSyncEvent, parseVocabulary } from '../../src/utils/validation';
import candidate from '../../data/vocabulary.pending.json';

const words=parseVocabulary(candidate).words;
const word=words[0];

it('keeps the 5s and 10s boundaries and distinguishes errors from timeouts',()=>{
 expect(timedResult(true,4999)).toMatchObject({grade:'good',attempt:{result:'correct',elapsed_ms:4999}});
 expect(timedResult(true,5000)).toMatchObject({grade:'hard',attempt:{result:'correct',elapsed_ms:5000}});
 expect(timedResult(true,9999).grade).toBe('hard');
 expect(timedResult(false,2000)).toMatchObject({grade:'again',attempt:{result:'incorrect'}});
 expect(timedResult(true,10000)).toMatchObject({grade:'again',attempt:{result:'timeout',elapsed_ms:10000}});
});

it('makes four distinct choices and excludes overlapping senses',()=>{
 const same={...words[1],meaning:[word.meaning[0]]};
 const pool=[word,same,...words.slice(2,15)];
 const [question]=makeQuestions([word],pool,1,()=>0.5);
 expect(question.choices).toHaveLength(4);
 expect(new Set(question.choices.map(choice=>choice.text)).size).toBe(4);
 expect(question.choices.map(choice=>choice.id)).toContain(word.id);
 expect(question.choices.map(choice=>choice.id)).not.toContain(same.id);
 expect(makeQuestions([word],pool.slice(0,3),1)).toEqual([]);
});

it('merges offline histories once in order and retains timed results in a backup',async()=>{
 const desktop=new Repository('timed-desktop'),phone=new Repository('timed-phone'),fresh=new Repository('timed-new');
 await desktop.importWords([word]);await phone.importWords([word]);
 const fast=timedResult(true,2000),timeout=timedResult(false,10000);
 await desktop.grade(word.id,fast.grade,1000000,fast.attempt);
 await phone.grade(word.id,timeout.grade,2000000,timeout.attempt);
 const desktopEvent=(await desktop.snapshot()).reviews[0];
 const phoneEvent=(await phone.snapshot()).reviews[0];
 expect(await desktop.mergeReviewEvents([phoneEvent,phoneEvent],words)).toBe(true);
 expect(await phone.mergeReviewEvents([desktopEvent],words)).toBe(true);
 expect(await phone.mergeReviewEvents([desktopEvent],words)).toBe(false);
 expect((await desktop.snapshot()).progress).toEqual((await phone.snapshot()).progress);
 expect((await desktop.snapshot()).reviews).toEqual((await phone.snapshot()).reviews);
 await fresh.mergeReviewEvents([phoneEvent,desktopEvent],words);
 expect((await fresh.snapshot()).words.map(item=>item.id)).toEqual([word.id]);
 const backup=await fresh.backup();
 expect(parseBackup(backup).reviews.map(event=>event.attempt?.result).sort()).toEqual(['correct','timeout']);
 expect(parseSyncEvent({...desktopEvent,grade:'again'})).toBeNull();
 expect(await fresh.claimSyncOwner('owner')).toBe(true);
 await fresh.restore(backup);
 expect(await fresh.claimSyncOwner('other')).toBe(false);
});
