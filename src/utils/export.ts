import type { Word } from '../types';
export function download(name: string, text: string, mime = 'application/json') {
  const url = URL.createObjectURL(new Blob([text],{type:mime})); const a = document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),3000);
}
export function csv(words: Word[]) {
  const cell = (s: string) => '"' + (/^[=+@\-\t\r]/.test(s) ? "'"+s : s).replace(/"/g,'""') + '"';
  return '\uFEFF' + [['Word','Lists','Initial level','Meaning','Example','Mnemonics'],...words.map(w=>[w.word,w.list_ids.join(';'),w.initial_level,w.meaning.join('；'),w.example,w.mnemonics.map(m=>`${m.type}: ${m.content}`).join(' / ')])].map(row=>row.map(cell).join(',')).join('\r\n');
}
