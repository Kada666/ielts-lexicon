import pending from '../data/vocabulary.pending.json';
import reviewed from '../data/vocabulary.json';
export interface ContentConfiguration {
  scopeLabel: string; importTitle: string; sourceDescription: string; reviewNotice: string; confirmationLabel: string;
  ranges: {value:string;label:string;listIds:number[]}[];
  images: {list:number;url:string}[];
  supplement: {range:string;label:string;description:string} | null;
}
export const pendingFile=pending;
export const reviewedFile=reviewed;
export const content: ContentConfiguration = {
  scopeLabel:'List 1～4',importTitle:'Markdown 词库 · 待审核词条',
  sourceDescription:'内置 List 1～4 共 132 个候选词，原始笔记已整理为 Markdown；另有 7 条问题保留在审核清单，不发布手写图片。',
  reviewNotice:'请对照 Markdown 主词库检查。hierarchy、wage 和 fauna 保留原始辨认备注；“pricate”和“练”组 6 词尚未纳入。释义与记忆候选仍需审核。',
  confirmationLabel:'我已核对以上词形与 ○ / △ 分组，同意将所选词条导入。',
  ranges:[{value:'initial',label:'List 1 + List 2',listIds:[1,2]},{value:'recent',label:'List 3 + List 4',listIds:[3,4]}],
  images:[],
  supplement:{range:'recent',label:'补充 List 3 + List 4',description:'83 个词 · 中文义、音标、词性、例句与记忆候选 · 保留已有复习记录'}
};
