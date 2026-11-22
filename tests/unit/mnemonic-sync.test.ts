import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import candidate from '../../data/vocabulary.pending.json';
import { connect, effectiveWords, Repository } from '../../src/db/database';
import { compareMnemonicEdits, decodeMnemonicRecord, encodeMnemonics, localMnemonicRecord } from '../../src/sync/mnemonics';
import type { Mnemonic, Override } from '../../src/types';
import { parseBackup, parseVocabulary } from '../../src/utils/validation';

const word=parseVocabulary(candidate).words.find(item=>item.word==='clarity')!;
const note:Mnemonic={id:'personal',type:'morphology',title:'我的联想',content:'清晰的状态',source:'user',status:'needs_review',
 preferred:true,cue:'把画面对焦',segments:[{part:'-ity',meaning:'性质或状态'}],related:[{term:'clear',meaning:'清晰的'}]};
const personal=(mnemonics:Mnemonic[],updated_at:number):Override=>({
 word_id:word.id,meaning:['本机释义'],example:'Local example',example_zh:'本机例句',collocations:['local phrase'],mnemonics,updated_at,
});

it('uploads existing personal notes only after opt-in and preserves local definitions and review history',async()=>{
 const desktop=new Repository('mnemonics-desktop'),phone=new Repository('mnemonics-phone');
 await desktop.importWords([word]);
 await phone.importWords([word]);
 const db=await connect(desktop.name);
 await db.put('overrides',personal([note],100));
 db.close();
 const source=(await desktop.snapshot()).overrides[0];
 expect(localMnemonicRecord(word,personal(word.mnemonics,100))).toBeNull();
 const record=localMnemonicRecord(word,source)!;
 expect(Object.keys(record).sort()).toEqual(['at','edit_id','payload','word_id']);
 expect(record.payload).not.toContain('本机释义');
 expect(decodeMnemonicRecord(record,word.id)?.mnemonics).toEqual([note]);
 await phone.saveOverride({...personal(word.mnemonics,50),meaning:['手机释义']});
 await phone.grade(word.id,'good',1000000);
 await phone.claimSyncOwner('same-account');
 const before=await phone.snapshot();
 expect(await phone.mergeMnemonicRecords('same-account',[record])).toBe(false);
 await phone.setMnemonicSync('other-account',true);
 expect(await phone.mnemonicSyncEnabled('other-account')).toBe(false);
 await phone.setMnemonicSync('same-account',true);
 expect(await phone.mergeMnemonicRecords('other-account',[record])).toBe(false);
 expect(await phone.mergeMnemonicRecords('same-account',[record])).toBe(true);
 expect(await phone.mergeMnemonicRecords('same-account',[record])).toBe(false);
 const after=await phone.snapshot();
 expect(effectiveWords(after)[0]).toMatchObject({meaning:['手机释义'],mnemonics:[note]});
 expect(after.reviews).toEqual(before.reviews);
 expect(after.progress).toEqual(before.progress);
 expect(parseBackup(await phone.backup()).overrides[0].mnemonic_edit).toEqual({at:100,id:'legacy'});
});

it('keeps an offline edit ahead of stale cloud data and syncs an intentional deletion',async()=>{
 const phone=new Repository('mnemonics-offline');
 await phone.importWords([word]);
 await phone.claimSyncOwner('owner');
 await phone.setMnemonicSync('owner',true);
 const old=encodeMnemonics(word.id,[note],{at:100,id:'first'});
 await phone.mergeMnemonicRecords('owner',[old]);
 await phone.importWords([{...word,meaning:['词库更新后的释义']}]);
 expect(effectiveWords(await phone.snapshot())[0].meaning).toEqual(['词库更新后的释义']);
 await phone.saveOverride(personal([],200),{mnemonicsOnly:true,originalMnemonics:[note]});
 const deletion=localMnemonicRecord(word,(await phone.snapshot()).overrides[0])!;
 expect(compareMnemonicEdits(deletion,old)).toBeGreaterThan(0);
 expect(decodeMnemonicRecord(deletion,word.id)?.mnemonics).toEqual([]);
 expect(await phone.mergeMnemonicRecords('owner',[old])).toBe(false);
 await phone.saveOverride(personal([note],300),{originalMnemonics:[note]});
 expect(localMnemonicRecord(word,(await phone.snapshot()).overrides[0])).toEqual(deletion);
 expect(await phone.mergeMnemonicRecords('owner',[{...old,at:400,payload:'{}'}])).toBe(false);
 await phone.setMnemonicSync('owner',false);
 expect(await phone.mergeMnemonicRecords('owner',[{...old,at:400}])).toBe(false);
 expect((await phone.snapshot()).overrides[0].mnemonics).toEqual([]);
});
