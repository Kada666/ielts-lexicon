import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export function convertMarkdown(markdown) {
  markdown = markdown.replace(/\r\n/g, '\n');
  const section = markdown.split('## 词条\n')[1]?.split('## 需人工辨认')[0];
  if(!section) throw new Error('缺少词条表格');
  const match = markdown.match(/<!-- word-details -->\s*```json\s*([\s\S]*?)```/);
  const details = new Map((match?JSON.parse(match[1]):[]).map(x=>[x.word,x]));
  const map=new Map(); const issues=[];
  for(const line of section.split('\n').filter(l=>/^\|\s*\d/.test(l))) {
    const cells=line.split('|').slice(1,-1).map(s=>s.trim());
    if(cells.length!==8) throw new Error(`表格列数不是 8: ${line}`);
    const [listRaw,rawWord,level,symbol,meaning,notes,transcription,content]=cells;
    const list=Number(listRaw); const word=rawWord.toLowerCase().replace(/\s+/g,' ');
    if(!Number.isInteger(list)||list<1||list>50||!/^[a-z]+(?:[ '-][a-z]+)*$/.test(word)) throw new Error(`非法 List 或词形: ${line}`);
    if(!['unknown','uncertain'].includes(level)||!(level==='unknown'?symbol==='○':['△','练'].includes(symbol))) throw new Error(`分类与符号冲突: ${word}`);
    if(!meaning||![transcription,content].every(s=>['needs_review','reviewed'].includes(s))) throw new Error(`缺少释义或审核状态: ${word}`);
    const d=details.get(word)??{};
    const mnemonics=d.mnemonics??[];
    if(mnemonics.filter(m=>m.preferred).length>1||mnemonics.some(m=>!['etymology','morphology','phonetic','onomatopoeia','association','word_family'].includes(m.type)||!['reviewed','needs_review'].includes(m.status))) throw new Error(`记忆法无效: ${word}`);
    const entry={id:'word_'+word.replace(/ /g,'_'),word,list_ids:[list],initial_level:level,origins:[{list,symbol,source:`data/vocabulary_master.md#list-${list}`,raw:d.raw??rawWord}],meaning:meaning.split('；').filter(Boolean),phonetic:d.phonetic??'',part_of_speech:d.part_of_speech??[],example:d.example??'',example_zh:d.example_zh??'',collocations:d.collocations??[],mnemonics,content_status:content,transcription_status:transcription,notes};
    const key=entry.id+'|'+transcription; const old=map.get(key);
    if(old) {old.list_ids=[...new Set([...old.list_ids,list])].sort((a,b)=>a-b);old.origins.push(...entry.origins);old.meaning=[...new Set([...old.meaning,...entry.meaning])];if(level==='unknown')old.initial_level='unknown';issues.push(`合并重复词 ${word}`);}
    else map.set(key,entry);
  }
  return {words:[...map.values()].filter(w=>w.transcription_status==='reviewed'),pending:[...map.values()].filter(w=>w.transcription_status!=='reviewed'),issues};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
 const master=await readFile('data/vocabulary_master.md','utf8');
 const result=convertMarkdown(master);
 const file=words=>JSON.stringify({format:'ielts-lexicon-vocabulary',schema_version:1,words},null,2)+'\n';
 await mkdir('data',{recursive:true}); await writeFile('data/vocabulary.json',file(result.words)); await writeFile('data/vocabulary.pending.json',file(result.pending));
 await writeFile('data/vocabulary.list_03_04.json',file([...result.words,...result.pending].filter(w=>w.list_ids.some(n=>n===3||n===4))));
 await mkdir('data/notes',{recursive:true});
 for(const list of [...new Set([...result.words,...result.pending].flatMap(w=>w.list_ids))].sort((a,b)=>a-b)){
   const words=[...result.words,...result.pending].filter(w=>w.list_ids.includes(list));
   const lines=words.map(w=>{const origin=w.origins.find(o=>o.list===list);return `| ${w.word} | ${origin.raw} | ${origin.symbol} | ${w.meaning.join('；')} | ${w.notes} |`;});
   const unresolved=list===4?master.split('## 需人工辨认 / 分类')[1]?.split('## 词条补充资料')[0]?.trim():undefined;
   const notes=words.flatMap(w=>w.mnemonics.filter(m=>m.id.startsWith('pdf_note_')).map(m=>{
     const segments=m.segments?.map(s=>`${s.part}＝${s.meaning}`).join('、');
     return `- **${w.word} · ${m.title}**　${segments?segments+'。':''}${m.content}（${m.reference}）`;
   }));
   await writeFile(`data/notes/list_${String(list).padStart(2,'0')}.md`,`# List ${list} 手写笔记文字版\n\n共 ${words.length} 词。○ 表示陌生，△ 表示模糊，练表示原笔记单列的练习组。语言内容仍需审核。\n\n| 单词候选 | 原始写法 | 原始标记 | 中文义候选 | 备注 |\n| --- | --- | --- | --- | --- |\n${lines.join('\n')}\n${unresolved?'\n## 辨认或分类待确认\n\n'+unresolved+'\n':''}${notes.length?'\n## 手写记忆法\n\n'+notes.join('\n')+'\n':''}`);
 }
 console.log(`词库构建：已审核 ${result.words.length}，待核对 ${result.pending.length}。${result.issues.join('；')}`);
}
