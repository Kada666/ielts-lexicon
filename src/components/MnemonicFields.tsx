import type { Mnemonic } from '../types';

export type MnemonicDetails = Pick<Mnemonic, 'cue' | 'segments' | 'related'>;

function rows(value: string) {
 return value.split('\n').filter(line => line.trim()).map(line => line.split('=').map(part => part.trim()));
}

export function incompleteMnemonicDetails({segments, related}: MnemonicDetails) {
 return segments?.some(row => !row.part || !row.meaning) || related?.some(row => !row.term || !row.meaning);
}

export default function MnemonicFields({details, onChange}:{details:MnemonicDetails;onChange:(value:Partial<MnemonicDetails>)=>void}){
 return <>
  <label>口诀或声音提示<input defaultValue={details.cue??''} onChange={e=>onChange({cue:e.target.value.trim()})}/></label>
  <label>词根 / 构词分段 <small>每行写「词块 = 含义」，可再加「= 口诀」</small>
   <textarea rows={3} defaultValue={details.segments?.map(s=>[s.part,s.meaning,s.cue].filter(value=>value!==undefined).join(' = ')).join('\n')??''}
    onChange={e=>onChange({segments:rows(e.target.value).map(([part,meaning='',...cue])=>({part,meaning,...(cue.length?{cue:cue.join(' = ')}:{})}))})}/>
  </label>
  <label>关联词 <small>每行写「单词 = 含义或用法」</small>
   <textarea rows={3} defaultValue={details.related?.map(item=>`${item.term} = ${item.meaning}`).join('\n')??''}
    onChange={e=>onChange({related:rows(e.target.value).map(([term,...meaning])=>({term,meaning:meaning.join(' = ')}))})}/>
  </label>
 </>;
}
