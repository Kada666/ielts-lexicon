import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { openDB, deleteDB } from 'idb';
import { Repository, connect, effectiveWords } from '../../src/db/database';
import { ALGORITHM, DAY, freshProgress, recallAt, schedule } from '../../src/review/scheduler';
import { mergeWords, parseBackup, parseVocabulary, stableId } from '../../src/utils/validation';
import { defaults, type Word } from '../../src/types';
import candidate from '../../data/vocabulary.pending.json';
import { convertMarkdown } from '../../scripts/build-vocabulary.mjs';
import { readFileSync } from 'node:fs';
const words=parseVocabulary(candidate).words;
const notebooks=[1,2,3,4,5,6,7].map(list=>({list,markdown:readFileSync(`data/notes/list_0${list}.md`,'utf8')}));
const word=words.find(w=>w.word==='delve')!;
const name='lexicon-unit'; const repo=new Repository(name);
beforeEach(async()=>{await deleteDB(name);});
describe('图片转录与 Markdown',()=>{
 it('保留初始 List 1/2 共49词及29/20分类；额外 List 来源独立',()=>{
  const initial=words.filter(w=>w.list_ids.some(n=>n===1||n===2));
  expect(initial).toHaveLength(49);expect(initial.filter(w=>w.initial_level==='unknown')).toHaveLength(29);expect(initial.filter(w=>w.initial_level==='uncertain')).toHaveLength(20);
  expect(words.filter(w=>w.list_ids.includes(3))).toHaveLength(43);expect(words.filter(w=>w.list_ids.includes(4))).toHaveLength(47);
  expect(words.find(w=>w.word==='pirate')?.origins[0]).toMatchObject({list:4,symbol:'○',raw:'pricate'});
  const list4=words.filter(w=>w.list_ids.includes(4));
  expect(list4.filter(w=>w.origins.some(o=>o.list===4&&o.symbol==='○'))).toHaveLength(28);
  expect(list4.find(w=>w.word==='anthropologist')?.initial_level).toBe('unknown');
  expect(words.some(w=>w.word==='pricate')).toBe(false);
  const notes=words.filter(w=>w.list_ids.some(list=>list<=4)).flatMap(w=>w.mnemonics.filter(m=>m.id.startsWith('pdf_note_')));
  expect(notes).toHaveLength(91);expect(notes.every(m=>m.source==='user'&&m.preferred&&/List[1-4]\.pdf/.test(m.reference??''))).toBe(true);
  expect(notes.every(m=>m.revision===2)).toBe(true);
  expect(words.every(w=>w.mnemonics.every(m=>m.status==='needs_review'))).toBe(true);
 });
 it('转换幂等、待审核不进入正式 JSON、仅明确审核词条进入正式词库',()=>{
  const text=readFileSync('data/vocabulary_master.md','utf8');const result=convertMarkdown(text,notebooks);
  expect(result.words).toHaveLength(0);expect(result.pending).toEqual(words);
  expect(convertMarkdown(text.replace(/\r?\n/g,'\r\n'),notebooks.map(n=>({...n,markdown:n.markdown.replace(/\r?\n/g,'\r\n')})))).toEqual(result);
  const changed=text.replace('| 深入探究；挖掘 |  | needs_review | needs_review |','| 深入探究；挖掘 |  | reviewed | needs_review |');
  expect(convertMarkdown(changed,notebooks).words.map(w=>w.word)).toEqual(['delve']);
  const astrology=result.pending.find(w=>w.word==='astrology')!.mnemonics[0];
  expect(astrology.segments?.[0]).toEqual({part:'astro-',meaning:'星星、天体（star）',cue:'控制住你的一切'});
  expect(astrology.related?.map(r=>r.term)).toEqual(['astronaut','astronomy']);
  expect(result.pending.find(w=>w.word==='flap')!.mnemonics[0].cue).toBe('飞着扑过来');
 });
 it('拒绝分组冲突、缺列和无效 List',()=>{
  const text=readFileSync('data/vocabulary_master.md','utf8');
  expect(()=>convertMarkdown(text.replace('| 1 | delve | unknown | ○','| 1 | delve | unknown | △'))).toThrow();
  expect(()=>convertMarkdown(text.replace('| 1 | delve','| 51 | delve'))).toThrow();
 });
 it('List3/4 共90词补全例句、译文、音标与词性，专用导入文件与主库一致',()=>{
  const additions=words.filter(w=>w.list_ids.some(n=>n===3||n===4));
  expect(additions).toHaveLength(90);
  expect(additions.every(w=>w.phonetic&&w.part_of_speech.length&&w.example&&w.example_zh&&w.mnemonics.length)).toBe(true);
  const supplement=parseVocabulary(JSON.parse(readFileSync('data/vocabulary.list_03_04.json','utf8')));
  expect(supplement.words).toEqual(additions);
  expect(additions.every(w=>w.content_status==='needs_review')).toBe(true);
 });
 it('List 5 的续列归入陌生词，总计 27 个陌生词和 18 个模糊词',()=>{
  const list5=words.filter(w=>w.list_ids.includes(5));
  expect(list5).toHaveLength(45);
  expect(['○','△','练'].map(symbol=>list5.filter(w=>w.origins.some(o=>o.list===5&&o.symbol===symbol)).length)).toEqual([27,18,0]);
  expect(list5.flatMap(w=>w.mnemonics)).toHaveLength(27);
  expect(list5.find(w=>w.word==='compliment')?.mnemonics[0]).toMatchObject({
   source:'user', reference:'手写笔记 List5.pdf · 第 7 页',
   related:[{term:'complement',meaning:'补充、使完善'},{term:'complete',meaning:'完整的、彻底的；完成'}]
  });
  expect(list5.find(w=>w.word==='intern')?.mnemonics[0].related?.[0].term).toBe('internship');
  expect(words.find(w=>w.word==='internship')?.list_ids).toEqual([3]);
  expect(parseVocabulary(JSON.parse(readFileSync('data/vocabulary.list_05.json','utf8'))).words).toEqual(list5);
 });
 it('List 6 保留总表的 37 个词形、分类及 19 条手写联想',()=>{
  const list6=words.filter(w=>w.list_ids.includes(6));
  expect(list6).toHaveLength(37);
  expect(list6.filter(w=>w.initial_level==='unknown')).toHaveLength(19);
  expect(list6.flatMap(w=>w.mnemonics)).toHaveLength(19);
  expect(list6.filter(w=>['corrode','soluble','turret','statistic','statistics','coordinator','coordinate'].includes(w.word))).toHaveLength(7);
  expect(list6.find(w=>w.word==='dormancy')?.mnemonics[0]).toMatchObject({
   source:'user', reference:'手写笔记 List6.pdf · 第 2 页',
   related:[{term:'dormant',meaning:'暂不活跃的、休眠的'},{term:'latent',meaning:'潜在的、尚未显现的'}],
  });
  expect(parseVocabulary(JSON.parse(readFileSync('data/vocabulary.list_06.json','utf8'))).words).toEqual(list6);
 });
 it('List 7 保留续列分类，并把香味与打碎的联想存为记忆笔记',()=>{
  const list7=words.filter(w=>w.list_ids.includes(7));
  expect(list7).toHaveLength(43);
  expect(list7.filter(w=>w.initial_level==='unknown')).toHaveLength(27);
  expect(list7.filter(w=>w.notes.includes('「续」')).map(w=>[w.word,w.origins[0].symbol])).toEqual(
   ['refresher','blaze','unyielding','vernacular','deputy','fragrance'].map(word=>[word,'○'])
  );
  expect(list7.flatMap(w=>w.mnemonics)).toHaveLength(27);
  expect(list7.find(w=>w.word==='fragrance')?.mnemonics[0]).toMatchObject({
   type:'association', reference:'手写笔记 List7.pdf · 第 7 页',
  });
  expect(parseVocabulary(JSON.parse(readFileSync('data/vocabulary.list_07.json','utf8'))).words).toEqual(list7);
 });
});
describe('复习调度',()=>{
 it('陌生词首轮间隔更短，模糊与遗忘各有独立规则',()=>{
  const now=1000,p=freshProgress(word),uncertain={...word,initial_level:'uncertain' as const};
  expect(schedule(word,p,'again',now).due).toBe(now+600000);
  expect(schedule(word,p,'hard',now).interval).toBe(.25);expect(schedule(uncertain,p,'hard',now).interval).toBe(.5);
  expect(schedule(word,p,'good',now).interval).toBe(1);expect(schedule(uncertain,p,'good',now).interval).toBe(2);
 });
 it('连续记住达到7天才掌握，遗忘撤销掌握并累计困难次数',()=>{
  let p=schedule(word,freshProgress(word),'good',1000);
  for(let i=0;i<3;i++)p=schedule(word,p,'good',p.due);
  expect(p.state).toBe('mastered');expect(p.interval).toBeGreaterThanOrEqual(7);
  const failed=schedule(word,p,'again',p.due);expect(failed.state).toBe('learning');expect(failed.streak).toBe(0);expect(failed.lapses).toBe(1);
  for(let i=0;i<20;i++)p=schedule(word,p,'good',p.due);expect(p.interval).toBe(180);
 });
 it('隔一段时间答对的证据更强，慢答仍优于超时，预测随时间下降',()=>{
  const p=schedule(word,freshProgress(word),'good',1000);
  const fast={version:'timed-v1',result:'correct',elapsed_ms:1300} as const;
  const immediate=schedule(word,p,'good',2000,fast);
  const delayed=schedule(word,p,'good',p.due,fast);
  const slow=schedule(word,p,'hard',p.due,{...fast,elapsed_ms:7800});
  const timeout=schedule(word,p,'again',p.due,{...fast,result:'timeout',elapsed_ms:10000});
  expect(delayed.interval).toBeGreaterThan(immediate.interval);
  expect(delayed.interval).toBeGreaterThan(slow.interval);
  expect(slow.interval).toBeGreaterThan(timeout.interval);
  expect(recallAt(delayed,delayed.due)).toBeCloseTo(.85);
  expect(recallAt(delayed,delayed.due+DAY)!).toBeLessThan(recallAt(delayed,delayed.due)!);
 });
});
describe('增量合并与验证',()=>{
 it('规范化稳定ID、同词跨List合并为一条，保留每次原始标记',()=>{
  expect(stableId('  DELVE  ')).toBe(word.id);
  const second={...word,list_ids:[5],initial_level:'uncertain' as const,origins:[{list:5,symbol:'△' as const,source:'sources/list_05.jpg',raw:'delve'}]};
  const result=mergeWords([word],[second]);expect(result).toHaveLength(1);expect(result[0].list_ids).toEqual([1,5]);expect(result[0].initial_level).toBe('unknown');expect(result[0].origins).toHaveLength(2);
 });
 it('拒绝坏字段、非法词形和未来版本',()=>{
  expect(()=>parseVocabulary({...candidate,words:[{...word,id:'x'}]})).toThrow();
  expect(()=>parseVocabulary({...candidate,words:[{...word,meaning:[]}]})).toThrow();
  expect(()=>parseVocabulary({...candidate,schema_version:99})).toThrow();
 });
 it('非List来源可追加；词库文件内人工记忆也优先于自动候选',()=>{
  const external=JSON.parse(readFileSync('data/external-source.example.json','utf8'));expect(parseVocabulary(external).words[0].list_ids).toEqual([]);
  const personal={...word,mnemonics:[{...word.mnemonics[0],source:'user' as const,content:'人工内容'}]};
  expect(mergeWords([personal],[word])[0].mnemonics[0].content).toBe('人工内容');
 });
});
describe('IndexedDB 持久化与备份',()=>{
 it('纠正已保存的续列标记，保留个人来源、复习历史和进度',async()=>{
  const fresh=words.find(w=>w.word==='alluvial')!;
  const [origin]=fresh.origins;
  const old:Word={...fresh,initial_level:'uncertain',origins:[{...origin,symbol:'练'},
   {list:null,symbol:'△',source:'个人阅读',raw:fresh.word,kind:'reading'}]};
  await repo.importWords([fresh]);
  await repo.grade(fresh.id,'good',1000000);
  const before=await repo.snapshot();
  const db=await connect(name);
  await db.put('words',old);
  db.close();
  const corrected=await repo.snapshot();
  expect(corrected.words[0]).toMatchObject({initial_level:'unknown',origins:[origin,old.origins[1]]});
  expect(corrected.reviews).toEqual(before.reviews);
  expect(corrected.progress).toEqual(before.progress);
  await repo.importWords([old]);
  expect(await repo.snapshot()).toEqual(corrected);
 });
 it('修订既有手写笔记且保留个人改写、评分和词义，旧版重导不降级',async()=>{
  const revisions=words.filter(w=>w.word==='astrology'||w.word==='flap');
  const previous=revisions.map(w=>({...w,mnemonics:w.mnemonics.map(({revision,...m})=>({...m,content:'原有手写笔记'}))}));
  await repo.importWords(previous);
  const [astrology,flap]=previous;
  await repo.grade(astrology.id,'again',1000000);
  for(const old of previous){
    const mnemonics=old===flap?old.mnemonics.map(m=>({...m,content:'自己在浏览器里写的口诀'})):old.mnemonics;
    await repo.saveOverride({word_id:old.id,meaning:['我的释义'],example:'',example_zh:'',collocations:[],mnemonics,updated_at:1000});
  }
  const before=await repo.snapshot();
  await repo.applyNotebookRevisions(revisions);
  const updated=await repo.snapshot();
  const effective=effectiveWords(updated);
  expect(effective[0].mnemonics).toEqual(revisions[0].mnemonics);
  expect(effective[0].meaning).toEqual(['我的释义']);
  expect(effective[1].mnemonics[0].content).toBe('自己在浏览器里写的口诀');
  expect(updated.progress).toEqual(before.progress);
  expect(updated.reviews).toEqual(before.reviews);
  await repo.applyNotebookRevisions(revisions);
  await repo.importWords(previous);
  expect(await repo.snapshot()).toEqual(updated);
 });
 it('手写笔记补进已编辑的词，保留个人首选与删除决定',async()=>{
  const [note]=word.mnemonics;
  const personal={...note,id:'personal',content:'之前的首选'};
  await repo.importWords([{...word,content_status:'reviewed',mnemonics:[]}]);
  const override={word_id:word.id,meaning:['我的释义'],example:'',example_zh:'',collocations:[],mnemonics:[personal],updated_at:1000};
  await repo.saveOverride(override);
  await repo.importWords([word]);
  const [updated]=effectiveWords(await repo.snapshot());
  expect(updated.meaning).toEqual(override.meaning);
  expect(updated.mnemonics).toEqual([personal,{...note,preferred:false}]);
  await repo.saveOverride(override);
  await repo.importWords([word]);
  expect(effectiveWords(await repo.snapshot())[0].mnemonics).toEqual([personal]);
 });
 it('重复导入、新List与内容更新均保留评分历史及个人记忆法',async()=>{
  await repo.importWords([word]);await repo.grade(word.id,'again',1000000);
  const edited={word_id:word.id,meaning:['我的释义'],example:'My example.',example_zh:'我的例句',collocations:['my phrase'],mnemonics:[{id:'user-1',type:'phonetic' as const,title:'个人口诀',content:'我的联想',source:'user' as const,status:'reviewed' as const,preferred:true}],updated_at:1000};
  await repo.saveOverride(edited); const before=await repo.snapshot();
  await repo.importWords([{...word,list_ids:[5],origins:[{list:5,symbol:'△',source:'new',raw:'delve'}],initial_level:'uncertain',meaning:['基础更新']},word]);
  const after=await new Repository(name).snapshot();expect(after.words).toHaveLength(1);expect(after.words[0].list_ids).toEqual([1,5]);expect(after.progress).toEqual(before.progress);expect(after.reviews).toEqual(before.reviews);expect(after.overrides).toEqual(before.overrides);expect(effectiveWords(after)[0].meaning).toEqual(['我的释义']);
 });
 it('完整往返恢复保留全部内容；坏备份原子拒绝',async()=>{
  await repo.importWords(words.slice(0,49));await repo.grade(word.id,'hard',1234000);await repo.saveSettings({...defaults,example:false});const backup=await repo.backup();
  await repo.importWords(words.slice(49));await repo.restore(backup);expect(await repo.snapshot()).toEqual({words:backup.words,progress:backup.progress,reviews:backup.reviews,overrides:backup.overrides,settings:backup.settings});
  const bad=structuredClone(backup);bad.progress[0].due=NaN;await expect(repo.restore(bad)).rejects.toThrow();expect((await repo.backup()).reviews).toEqual(backup.reviews);
  expect(()=>parseBackup({...backup,schema_version:999})).toThrow();
  expect(()=>parseBackup({...backup,progress:[]})).toThrow();
 });
 it('V1数据库升级添加个人修改存储，原词汇与历史不被清空',async()=>{
  const legacy=await openDB(name,1,{upgrade(db){db.createObjectStore('words',{keyPath:'id'});db.createObjectStore('progress',{keyPath:'word_id'});db.createObjectStore('reviews',{keyPath:'id'});db.createObjectStore('meta');}});
  await legacy.put('words',word);await legacy.put('progress',freshProgress(word));legacy.close();
  const upgraded=await connect(name);expect(upgraded.version).toBe(3);expect(await upgraded.get('words',word.id)).toEqual(word);expect(upgraded.objectStoreNames.contains('overrides')).toBe(true);upgraded.close();
 });
 it('从旧版备份重算历史并保留快测原始事件和字号设置',async()=>{
  const old={...freshProgress(word),algorithm:'simple-v1' as const,stability_days:undefined};
  const at=1000;
  const after={...old,state:'learning' as const,due:at+DAY*.25,interval:.25,reviews:1,last_review:at};
  const event={id:'old-timed',word_id:word.id,grade:'hard' as const,at,
    attempt:{version:'timed-v1' as const,result:'correct' as const,elapsed_ms:6300}};
  await repo.restore({format:'ielts-lexicon-backup',schema_version:2,exported_at:new Date().toISOString(),
    words:[word],progress:[after],reviews:[{...event,before:old,after}],overrides:[],
    settings:{...defaults,text_size:'large'}});
  const upgraded=await repo.snapshot();
  expect(upgraded.progress[0]).toMatchObject({algorithm:ALGORITHM,due:at+DAY*.5});
  expect(upgraded.reviews[0]).toMatchObject(event);
  expect(upgraded.settings.text_size).toBe('large');
  expect(await repo.snapshot()).toEqual(upgraded);
 });
 it('V1备份迁移补默认设置；保留用户历史',async()=>{
  await repo.importWords([word]);const backup=await repo.backup();const v1={...backup,schema_version:1,settings:undefined};expect(parseBackup(v1).settings).toEqual(defaults);
 });
});
