// 一次性转录整理工具。主词库建立后禁止再次生成覆盖。
import { mkdir, writeFile, access } from 'node:fs/promises';
const groups = [
 [1,'unknown',`delve|深入探究；挖掘|delve into a topic|研究者深入挖掘资料，像从土里挖出信息。
elicit|引出；诱出|elicit a response|把问题想成一把钥匙，引出对方的回应。
hierarchy|等级制度；层级|a social hierarchy|想象金字塔式组织：每一层都有不同等级。
consortium|联合体；财团|a research consortium|几个团队围着同一张桌子联合完成项目。
buckle|搭扣；扣住；屈服；变形|buckle a seat belt|把安全带扣住；压力太大时金属也会弯曲变形。
curry|咖喱；用咖喱烹调|curry favour with|先记一盘咖喱；curry favour with 另记为巴结讨好。
subliminal|下意识的；未被意识觉察的|subliminal messages|想象屏幕上一闪而过、没有被意识察觉的信息。
preliminary|初步的；预备的|preliminary results|正式研究之前先做预备工作，得到初步结果。
chamber|房间；会议厅；腔室|a heart chamber|把心脏腔室想象成身体里的一间小房间。
excavate|挖掘；开凿|excavate a site|考古队向下挖出空洞，发现遗址。
forfeit|丧失；被没收；罚金|forfeit a deposit|违约后押金被没收：把押金从口袋拿走。
dismantle|拆卸；拆除；逐步废除|dismantle machinery|想象把机器一块一块拆开；这是场景联想，不作词源解释。
periodical|期刊；定期的|a scientific periodical|每隔一个 period 就收到一本期刊。
apace|迅速地|continue apace|把工作推进的画面调成快进，记住迅速地。`],
 [1,'uncertain',`powder|粉末；粉|washing powder|想象一小堆细粉末，再联想洗衣粉。
counterpart|职位相当的人；对应物|a foreign counterpart|两国相同职位的人隔桌相对，是彼此的对应者。
nevertheless|然而；尽管如此|nevertheless|遇到困难仍往前走：尽管如此。
attendance|出席；出席人数|attendance at a meeting|从 attend 出席联想到 attendance 出席情况。
heal|愈合；治愈|heal a wound|heal 对应伤口愈合；对比 heel 脚后跟。
heel|脚后跟；鞋跟|high heels|把高跟鞋的鞋跟画出来；对比 heal 治愈。
wage|工资；发动|wage an annual campaign|一边领工资，一边记 wage a campaign 发动运动。
newsletter|简报；通讯|a monthly newsletter|news 新闻 + letter 信件 → 定期传递消息的简报。
receptionist|接待员|a hotel receptionist|reception 接待 + -ist 从事某事的人 → 接待员。
clip|夹子；夹住；剪辑片段|a video clip|夹住一张纸；再把一段视频剪成小片段。`],
 [2,'unknown',`grunt|哼声；咕哝；发出哼声|grunt in reply|模仿低沉短促的“哼”声，联想到人或猪的哼声。
tram|有轨电车|take a tram|画出轨道上的城市电车，与普通公交车区分。
stint|一段工作时间；节省用量|a short stint|想象日历上圈出一段短期工作时间。
evacuate|疏散；撤离|evacuate a building|警报响起，人们从建筑中有序撤离。
embankment|堤岸；路堤|a river embankment|想象沿河筑起一道高堤，挡住河水。
squash|压扁；挤压；壁球|squash a can|把易拉罐压扁，再联想壁球撞墙的画面。
stamp|邮票；印章；跺脚|a postage stamp|脚重重一跺像盖章，信封上再贴一张邮票。
whistle|口哨；哨子；吹口哨|blow a whistle|想象裁判吹哨的高音，动作与声音同时记忆。
denote|表示；指示|denote a quantity|数学符号旁边标注它表示的数量。
chink|裂缝；缝隙；叮当声|a chink in the wall|墙缝透进一道光；硬币相碰发出叮当声。注意此词也有冒犯性用法。
iris|虹膜；鸢尾花|the iris of the eye|把眼睛有颜色的一圈虹膜与鸢尾花的颜色联系。
epitomise|成为…的典范；集中体现|epitomise an ideal|想象一个人集中了某种品质，是这种品质的典范。
odour|气味|an unpleasant odour|闻到气味时皱眉；保留英式拼写 odour。
seep|渗出；渗透|seep through a crack|水一滴一滴慢慢从裂缝渗出来。
delinquency|青少年违法；失职|juvenile delinquency|把 juvenile delinquency 整体记作青少年违法行为。`],
 [2,'uncertain',`fabrication|捏造；制造|the fabrication of evidence|一条线是制造产品，另一条线是捏造证据，分开记。
variation|变化；差异；变体|variation in temperature|vary 的词干变体 vari- + -ation → 变化的过程或结果。
maturity|成熟；到期|reach maturity|mature 成熟的 → maturity 成熟这一状态。
extend|延伸；延长；扩大|extend a deadline|把一条线拉长，同时把截止日期向后延长。
justify|证明…正当；为…辩解|justify a decision|想象为一个决定逐条给出正当理由。
summit|山顶；峰会|an international summit|各国代表在山顶见面，把山顶与峰会联系。
implication|可能的影响；暗示；牵连|policy implications|一句话留下没有明说的影响，像水面下的部分。
decisive|决定性的；果断的|a decisive factor|decide 决定 → decisive 起决定作用的。
substantial|大量的；重大的；实质性的|substantial evidence|把证据堆成厚厚一摞：数量大，也有实质分量。
similarly|同样地；类似地|similarly affected|similar 相似的 + -ly → 同样地。`],
 [3,'unknown',`juggle|抛接杂耍；同时应付多件事|juggle work and study|双手抛接多个球，就像同时处理工作与学习。
leak|泄漏；泄密；漏洞|a water leak|管道漏水与秘密泄露，都是东西从里面漏出去。
impede|阻碍；妨碍|impede progress|想象道路中央的障碍挡住前进。
deduce|推断；演绎|deduce from evidence|侦探把线索连起来，从证据推断结论。
doctorate|博士学位|a doctorate in physics|把毕业证书上的 PhD 与博士学位联系。
internship|实习；实习期|a summer internship|intern 实习生 → internship 实习经历。
slender|纤细的；微小的|a slender chance|一条很细的线，也像微小的机会。
submarine|潜艇；海底的|a nuclear submarine|sub- 在下 + marine 海的 → 水下的潜艇。
lavatory|厕所；盥洗室|a public lavatory|记住飞机上厕所门牌 lavatory。
niche|壁龛；合适的定位；生态位|an ecological niche|想象墙上的专属小格子，对应适合自己的位置。
muddle|混乱；弄乱|muddle through|线团搅成一团，事情变得混乱。
induce|引起；诱导|induce sleep|想象某种条件诱发一个结果，如诱导睡眠。
atomic|原子的；原子能的|atomic energy|atom 原子 + -ic 形容词后缀 → 原子的。
cosset|宠爱；悉心照料|a cosseted child|想象孩子被柔软毯子包住、受到过度照顾。
silt|淤泥；使淤塞|silt up|河水退去，河底留下细细的淤泥。
abode|住所；居所|a humble abode|把简朴的小屋记成一个人的住所。
gadget|小装置；小工具|a kitchen gadget|厨房抽屉里方便但不大的小工具。
legacy|遗产；遗留影响|a lasting legacy|前人离开后留下的东西和长久影响。
overlap|重叠；交叠部分|overlap with|画两个相交的圆，交集就是重叠部分。
vanish|消失；不复存在|vanish from sight|魔术师挥手，物体从视线中消失。
mechanism|机制；机械装置|a defence mechanism|用一组齿轮联想背后的运作机制。
workaholic|工作狂|a workaholic|work 工作 + -aholic 沉迷于…的人 → 工作狂；现代构词。
erosion|侵蚀；逐渐削弱|soil erosion|雨水一点点冲走土壤，地面被侵蚀。
ion|离子|positive ions|画出带正号或负号的粒子。
intercept|拦截；截获|intercept a signal|在球到达目标前把它拦下。
hose|软管；用软管冲洗|a garden hose|花园里一根能弯曲的浇水软管。
cruise|乘船游览；巡航|a cruise ship|游轮平稳航行，与匆忙赶路区分。
shave|刮；剃；削减|shave off costs|剃掉胡须，也像一点点削减成本。`],
 [3,'uncertain',`spring|春天；弹簧；泉水；突然跃起|a hot spring|熟词多义：春天的泉水旁放着弹簧。
respondent|受访者；答辩人|survey respondents|respond 回答 → respondent 回答问卷的人。
surroundings|周围环境|natural surroundings|想象站在中心，向四周看周围的环境。
fold|折叠；褶；倍数|fold a map|把地图折叠起来，记住折痕。
simplify|简化|simplify a process|simple 简单 → simplify 使简单。
originate|起源；发源；创始|originate in|沿河向上追溯到水的起源。
disharmony|不和谐；不协调|social disharmony|dis- 否定 + harmony 和谐 → 不和谐。
unique|独一无二的；独特的|a unique opportunity|一排相同的指纹中只有一个特别的指纹。
inclusive|包容的；包含在内的|inclusive education|想象门向所有人敞开，没有人被排除。
reservation|预订；保留意见；保护区|make a reservation|预留一个座位是预订；保留一点不同意见。
transcript|文字记录；成绩单|an academic transcript|把录音转成文字记录；学校成绩单也用此词。
tune|曲调；调音；调整|in tune with|给乐器调音，让它与曲调合拍。
dispute|争论；争端；质疑|a trade dispute|两方围着同一问题争论不休。
pronounceable|可发音的；容易读出的|a pronounceable name|pronounce 发音 + -able 能…的 → 可发音的。
bare|赤裸的；光秃的；仅有的|bare essentials|把多余装饰都拿掉，只留下最基本的东西。`],
 [4,'unknown',`vertebrate|脊椎动物；有脊椎的|a vertebrate animal|想象动物身体中央一节节的脊柱。
industrious|勤奋的；勤勉的|an industrious student|想象持续认真做事的学生；与 industrial 工业的区分。
intestine|肠|the small intestine|画出腹部弯弯曲曲的肠道。
outpost|前哨；偏远据点|a remote outpost|地图边缘一个孤立的小哨所。
consignment|托运货物；托运|a consignment of goods|把一整批待运的货物贴上运单。
trapeze|高空秋千|a trapeze artist|马戏团演员抓着高处横杆荡来荡去。
intersection|交叉路口；交集|a busy intersection|两条道路相交，形成十字路口。
cardiovascular|心血管的|cardiovascular disease|cardio- 心脏 + vascular 血管的 → 心血管的。
brass|黄铜；铜管乐器|a brass band|金黄色的铜管乐器发出响亮声音。
fauna|动物群|flora and fauna|与 flora 植物群成对记：fauna 动物群。
expel|驱逐；排出|expel from school|把人从校门中赶出去，再联想身体排出东西。
divisional|部门的；分区的|a divisional manager|division 部门 + -al 形容词后缀 → 部门的。
astrology|占星术|astrology and astronomy|占星术看星座预测命运；与 astronomy 天文学区分。
flap|拍动；垂片；慌乱|flap its wings|鸟翅膀上下拍动，衣服的垂片也随之摆动。
wastage|浪费；损耗|water wastage|waste 浪费 → wastage 浪费掉的量或损耗。
dub|配音；给…起绰号|dub a film|给电影换上一条配音音轨。
mould|模具；霉菌；塑造|mould into shape|用模具塑造形状；潮湿角落长出霉菌是另一义。
discretion|谨慎；自行决定的权力|at your discretion|把决定权交给你，让你谨慎自行判断。
clamour|喧闹；强烈要求|a clamour for change|很多人一起高声呼吁，形成喧闹声。
attest|证明；证实|attest to|证人站出来证实一件事。
decrepit|衰老破旧的；老朽的|a decrepit building|想象摇摇欲坠的旧楼。`],
 [4,'uncertain',`convention|惯例；大会；公约|an international convention|一群人开大会订立共同遵循的公约。
lecture|讲座；讲课；训斥|attend a lecture|老师讲一堂课；长篇训话也是 lecture。
equator|赤道|near the equator|在地球中间画一圈赤道。
attain|达到；获得|attain a goal|登上一层台阶，达到目标。
counsellor|顾问；辅导员|a school counsellor|坐在桌子对面耐心提供建议的辅导员。
regulate|管理；调节；控制|regulate temperature|转动旋钮，让温度保持在规定范围。
ambitious|有抱负的；宏大的|an ambitious plan|把目标写在高处，联想到有抱负与宏大计划。
brief|简短的；概要；向…介绍情况|a brief summary|用很短一段话讲清重点。
substitute|替代品；替代；代替|substitute A for B|比赛中替补上场；substitute A for B 是用 A 替代 B。
striking|引人注目的；显著的|a striking contrast|强烈对比像一下击中目光，令人注意。
minimise|使最小化；把…减至最低|minimise waste|把浪费量不断缩小；保留英式拼写。
imaginative|富有想象力的|an imaginative solution|imagine 想象 → imaginative 富有想象力的。
quote|引用；报价；引文|quote a source|给原话加引号；商家写出报价是另一义。
resign|辞职；放弃；使顺从|resign from a post|把辞职信放在桌上；区别 re-sign 再次签约。
judgement|判断；判断力；判决|make a judgement|法官作出判断；保留英式拼写 judgement。
withstand|承受；抵挡|withstand pressure|想象大坝承受水压而没有倒下。
consequence|后果；结果|as a consequence|像多米诺骨牌倒下，前一件事带来后果。
consequently|因此；结果|consequently|把两件事用因果箭头连接：因此。
subsequent|随后的；后来的|subsequent events|时间线上前一个事件之后，是随后的事件。`]
];
const morphology = {
 newsletter: [['news','新闻'],['letter','信件']], receptionist:[['reception','接待'],['-ist','从事某事的人']],
 variation:[['vari-','vary 的词干变体，变化'],['-ation','名词后缀']], similarly:[['similar','相似的'],['-ly','副词后缀']],
 submarine:[['sub-','在下'],['marine','海的']], atomic:[['atom','原子'],['-ic','形容词后缀']],
 disharmony:[['dis-','否定'],['harmony','和谐']], pronounceable:[['pronounce','发音'],['-able','能够…的']],
 cardiovascular:[['cardio-','心脏'],['vascular','血管的']], divisional:[['division','部门'],['-al','形容词后缀']]
};
const specialExamples = {
 delve:['The researchers delved into the archives.','研究人员深入查阅档案。'],
 dismantle:['The team dismantled the old machine.','团队拆卸了那台旧机器。'],
 grunt:['He answered with a grunt.','他哼了一声作为回答。'],
 variation:['There is considerable variation in temperature.','气温有相当大的变化。'],
 heal:['The wound will take time to heal.','伤口愈合需要时间。'],
 heel:['The heel of my shoe is broken.','我的鞋跟断了。'],
 resort:['Many tourists visit this coastal resort.','许多游客来这处海滨度假胜地。']
};
const details=[]; const rows=[];
for(const [list,level,text] of groups) for(const line of text.split('\n')) {
 const [word,meaning,col,memo]=line.split('|'); const type=morphology[word]?'morphology':word==='grunt'?'onomatopoeia':word==='heel'?'phonetic':['attendance','maturity','decisive','internship','respondent','simplify','wastage','imaginative'].includes(word)?'word_family':'association';
 const mnemonic={id:`candidate_${word}`,type,title:({morphology:'构词拆解',onomatopoeia:'拟声记忆',phonetic:'读音对比联想',word_family:'词族联想',association:'场景联想'})[type],content:memo,source:'codex',status:'needs_review',preferred:true};
 if(morphology[word]) mnemonic.segments=morphology[word].map(([part,meaning])=>({part,meaning}));
 const note=word==='hierarchy'?'图片原拼写似 hierachy，候选规范拼写 hierarchy；请核对':word==='wage'?'图片 g 的笔形接近 y，请核对 wage':word==='fauna'?'手写 n 的笔形不清，请核对 fauna':word==='judgement'?'原图备注：jud 词根有模糊的点；尚未添加未经核验词源':'';
 rows.push(`| ${list} | ${word} | ${level} | ${level==='unknown'?'○':'△'} | ${meaning} | ${note} | needs_review | needs_review |`);
 const ex=specialExamples[word]??['',''];
 details.push({word,raw:word==='hierarchy'?'hierachy':word,phonetic:'',part_of_speech:[],collocations:[col],example:ex[0],example_zh:ex[1],mnemonics:[mnemonic]});
}
await mkdir('data',{recursive:true});
try { await access('data/vocabulary_master.md'); throw new Error('主词库已存在，拒绝覆盖。请人工追加。'); } catch(e) {if(e.code!=='ENOENT') throw e;}
await writeFile('data/vocabulary_master.md',`# IELTS Lexicon 主词库\n\n图片转录候选，尚未经用户审核。○ = unknown，△ = uncertain。List 总数 50，未提供完整 List 词数，不计算陌生词率。\n\n工作流：核对拼写及分类后，将对应行 Transcription 改为 reviewed；核验释义、搭配后再将 Content 改为 reviewed。记忆候选在下方 JSON 中单独审核。未审核转录仅生成 vocabulary.pending.json，不进入 vocabulary.json。\n\n## 词条\n\n| List | Word | Initial Level | Symbol | Meaning | Notes | Transcription | Content |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n\n## 需人工辨认 / 分类\n\n| List | Raw | Candidate | Issue | Status |\n| --- | --- | --- | --- | --- |\n| 4 | pricate | 暂不确定 | 原图 ○ 栏倒数附近；无法可靠确定，不生成正式词条 | needs_review |\n| 4 | mastery | mastery | 位于“练”分组，不能判断属于 ○ 或 △ | needs_review |\n| 4 | precision | precision | 位于“练”分组，需确认初始分类 | needs_review |\n| 4 | gloss | gloss | 位于“练”分组，需确认初始分类 | needs_review |\n| 4 | outward | outward | 位于“练”分组，需确认初始分类 | needs_review |\n| 4 | anthropologist | anthropologist | 位于“练”分组，需确认初始分类 | needs_review |\n| 4 | comb | comb | 位于“练”分组，需确认初始分类 | needs_review |\n\n## 词条补充资料\n\n以下为 Codex 生成候选。空音标和例句表示未补充，不编造发音；所有记忆法独立标记 needs_review。真实词源需要可靠引用，不把联想当词源。编辑 word 前同步修改补充资料中的键；复习开始后不要随意改词形，否则会产生新 ID。\n\n<!-- word-details -->\n\x60\x60\x60json\n${JSON.stringify(details,null,2)}\n\x60\x60\x60\n`);
console.log(`Prepared ${rows.length} candidate rows; 7 unresolved rows retained separately.`);
