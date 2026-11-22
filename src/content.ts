import pending from '../data/vocabulary.pending.json';
import reviewed from '../data/vocabulary.json';
export interface ContentConfiguration {
  importTitle: string; sourceDescription: string; reviewNotice: string; confirmationLabel: string;
  ranges: {value:string;label:string;listIds:number[]}[];
  images: {list:number;url:string}[];
}
export const pendingFile=pending;
export const pendingLists=[...new Set(pending.words.flatMap(word=>word.list_ids))].sort((a,b)=>a-b);
export const reviewedFile=reviewed;
export const content: ContentConfiguration = {
  importTitle:pendingLists.length?`List ${pendingLists[0]}～${pendingLists.at(-1)} · 词库与手写记忆法`:'词库与手写记忆法',
  sourceDescription:`已整理 ${pending.words.length} 个词 · ${pendingLists.length} / 50 个 List`,
  reviewNotice:'按总表保留 ○ 陌生和 △ 模糊标记。手写记忆法附 PDF 页码，可逐条核验。',
  confirmationLabel:'我已核对以上词形和原始分组，同意将所选词条导入。',
  ranges:[{value:'initial',label:'List 1 + List 2',listIds:[1,2]},{value:'recent',label:'List 3 + List 4',listIds:[3,4]}],
  images:[],
};
