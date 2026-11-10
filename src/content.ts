import pending from '../data/vocabulary.pending.json';
import reviewed from '../data/vocabulary.json';
export interface ContentConfiguration {
  importTitle: string; sourceDescription: string; reviewNotice: string; confirmationLabel: string;
  ranges: {value:string;label:string;listIds:number[]}[];
  images: {list:number;url:string}[];
  supplements: {range:string;label:string}[];
}
export const pendingFile=pending;
export const reviewedFile=reviewed;
export const content: ContentConfiguration = {
  importTitle:'List 1～5 · 词库与手写记忆法',
  sourceDescription:'已整理 184 词和 118 条手写记忆法。List 5 可单独核对并导入。',
  reviewNotice:'List 4 和 List 5 的「续」归入 ○ 陌生词。手写记忆法保留 PDF 页码；释义和记忆内容可逐条核验。',
  confirmationLabel:'我已核对以上词形和原始分组，同意将所选词条导入。',
  ranges:[{value:'initial',label:'List 1 + List 2',listIds:[1,2]},{value:'recent',label:'List 3 + List 4',listIds:[3,4]}],
  images:[],
  supplements: [{range:'5',label:'补充 List 5'},{range:'recent',label:'补充 List 3 + List 4'}]
};
