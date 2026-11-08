export type Level = 'unknown' | 'uncertain';
export type Status = 'needs_review' | 'reviewed';
export type MnemonicType = 'etymology' | 'morphology' | 'phonetic' | 'onomatopoeia' | 'association' | 'word_family';
export interface MnemonicSegment { part: string; meaning: string; cue?: string }
export interface MnemonicRelation { term: string; meaning: string }
export interface Mnemonic {
  id: string; type: MnemonicType; title: string; content: string; source: 'user' | 'codex';
  status: Status; preferred: boolean; segments?: MnemonicSegment[]; reference?: string; revision?: number;
  cue?: string; related?: MnemonicRelation[];
}
export interface Word {
  id: string; word: string; list_ids: number[]; initial_level: Level;
  origins: { list: number | null; symbol: '○' | '△' | '练'; source: string; raw: string; kind?: 'book' | 'listening' | 'reading' | 'writing' | 'speaking' | 'other' }[];
  meaning: string[]; phonetic: string; part_of_speech: string[]; example: string; example_zh: string;
  collocations: string[]; mnemonics: Mnemonic[]; content_status: Status; transcription_status: Status; notes: string;
}
export interface VocabularyFile { format: 'ielts-lexicon-vocabulary'; schema_version: 1; words: Word[] }
export interface Progress {
  word_id: string; state: 'new' | 'learning' | 'review' | 'mastered'; due: number; interval: number;
  streak: number; lapses: number; reviews: number; last_review: number | null; algorithm: 'simple-v1';
}
export type Grade = 'again' | 'hard' | 'good';
export interface Review { id: string; word_id: string; at: number; grade: Grade; before: Progress; after: Progress }
export interface Override { word_id: string; meaning: string[]; example: string; example_zh: string; collocations: string[]; mnemonics: Mnemonic[]; updated_at: number }
export interface Settings { phonetic: boolean; mnemonics: boolean; example: boolean; daily_limit: number }
export interface Snapshot { words: Word[]; progress: Progress[]; reviews: Review[]; overrides: Override[]; settings: Settings }
export interface Backup extends Snapshot { format: 'ielts-lexicon-backup'; schema_version: 2; exported_at: string }
export const defaults: Settings = { phonetic: true, mnemonics: true, example: true, daily_limit: 20 };
export function initialMark(word: Word) {
  if (word.initial_level === 'unknown') return '○';
  return word.origins.some(origin => origin.symbol === '△') ? '△' : '练';
}
export const initialLabels = { '○': '陌生', '△': '模糊', '练': '练习' };
export const mnemonicLabels: Record<MnemonicType, string> = { etymology: '真实词源', morphology: '构词拆解', phonetic: '谐音联想', onomatopoeia: '拟声记忆', association: '自由联想', word_family: '词族联想' };
