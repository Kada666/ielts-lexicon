import { describe, expect, it } from 'vitest';
import { chooseBritishVoice } from '../../src/utils/speech';
describe('英式语音选择与离线限制',()=>{
 const britishRemote={lang:'en-GB',localService:false,name:'UK remote'};
 const britishLocal={lang:'en-GB',localService:true,name:'UK local'};
 const american={lang:'en-US',localService:true,name:'US local'};
 it('在线也优先本地英式语音，不选择系统默认的其他口音',()=>{
  expect(chooseBritishVoice([american,britishRemote,britishLocal],true)).toBe(britishLocal);
 });
 it('离线不使用远程语音；缺少英式语音时不冒称英式发音',()=>{
  expect(chooseBritishVoice([american,britishRemote],false)).toBeUndefined();
  expect(chooseBritishVoice([american],true)).toBeUndefined();
  expect(chooseBritishVoice([american,britishRemote],true)).toBe(britishRemote);
 });
});
