import { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { chooseBritishVoice, stopSpeech } from '../utils/speech';
export default function Pronunciation({word,phonetic,showPhonetic=true}:{word:string;phonetic:string;showPhonetic?:boolean}){
 const [playing,setPlaying]=useState(false),[error,setError]=useState('');
 const current=useRef<SpeechSynthesisUtterance|null>(null),timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{current.current=null;if(timeout.current)clearTimeout(timeout.current);stopSpeech();},[word]);
 useEffect(()=>{setPlaying(false);setError('');},[word]);
 function speak(){
  if(!('speechSynthesis'in window)){setError('此浏览器不支持朗读，请使用 Safari、Chrome 或 Edge。');return;}
  stopSpeech();if(timeout.current)clearTimeout(timeout.current);
  const synth=window.speechSynthesis,voices=synth.getVoices(),voice=chooseBritishVoice(voices,navigator.onLine);
  if(!voice&&voices.length){setError(navigator.onLine?'设备未提供英式英语语音，请先在系统语音设置中添加 English (UK)。':'离线英式语音不可用，请在系统中下载 English (UK) 语音。');setPlaying(false);return;}
  if(!voice&&!navigator.onLine){setError('没有可用的本地英式语音，请联网配置 English (UK) 语音后重试。');return;}
  const utterance=new SpeechSynthesisUtterance(word);utterance.lang='en-GB';utterance.rate=.85;utterance.pitch=1;utterance.volume=1;if(voice)utterance.voice=voice;
  current.current=utterance;setError('');setPlaying(true);
  const finish=()=>{if(current.current===utterance){setPlaying(false);current.current=null;if(timeout.current)clearTimeout(timeout.current);}};
  utterance.onend=finish;
  utterance.onerror=event=>{if(current.current!==utterance)return;finish();if(!['canceled','interrupted'].includes(event.error))setError('发音未播放，请检查声音开关及系统 English (UK) 语音。');};
  timeout.current=setTimeout(()=>{if(current.current===utterance){stopSpeech();finish();setError('语音未响应，请检查系统 English (UK) 语音和设备音量。');}},12000);
  synth.speak(utterance);
 }
 return <div className="pronunciation"><button type="button" className={`pronunciation-button ${playing?'is-speaking':''}`} aria-label={`播放 ${word} 英式发音`} aria-pressed={playing} onClick={speak}><Volume2 size={20}/><span>{showPhonetic&&phonetic?phonetic:'听英式发音'}</span><small>UK</small></button>{error&&<p className="speech-error" role="status">{error}</p>}</div>;
}
