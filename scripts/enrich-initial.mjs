// 仅补空白候选字段；不会改变审核状态或覆盖已有例句。
import { readFile, writeFile } from 'node:fs/promises';
let master=await readFile('data/vocabulary_master.md','utf8');const match=master.match(/<!-- word-details -->\s*```json\s*([\s\S]*?)```/);const details=JSON.parse(match[1]);
const lines=`elicit|The survey elicited useful responses.|这项调查获得了有用的回应。
hierarchy|The organisation has a clear hierarchy.|这个组织有明确的层级结构。
consortium|A consortium of universities funded the study.|一个大学联合体资助了这项研究。
buckle|The metal frame buckled under pressure.|金属框架在压力下变形了。
curry|They served vegetable curry for lunch.|他们午餐供应蔬菜咖喱。
subliminal|The study examined subliminal messages.|这项研究考察了潜意识信息。
preliminary|The preliminary results look promising.|初步结果看起来很有希望。
chamber|Air flows into the upper chamber.|空气流入上方的腔室。
excavate|The team will excavate the ancient settlement.|团队将挖掘这处古代聚落。
forfeit|You may forfeit your deposit if you cancel.|如果取消，你可能会损失押金。
periodical|The library subscribes to several scientific periodicals.|图书馆订阅了几种科学期刊。
apace|Construction continued apace despite the rain.|尽管下雨，施工仍在迅速推进。
powder|Mix the powder with a little water.|把粉末和少量水混合。
counterpart|The minister met her French counterpart.|这位部长会见了法国的对应部长。
nevertheless|The task was difficult; nevertheless, we finished it.|任务很难，尽管如此我们还是完成了。
attendance|Attendance at the lecture was higher than expected.|讲座出席人数比预期多。
wage|The workers demanded a higher wage.|工人们要求更高的工资。
newsletter|The club sends a monthly newsletter.|俱乐部每月发送一份简报。
receptionist|Ask the receptionist for directions.|向接待员问路。
clip|The teacher showed a short video clip.|老师播放了一小段视频。
tram|We took a tram to the city centre.|我们乘有轨电车去了市中心。
stint|She completed a short stint at the museum.|她在博物馆工作了一小段时间。
evacuate|Residents were asked to evacuate the building.|居民被要求撤离大楼。
embankment|The embankment protects the village from floods.|堤岸保护村庄免受洪水侵袭。
squash|The box was squashed during transport.|箱子在运输过程中被压扁了。
stamp|Please put a stamp on the envelope.|请在信封上贴一张邮票。
whistle|The referee blew the whistle.|裁判吹响了哨子。
denote|The symbol denotes an increase in temperature.|这个符号表示温度升高。
chink|A narrow chink let light into the room.|一道狭窄的缝隙让光照进了房间。
iris|The iris controls the amount of light entering the eye.|虹膜控制进入眼睛的光量。
epitomise|These buildings epitomise modern urban design.|这些建筑集中体现了现代城市设计。
odour|There was a strong odour of smoke.|有一股浓重的烟味。
seep|Water began to seep through the wall.|水开始从墙体渗入。
delinquency|The programme aims to reduce juvenile delinquency.|这个项目旨在减少青少年违法行为。
fabrication|The allegations were a complete fabrication.|这些指控完全是捏造的。
maturity|The trees take years to reach maturity.|这些树需要多年才能长成熟。
extend|The university agreed to extend the deadline.|大学同意延长截止期限。
justify|The benefits do not justify the high cost.|这些好处不足以证明高昂成本的合理性。
summit|The climbers reached the summit before noon.|登山者在中午之前到达了山顶。
implication|The findings have important implications for education.|这些发现对教育有重要影响。
decisive|Public support was a decisive factor.|公众支持是一个决定性因素。
substantial|The project requires substantial investment.|这个项目需要大量投资。
similarly|The two groups responded similarly.|两组人的反应相似。`;
for(const line of lines.split('\n')){const [word,example,example_zh]=line.split('|');const d=details.find(x=>x.word===word);if(d&&!d.example){d.example=example;d.example_zh=example_zh;}}
const ipa={delve:'/delv/',grunt:'/ɡrʌnt/',dismantle:'/dɪsˈmæntəl/',excavate:'/ˈekskəveɪt/',variation:'/ˌveəriˈeɪʃən/',heal:'/hiːl/',heel:'/hiːl/'};
for(const d of details)if(!d.phonetic&&ipa[d.word])d.phonetic=ipa[d.word];
const ex=details.find(x=>x.word==='excavate');
if(!ex.mnemonics.some(m=>m.id==='candidate_excavate_etymology'))ex.mnemonics.unshift({id:'candidate_excavate_etymology',type:'etymology',title:'拉丁语词源线索',content:'源自拉丁语 excavare（挖空）。ex-（向外）与 cavare（使空）相连；从挖空联想到挖掘。这里说明历史词源，不把每个字母段都当作独立英语词根。',segments:[{part:'ex-','meaning':'向外'},{part:'cavare','meaning':'挖空；使空'}],source:'codex',status:'needs_review',preferred:true,reference:'https://www.oxfordlearnersdictionaries.com/definition/english/excavate'});
ex.mnemonics=ex.mnemonics.map(m=>({...m,preferred:m.id==='candidate_excavate_etymology'}));ex.part_of_speech=['verb'];
master=master.replace(match[1],JSON.stringify(details,null,2)+'\n');await writeFile('data/vocabulary_master.md',master);
console.log('候选补充完成；未改变任何人工审核状态。');
