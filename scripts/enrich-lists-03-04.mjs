// 补空字段，不改变审核状态、不覆盖手工资料。例句为原创候选；IPA 为英式候选。
import { readFile, writeFile } from 'node:fs/promises';
const path='data/vocabulary_master.md';
let master=await readFile(path,'utf8');
const match=master.match(/<!-- word-details -->\s*```json\s*([\s\S]*?)```/);
if(!match)throw new Error('Missing word-details block');
const details=JSON.parse(match[1]);
const rows=`juggle|verb|/ˈdʒʌɡl/|Many students juggle study and part-time work.|许多学生同时兼顾学习和兼职工作。
leak|noun,verb|/liːk/|A small leak wasted hundreds of litres of water.|一个小漏点浪费了数百升水。
impede|verb|/ɪmˈpiːd/|Poor transport links can impede economic growth.|薄弱的交通联系会阻碍经济增长。
deduce|verb|/dɪˈdjuːs/|We can deduce the cause from the available evidence.|我们可以根据现有证据推断原因。
doctorate|noun|/ˈdɒktərət/|She is studying for a doctorate in engineering.|她正在攻读工程学博士学位。
internship|noun|/ˈɪntɜːnʃɪp/|The internship gave him practical experience.|这段实习让他获得了实践经验。
slender|adjective|/ˈslendə(r)/|The bridge rests on slender steel columns.|这座桥由纤细的钢柱支撑。
submarine|noun,adjective|/ˌsʌbməˈriːn/|The submarine remained below the surface.|潜艇一直停留在水面以下。
lavatory|noun|/ˈlævətri/|The public lavatory is next to the station.|公共厕所在车站旁边。
niche|noun|/niːʃ/|Each species occupies a particular ecological niche.|每个物种都占据特定的生态位。
muddle|noun,verb|/ˈmʌdl/|The instructions left everyone in a muddle.|这些说明让所有人都糊涂了。
induce|verb|/ɪnˈdjuːs/|Certain medicines can induce sleep.|某些药物能诱导睡眠。
atomic|adjective|/əˈtɒmɪk/|The model describes the atomic structure of the material.|这个模型描述了该材料的原子结构。
cosset|verb|/ˈkɒsɪt/|His family cosseted him throughout his childhood.|他的家人在他整个童年时期都对他过分呵护。
silt|noun,verb|/sɪlt/|The flood left a thick layer of silt on the fields.|洪水在田地上留下了厚厚一层淤泥。
abode|noun|/əˈbəʊd/|The cottage became their permanent abode.|这间小屋成了他们的永久住所。
gadget|noun|/ˈɡædʒɪt/|This small gadget measures air quality.|这个小装置可以测量空气质量。
legacy|noun|/ˈleɡəsi/|The factory left a legacy of pollution.|这家工厂遗留下了污染问题。
overlap|noun,verb|/ˌəʊvəˈlæp/（v.）；/ˈəʊvəlæp/（n.）|The two courses overlap in several areas.|这两门课程在几个方面内容重叠。
vanish|verb|/ˈvænɪʃ/|The island vanished beneath the rising water.|这座岛屿消失在上涨的水面之下。
mechanism|noun|/ˈmekənɪzəm/|Scientists are studying the mechanism behind the reaction.|科学家正在研究这种反应背后的机制。
workaholic|noun|/ˌwɜːkəˈhɒlɪk/|The report examines why some people become workaholics.|这份报告探讨了一些人为何会成为工作狂。
erosion|noun|/ɪˈrəʊʒn/|Planting trees can reduce soil erosion.|植树可以减少水土流失。
ion|noun|/ˈaɪən/|The solution contains positively charged ions.|该溶液含有带正电的离子。
intercept|verb|/ˌɪntəˈsept/|The equipment can intercept radio signals.|这套设备能截获无线电信号。
hose|noun,verb|/həʊz/|They used a hose to water the plants.|他们用软管给植物浇水。
cruise|noun,verb|/kruːz/|The ship cruises along the coast each summer.|这艘船每年夏天都沿海岸巡游。
shave|verb|/ʃeɪv/|The new route shaves ten minutes off the journey.|新路线把行程缩短了十分钟。
spring|noun,verb|/sprɪŋ/|Hot water rises naturally from the spring.|热水自然地从泉眼中涌出。
respondent|noun|/rɪˈspɒndənt/|Most respondents supported the proposed changes.|大多数受访者支持拟议的改革。
surroundings|noun|/səˈraʊndɪŋz/|People often feel calmer in natural surroundings.|人在自然环境中通常会感到更平静。
fold|noun,verb|/fəʊld/|Fold the paper in half before cutting it.|剪纸之前先把纸对折。
simplify|verb|/ˈsɪmplɪfaɪ/|The new system will simplify the application process.|新系统将简化申请流程。
originate|verb|/əˈrɪdʒɪneɪt/|The river originates in the mountains.|这条河发源于山区。
disharmony|noun|/dɪsˈhɑːməni/|Poor communication can lead to disharmony within a team.|沟通不畅会导致团队内部不和。
unique|adjective|/juˈniːk/|The island supports several unique species.|这座岛屿是几个独特物种的栖息地。
inclusive|adjective|/ɪnˈkluːsɪv/|Schools should provide an inclusive learning environment.|学校应提供包容的学习环境。
reservation|noun|/ˌrezəˈveɪʃn/|I have some reservations about the proposed plan.|我对这项拟议计划持有一些保留意见。
transcript|noun|/ˈtrænskrɪpt/|Researchers analysed a transcript of each interview.|研究人员分析了每次访谈的文字记录。
tune|noun,verb|/tjuːn/|The children sang a familiar tune.|孩子们唱了一首熟悉的曲调。
dispute|noun,verb|/dɪˈspjuːt/|The two countries resolved their trade dispute.|两国解决了贸易争端。
pronounceable|adjective|/prəˈnaʊnsəbl/|The team chose a short, pronounceable name.|团队选了一个简短易读的名称。
bare|adjective,verb|/beə(r)/|The room contained only the bare essentials.|房间里只有最基本的必需品。
vertebrate|noun,adjective|/ˈvɜːtɪbrət/|Fish are vertebrates with backbones.|鱼是有脊柱的脊椎动物。
industrious|adjective|/ɪnˈdʌstriəs/|The industrious students worked steadily on the project.|这些勤奋的学生持续认真地推进项目。
intestine|noun|/ɪnˈtestɪn/|Nutrients are absorbed in the small intestine.|营养物质在小肠中被吸收。
outpost|noun|/ˈaʊtpəʊst/|Scientists established a research outpost in the Arctic.|科学家在北极建立了一个研究据点。
consignment|noun|/kənˈsaɪnmənt/|A consignment of medical supplies arrived yesterday.|一批医疗物资昨天运到了。
trapeze|noun|/trəˈpiːz/|The performer swung gracefully from the trapeze.|表演者抓着高空秋千优雅地荡动。
intersection|noun|/ˌɪntəˈsekʃn/|Traffic lights were installed at the intersection.|这个交叉路口安装了交通信号灯。
cardiovascular|adjective|/ˌkɑːdiəʊˈvæskjələ(r)/|Regular exercise benefits cardiovascular health.|规律运动有益于心血管健康。
brass|noun|/brɑːs/|The door handle is made of brass.|这个门把手是黄铜制的。
fauna|noun|/ˈfɔːnə/|The survey recorded the local flora and fauna.|这次调查记录了当地的植物群和动物群。
expel|verb|/ɪkˈspel/|The pump expels air from the chamber.|这台泵把空气从腔室中排出。
divisional|adjective|/dɪˈvɪʒənəl/|Each divisional manager submitted a report.|每位部门经理都提交了一份报告。
astrology|noun|/əˈstrɒlədʒi/|Astrology should not be confused with astronomy.|占星术不应与天文学混淆。
flap|noun,verb|/flæp/|The bird flapped its wings and took off.|那只鸟拍动翅膀飞了起来。
wastage|noun|/ˈweɪstɪdʒ/|Better storage can reduce food wastage.|更好的储存方式能减少食物损耗。
dub|verb|/dʌb/|The film was dubbed into several languages.|这部电影被配成了多种语言的版本。
mould|noun,verb|/məʊld/|The clay was pressed into a mould.|黏土被压进了模具。
discretion|noun|/dɪˈskreʃn/|Teachers have some discretion over teaching methods.|教师对教学方法有一定的自主决定权。
clamour|noun,verb|/ˈklæmə(r)/|There is growing public clamour for reform.|公众要求改革的呼声日益高涨。
attest|verb|/əˈtest/|Several witnesses can attest to the accuracy of the account.|几位证人可以证实这份叙述的准确性。
decrepit|adjective|/dɪˈkrepɪt/|The decrepit building needs urgent repairs.|这座破旧的建筑急需修缮。
convention|noun|/kənˈvenʃn/|The convention sets rules for protecting wetlands.|这项公约规定了保护湿地的规则。
lecture|noun,verb|/ˈlektʃə(r)/|The lecture focused on renewable energy.|这场讲座重点介绍了可再生能源。
equator|noun|/ɪˈkweɪtə(r)/|Temperatures are generally higher near the equator.|赤道附近的气温通常较高。
attain|verb|/əˈteɪn/|The programme helps learners attain their goals.|这个项目帮助学习者实现目标。
counsellor|noun|/ˈkaʊnsələ(r)/|Students can speak to a school counsellor.|学生可以向学校辅导员咨询。
regulate|verb|/ˈreɡjuleɪt/|The device regulates the temperature automatically.|这个装置自动调节温度。
ambitious|adjective|/æmˈbɪʃəs/|The city announced an ambitious transport plan.|这座城市公布了一项宏大的交通计划。
brief|adjective,noun,verb|/briːf/|The report provides a brief summary of the findings.|这份报告简要概述了研究结果。
substitute|noun,verb|/ˈsʌbstɪtjuːt/|You can substitute beans for meat in this recipe.|在这个食谱中，你可以用豆类代替肉。
striking|adjective|/ˈstraɪkɪŋ/|There is a striking contrast between the two regions.|这两个地区形成了鲜明对比。
minimise|verb|/ˈmɪnɪmaɪz/|The design aims to minimise energy use.|这个设计旨在尽量减少能源消耗。
imaginative|adjective|/ɪˈmædʒɪnətɪv/|The team proposed an imaginative solution.|团队提出了一个富有想象力的解决方案。
quote|noun,verb|/kwəʊt/|The article quotes several environmental experts.|这篇文章引用了几位环境专家的话。
resign|verb|/rɪˈzaɪn/|She decided to resign from her post.|她决定辞去职务。
judgement|noun|/ˈdʒʌdʒmənt/|Good judgement is essential when assessing risks.|评估风险时，良好的判断力至关重要。
withstand|verb|/wɪðˈstænd/|The structure can withstand strong winds.|这个结构能承受强风。
consequence|noun|/ˈkɒnsɪkwəns/|One consequence of deforestation is habitat loss.|森林砍伐的一个后果是栖息地丧失。
consequently|adverb|/ˈkɒnsɪkwəntli/|Rainfall declined; consequently, crop yields fell.|降雨减少，因此作物产量下降。
subsequent|adjective|/ˈsʌbsɪkwənt/|Subsequent studies confirmed the original findings.|随后的研究证实了最初的发现。`;
const entries=rows.split('\n').map(line=>line.split('|'));
if(entries.length!==83||new Set(entries.map(r=>r[0])).size!==83)throw new Error('Expected 83 unique additions');
const known=new Map(details.map(d=>[d.word,d]));
for(const [word,pos,phonetic,example,example_zh] of entries){
 const d=known.get(word);if(!d)throw new Error(`Missing original transcription: ${word}`);
 if(!d.phonetic)d.phonetic=phonetic;
 if(!d.part_of_speech?.length)d.part_of_speech=pos.split(',');
 if(!d.example)d.example=example;
 if(!d.example_zh)d.example_zh=example_zh;
}
const families={
 erosion:'erode（侵蚀，动词）→ erosion（侵蚀，名词）；留意词干拼写变化。',
 originate:'origin（起源，名词）↔ originate（起源，动词）：用现代词族联系，不把每段字母都解释为古词根。',
 inclusive:'include（包含）↔ inclusive（包含在内的、包容的）；词干拼写会变化。',
 judgement:'judge（判断；法官）→ judgement（判断、判决）。这是现代词族联系，不把 jud 的字母拼写单独当成已核验词根。',
 consequently:'consequence（后果）→ consequent（随之发生的）→ consequently（因此）。subsequent 是“时间上随后”，不必有因果。',
 subsequent:'subsequent（随后的）→ subsequently（随后）；与 consequently（因此）比较：先后关系不等于因果关系。',
 industrious:'industry 的现代相关词中，industrious 指勤奋的，industrial 指工业的。用词义对比记忆，不将二者当同义词。',
 imaginative:'imagine（想象）→ imagination（想象力）→ imaginative（富有想象力的）；imaginary 指想象中的。',
 minimise:'minimum（最小值）↔ minimise（使减到最低）；保留英式 -ise 拼写。'
};
for(const [word,content] of Object.entries(families)){
 const d=known.get(word),id=`candidate_${word}_family`;
 if(!d.mnemonics.some(m=>m.id===id))d.mnemonics.push({id,type:'word_family',title:'词族与易混词对比',content,source:'codex',status:'needs_review',preferred:false});
}
master=master.replace(match[1],JSON.stringify(details,null,2)+'\n');
await writeFile(path,master);
console.log('List 3 + List 4：83 词已补充 IPA、词性、中英文例句，保留原有资料与审核状态。');
