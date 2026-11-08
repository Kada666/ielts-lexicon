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
  scopeLabel:'List 1～4',importTitle:'List 1～4 · 词库与手写记忆法',
  sourceDescription:'根据《词汇整理.pdf》核对 139 词，补入 List 4 的 pirate 和「练」组 6 词，并整理 91 条手写记忆法。',
  reviewNotice:'「练」是总表单列的练习组，复习间隔沿用模糊词规则。手写记忆法保留 PDF 页码；释义和记忆内容可逐条核验。',
  confirmationLabel:'我已核对以上词形和原始分组，同意将所选词条导入。',
  ranges:[{value:'initial',label:'List 1 + List 2',listIds:[1,2]},{value:'recent',label:'List 3 + List 4',listIds:[3,4]}],
  images:[],
  supplement:{range:'recent',label:'补充 List 3 + List 4',description:'90 个词 · 保留已有复习记录'}
};
