import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const noteHeading = '## 手写记忆法\n';
const mnemonicTypes = ['etymology','morphology','phonetic','onomatopoeia','association','word_family'];

function notebookNotes(markdown) {
  return markdown.replace(/\r\n/g, '\n').split(noteHeading)[1]?.split(/^## /m)[0].trim() ?? '';
}

function parseNotebooks(notebooks) {
  const notes = new Map();
  for (const {list, markdown} of notebooks) {
    for (const entry of notebookNotes(markdown).split(/^### /m).filter(Boolean)) {
      const [word, ...lines] = entry.trim().split('\n');
      const fields = new Map();
      for (const line of lines.filter(Boolean)) {
        const field = line.match(/^- ([^：]+)：(.+)$/);
        if (!field) throw new Error(`List ${list} / ${word}: 无法识别 ${line}`);
        const [, label, value] = field;
        if (!['类型','标题','口诀','词块','记忆链','关联词','来源','修订'].includes(label)) throw new Error(`未知笔记字段: ${label}`);
        const values = fields.get(label) ?? [];
        if (values.length && !['词块','关联词'].includes(label)) throw new Error(`重复笔记字段: ${word} / ${label}`);
        fields.set(label, [...values, value.trim()]);
      }
      const first = label => fields.get(label)?.[0];
      const type = first('类型'), title = first('标题'), content = first('记忆链'), reference = first('来源');
      const revision = Number(first('修订'));
      if (!mnemonicTypes.includes(type) || !title || !content || !reference || !Number.isSafeInteger(revision) || revision < 1 || notes.has(word)) {
        throw new Error(`List ${list} / ${word}: 笔记字段缺失、无效或词条重复`);
      }
      const note = {id:`pdf_note_${word}`,type,title,content,source:'user',status:'needs_review',preferred:true,revision,reference};
      if (first('口诀')) note.cue = first('口诀');
      if (fields.has('词块')) note.segments = fields.get('词块').map(line => {
        const [part, meaning, cue] = line.split('|').map(x=>x.trim());
        if (!part || !meaning) throw new Error(`词块缺少拼写或含义: ${word}`);
        return cue ? {part,meaning,cue} : {part,meaning};
      });
      if (fields.has('关联词')) note.related = fields.get('关联词').map(line => {
        const [term, meaning] = line.split('|').map(x=>x.trim());
        if (!term || !meaning) throw new Error(`关联词缺少拼写或含义: ${word}`);
        return {term,meaning};
      });
      notes.set(word,{list,note});
    }
  }
  return notes;
}

export function convertMarkdown(markdown, notebooks = []) {
  markdown = markdown.replace(/\r\n/g, '\n');
  const notesByWord = parseNotebooks(notebooks);
  const matchedNotes = new Set();
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
    const handwritten=notesByWord.get(word);
    const otherMnemonics=d.mnemonics??[];
    const mnemonics=handwritten?[handwritten.note,...otherMnemonics.map(m=>({...m,preferred:false}))]:otherMnemonics;
    if(handwritten?.list===list) matchedNotes.add(word);
    if(mnemonics.filter(m=>m.preferred).length>1||mnemonics.some(m=>!mnemonicTypes.includes(m.type)||!['reviewed','needs_review'].includes(m.status))) throw new Error(`记忆法无效: ${word}`);
    const entry={id:'word_'+word.replace(/ /g,'_'),word,list_ids:[list],initial_level:level,origins:[{list,symbol,source:`data/vocabulary_master.md#list-${list}`,raw:d.raw??rawWord}],meaning:meaning.split('；').filter(Boolean),phonetic:d.phonetic??'',part_of_speech:d.part_of_speech??[],example:d.example??'',example_zh:d.example_zh??'',collocations:d.collocations??[],mnemonics,content_status:content,transcription_status:transcription,notes};
    const key=entry.id+'|'+transcription; const old=map.get(key);
    if(old) {old.list_ids=[...new Set([...old.list_ids,list])].sort((a,b)=>a-b);old.origins.push(...entry.origins);old.meaning=[...new Set([...old.meaning,...entry.meaning])];if(level==='unknown')old.initial_level='unknown';issues.push(`合并重复词 ${word}`);}
    else map.set(key,entry);
  }
  for (const word of notesByWord.keys()) if (!matchedNotes.has(word)) throw new Error(`笔记在所属 List 中找不到词条: ${word}`);
  return {words:[...map.values()].filter(w=>w.transcription_status==='reviewed'),pending:[...map.values()].filter(w=>w.transcription_status!=='reviewed'),issues};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
 const master=await readFile('data/vocabulary_master.md','utf8');
 await mkdir('data/notes',{recursive:true});
 const notebooks=await Promise.all((await readdir('data/notes')).filter(name=>/^list_\d{2}\.md$/.test(name)).map(async name=>({
   list:Number(name.slice(5,7)),markdown:await readFile(`data/notes/${name}`,'utf8')
 })));
 const result=convertMarkdown(master, notebooks);
 const file=words=>JSON.stringify({format:'ielts-lexicon-vocabulary',schema_version:1,words},null,2)+'\n';
 await mkdir('data',{recursive:true}); await writeFile('data/vocabulary.json',file(result.words)); await writeFile('data/vocabulary.pending.json',file(result.pending));
 await writeFile('data/vocabulary.list_03_04.json',file([...result.words,...result.pending].filter(w=>w.list_ids.some(n=>n===3||n===4))));
 await writeFile('data/vocabulary.list_05.json',file([...result.words,...result.pending].filter(w=>w.list_ids.includes(5))));
 await writeFile('data/vocabulary.list_06.json',file([...result.words,...result.pending].filter(w=>w.list_ids.includes(6))));
 await writeFile('data/vocabulary.list_07.json',file([...result.words,...result.pending].filter(w=>w.list_ids.includes(7))));
 for(const list of [...new Set([...result.words,...result.pending].flatMap(w=>w.list_ids))].sort((a,b)=>a-b)){
   const words=[...result.words,...result.pending].filter(w=>w.list_ids.includes(list));
   const lines=words.map(w=>{const origin=w.origins.find(o=>o.list===list);return `| ${w.word} | ${origin.raw} | ${origin.symbol} | ${w.meaning.join('；')} | ${w.notes} |`;});
   const unresolved=list===4?master.split('## 需人工辨认 / 分类')[1]?.split('## 词条补充资料')[0]?.trim():undefined;
   const notebook=notebooks.find(n=>n.list===list)?.markdown ?? '';
   const notes=notebookNotes(notebook);
   const appendix=notebook.replace(/\r\n/g,'\n').match(/^## 补充词缀\n[\s\S]*$/m)?.[0].trim();
   await writeFile(`data/notes/list_${String(list).padStart(2,'0')}.md`,`# List ${list} 手写笔记文字版\n\n共 ${words.length} 词。○ 表示陌生，△ 表示模糊。语言内容仍需审核。\n\n| 单词候选 | 原始写法 | 原始标记 | 中文义候选 | 备注 |\n| --- | --- | --- | --- | --- |\n${lines.join('\n')}\n${unresolved?'\n## 辨认或分类待确认\n\n'+unresolved+'\n':''}${notes?'\n'+noteHeading+'\n'+notes+'\n':''}${appendix?'\n'+appendix+'\n':''}`);
 }
 console.log(`词库构建：已审核 ${result.words.length}，待核对 ${result.pending.length}。${result.issues.join('；')}`);
}
