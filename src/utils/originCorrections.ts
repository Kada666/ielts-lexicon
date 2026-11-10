import type { Word } from '../types';

const continuations = new Map([
  [4, new Set(['mastery', 'precision', 'gloss', 'outward', 'anthropologist', 'comb'])],
  [5, new Set(['windscreen', 'alluvial', 'slum', 'distill', 'medication', 'radius', 'wean', 'delta', 'compliment'])],
]);

/** The handwritten heading 续 continues the ○ column. Older releases transcribed it as 练. */
export function correctContinuationOrigins(word: Word): Word {
  let changed = false;
  const origins = word.origins.map(origin => {
    const { list, symbol, source } = origin;
    if (list === null || symbol !== '练' || source !== `data/vocabulary_master.md#list-${list}` ||
        !continuations.get(list)?.has(word.word)) return origin;
    changed = true;
    return { ...origin, symbol: '○' as const };
  });
  if (!changed) return word;
  const unique = new Map(origins.map(origin => [
    JSON.stringify([origin.list, origin.symbol, origin.source, origin.raw, origin.kind]), origin,
  ]));
  return { ...word, origins: [...unique.values()], initial_level: 'unknown' };
}
