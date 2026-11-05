export interface VoiceChoice { lang: string; localService: boolean; default?: boolean }
export function chooseBritishVoice<T extends VoiceChoice>(voices:T[], online:boolean):T|undefined {
  const available=voices.filter(v=>online||v.localService);
  return available.find(v=>/^en[-_]GB$/i.test(v.lang)&&v.localService)
    ?? available.find(v=>/^en[-_]GB$/i.test(v.lang));
}
export function stopSpeech(){if(typeof window!=='undefined'&&'speechSynthesis'in window)window.speechSynthesis.cancel();}
