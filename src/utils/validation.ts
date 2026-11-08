import { defaults, type Backup, type Mnemonic, type Override, type Progress, type Snapshot, type VocabularyFile, type Word } from '../types';
export const normalize = (word: string) => word.trim().toLowerCase().normalize('NFKC').replace(/\s+/g, ' ');
export const stableId = (word: string) => 'word_' + normalize(word).replace(/ /g, '_');
function assert(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const strings = (x: unknown): x is string[] => Array.isArray(x) && x.every(s => typeof s === 'string');
const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0;
const status = (x: unknown) => x === 'reviewed' || x === 'needs_review';
export function validateMnemonics(value: unknown): asserts value is Mnemonic[] {
  assert(Array.isArray(value), '记忆方法必须是数组'); const ids = new Set();
  for (const m of value) {
    assert(record(m) && typeof m.id === 'string' && m.id.length > 0 && !ids.has(m.id), '记忆方法 ID 无效或重复'); ids.add(m.id);
    assert(['etymology','morphology','phonetic','onomatopoeia','association','word_family'].includes(String(m.type)), '未知记忆类型');
    assert(typeof m.title === 'string' && typeof m.content === 'string' && ['user','codex'].includes(String(m.source)) && status(m.status) && typeof m.preferred === 'boolean', '记忆方法字段不完整');
    if (m.cue !== undefined) assert(typeof m.cue === 'string', '口诀无效');
    if (m.segments !== undefined) assert(Array.isArray(m.segments) && m.segments.every(s => record(s) && typeof s.part === 'string' && typeof s.meaning === 'string' && (s.cue === undefined || typeof s.cue === 'string')), '拆解分段无效');
    if (m.related !== undefined) assert(Array.isArray(m.related) && m.related.every(s => record(s) && typeof s.term === 'string' && typeof s.meaning === 'string'), '关联词无效');
    if (m.reference !== undefined) assert(typeof m.reference === 'string', '来源链接无效');
    if (m.revision !== undefined) assert(Number.isSafeInteger(m.revision) && Number(m.revision) > 0, '记忆方法修订号无效');
  }
  assert(value.filter(m => m.preferred).length <= 1, '每个单词最多一个首选记忆法');
}
export function validateWords(value: unknown): Word[] {
  assert(Array.isArray(value) && value.length <= 50000, '词库应为数组，最多 50,000 词');
  for (const w of value) {
    assert(record(w) && typeof w.word === 'string' && /^[a-z]+(?:[ '-][a-z]+)*$/i.test(w.word) && w.id === stableId(w.word), '词形或稳定 ID 无效');
    assert(Array.isArray(w.list_ids) && w.list_ids.every(n => Number.isInteger(n) && n >= 1 && n <= 50), `${w.word}: List 仅支持 1～50，其他来源可留空数组`);
    const listIds = w.list_ids as number[];
    assert(['unknown','uncertain'].includes(String(w.initial_level)) && status(w.content_status) && status(w.transcription_status), `${w.word}: 分类或审核状态无效`);
    assert(strings(w.meaning) && w.meaning.length > 0 && w.meaning.some(m => m.trim()) && strings(w.part_of_speech) && strings(w.collocations), `${w.word}: 释义或搭配格式无效`);
    assert(['phonetic','example','example_zh','notes'].every(k => typeof w[k] === 'string'), `${w.word}: 缺少文本字段`);
    assert(Array.isArray(w.origins) && w.origins.length > 0 && w.origins.every(o => record(o) && (o.list === null || listIds.includes(Number(o.list))) && ['○','△','练'].includes(String(o.symbol)) && typeof o.source === 'string' && !!o.source && typeof o.raw === 'string' && (o.kind === undefined || ['book','listening','reading','writing','speaking','other'].includes(String(o.kind)))), `${w.word}: 来源无效`);
    const origins = w.origins as Word['origins'];
    assert(listIds.every(n => origins.some(o => o.list === n)), `${w.word}: List 缺少原始来源`);
    assert(w.initial_level === (origins.some(o => o.symbol === '○') ? 'unknown' : 'uncertain'), `${w.word}: 分类与原始标记不一致`);
    validateMnemonics(w.mnemonics);
  }
  return value as Word[];
}
export function notebookChanges(previous: Word, incoming: Word) {
  return incoming.mnemonics.filter(note => {
    if (note.source !== 'user' || !note.id.startsWith('pdf_note_')) return false;
    const old = previous.mnemonics.find(m => m.id === note.id);
    return !old || (note.revision ?? 0) > (old.revision ?? 0);
  });
}
function sameNote(left: Mnemonic, right: Mnemonic) {
  return left.id === right.id && left.type === right.type && left.source === right.source &&
    left.title === right.title && left.content === right.content && left.reference === right.reference &&
    left.status === right.status && (left.cue ?? '') === (right.cue ?? '') &&
    JSON.stringify(left.segments ?? []) === JSON.stringify(right.segments ?? []) &&
    JSON.stringify(left.related ?? []) === JSON.stringify(right.related ?? []);
}
export function mergeNotebookOverride(override: Override, previous: Word, notes: Mnemonic[]) {
  const mnemonics = [...override.mnemonics];
  for (const note of notes) {
    const old = previous.mnemonics.find(m => m.id === note.id);
    const index = mnemonics.findIndex(m => m.id === note.id);
    if (old) {
      if (index >= 0 && sameNote(mnemonics[index], old)) {
        mnemonics[index] = {...note, preferred: mnemonics[index].preferred};
      }
      continue;
    }
    if (index >= 0) continue;
    const selected = mnemonics.find(m => m.preferred) ?? mnemonics[0];
    const preferred = !!note.revision && note.preferred && (!selected ||
      (selected.source === 'codex' && previous.mnemonics.some(m => sameNote(m, selected))));
    if (preferred && selected) mnemonics[mnemonics.indexOf(selected)] = {...selected, preferred: false};
    mnemonics.push({...note, preferred});
  }
  return {...override, mnemonics};
}
export function mergeWords(existing: Word[], incoming: Word[]) {
  const map = new Map(existing.map(w => [w.id, structuredClone(w)]));
  for (const source of incoming) {
    const old = map.get(source.id);
    if (!old) { map.set(source.id, structuredClone(source)); continue; }
    const origins = [...old.origins];
    for (const o of source.origins) if (!origins.some(x => JSON.stringify(x) === JSON.stringify(o))) origins.push(o);
    // 已确认资料优先；个人修改另存 overrides，永不由基础词库覆盖。
    const base = old.content_status === 'reviewed' && source.content_status !== 'reviewed' ? old : source;
    const mnemonicMap = new Map(base.mnemonics.map(m => [m.id, {...m}]));
    for (const m of source.mnemonics) if (m.source === 'user' && !mnemonicMap.has(m.id)) mnemonicMap.set(m.id, {...m});
    for (const m of old.mnemonics) if (m.source === 'user' || !mnemonicMap.has(m.id)) mnemonicMap.set(m.id, {...m});
    for (const note of notebookChanges(old, source)) mnemonicMap.set(note.id, {...note});
    const mnemonics = [...mnemonicMap.values()];
    const first = old.mnemonics.find(m=>m.source==='user'&&m.preferred) ??
      mnemonics.find(m=>m.source==='user'&&m.preferred) ?? mnemonics.find(m=>m.preferred);
    for (const m of mnemonics) m.preferred = m.id === first?.id;
    map.set(source.id, { ...base, mnemonics, origins, list_ids: [...new Set([...old.list_ids, ...source.list_ids])].sort((a,b)=>a-b), initial_level: origins.some(o => o.symbol === '○') ? 'unknown' : 'uncertain' });
  }
  return [...map.values()];
}
export function parseVocabulary(value: unknown): VocabularyFile {
  assert(record(value) && value.format === 'ielts-lexicon-vocabulary' && value.schema_version === 1, '不是受支持的词库文件');
  const words = mergeWords([], validateWords(value.words)); return { format: 'ielts-lexicon-vocabulary', schema_version: 1, words };
}
function validateProgress(p: unknown, ids: Set<string>): asserts p is Progress {
  assert(record(p) && ids.has(String(p.word_id)) && ['new','learning','review','mastered'].includes(String(p.state)) && p.algorithm === 'simple-v1', '复习状态或算法无效');
  assert(['due','interval','streak','lapses','reviews'].every(k => finite(p[k])), '复习数值无效');
  assert(finite(p.lapses) && finite(p.reviews) && finite(p.streak) && ['streak','lapses','reviews'].every(k => Number.isInteger(p[k])) && p.lapses <= p.reviews && p.streak <= p.reviews, '复习计数无效');
  assert(p.last_review === null || finite(p.last_review), '复习时间无效');
}
export function parseBackup(input: unknown): Backup {
  assert(record(input) && input.format === 'ielts-lexicon-backup' && [1,2].includes(Number(input.schema_version)), '不是受支持的完整备份');
  // V1 备份无设置；V2 使用默认设置迁移，拒绝未知未来版本。
  const b = { ...input, settings: input.schema_version === 1 ? defaults : input.settings, schema_version: 2 };
  const words = validateWords(input.words); const ids = new Set(words.map(w => w.id));
  assert(ids.size === words.length, '完整备份含重复词 ID');
  for (const k of ['progress','reviews','overrides']) assert(Array.isArray(input[k]), `备份缺少 ${k}`);
  const rows = input as unknown as Snapshot;
  assert(rows.progress.length === words.length && new Set(rows.progress.map(p=>p.word_id)).size === words.length, '每词必须有且只有一条复习状态');
  rows.progress.forEach(p => validateProgress(p, ids));
  assert(new Set(rows.reviews.map(r=>r.id)).size === rows.reviews.length && rows.reviews.length <= 1000000, '历史 ID 重复或条目过多');
  rows.reviews.forEach(r => { assert(typeof r.id === 'string' && !!r.id && ids.has(r.word_id) && finite(r.at) && ['again','hard','good'].includes(r.grade), '复习历史无效'); validateProgress(r.before, ids); validateProgress(r.after, ids); assert(r.before.word_id === r.word_id && r.after.word_id === r.word_id, '历史关联不匹配'); });
  assert(new Set(rows.overrides.map(o=>o.word_id)).size === rows.overrides.length, '个人修改 ID 重复');
  rows.overrides.forEach(o => { assert(ids.has(o.word_id) && strings(o.meaning) && o.meaning.some(m=>m.trim()) && typeof o.example === 'string' && typeof o.example_zh === 'string' && strings(o.collocations) && finite(o.updated_at), '个人修改无效'); validateMnemonics(o.mnemonics); });
  const settings = b.settings;
  assert(record(settings) && ['phonetic','mnemonics','example'].every(k => typeof settings[k] === 'boolean') && Number.isInteger(settings.daily_limit) && Number(settings.daily_limit) >= 1 && Number(settings.daily_limit) <= 500, '设置无效');
  assert(typeof input.exported_at === 'string' && Number.isFinite(Date.parse(input.exported_at)), '备份时间无效');
  return structuredClone(b) as unknown as Backup;
}
