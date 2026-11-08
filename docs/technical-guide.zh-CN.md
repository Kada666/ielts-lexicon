# IELTS Lexicon 技术与维护说明

统一公开仓库与看板：`Kada666/ielts-lexicon`，https://kada666.github.io/ielts-lexicon/ 。

## 运行

Node.js 22.12+，本次使用 Node 24.18.0。

```sh
npm ci
npm run build
npm run preview -- --port 4173 --strictPort
```

打开 http://127.0.0.1:4173/ 。开发用 `npm run dev`；离线验证使用生产构建，开发模式不注册 Service Worker。Windows 可双击 `start-lexicon.cmd` 运行本地副本，或用桌面快捷方式直接打开在线版。

## 数据资料

```text
data/notes/list_01.md～list_04.md  手写笔记的逐 List 文字版
data/vocabulary_master.md         长期主词库及补充资料 JSON 块
               ↓ npm run build:data
data/vocabulary.json              已确认转录
data/vocabulary.pending.json      待审核转录
data/vocabulary.list_03_04.json    List 3、4 的90词增量包
               ↓ 应用预览、确认导入
IndexedDB                        运行中的词汇、个人修改与复习数据
```

按《词汇整理.pdf》核对后，List 1 有24词，List 2 有25词，List 3 有43词，List 4 有47词，共139词。List 4 的练习组保留「练」标记，复习沿用模糊词的间隔。

图片内容已转为 Markdown，公开仓库不保存原始手写图片。图片辨认备注仍是文字资料的一部分。未得到明确确认的转录与自动释义 / 记忆候选保持 needs_review；程序内导入确认不自动反向改写磁盘 Markdown。

List 1～4 已整理 91 条手写记忆法，附来源页码。已有词库可在首页增量合并。详细范围见 [词表核对记录](../data/import_review.md)。

## 追加与转换

- 在主词库“词条”表格追加8列：List、Word、Initial Level、Symbol、Meaning、Notes、Transcription、Content。
- List 支持1～50，○ 使用 unknown，△ 使用 uncertain；多个中文义项用 `；` 分隔。
- 审核状态为 needs_review 或 reviewed。单元格避免未转义的 `|`，可用 `／`。
- 音标、词性、搭配、例句与生成的记忆候选写在主词库的 `word-details` 块，以 word 关联。
- 手写记忆法直接编辑 [各 List 的 Markdown](../data/notes/)，构建时会读取「手写记忆法」标题以下的正文，并用主词库更新上方词表。
- 运行 `npm run build:data` 生成 JSON。已入库卡片的笔记修订在刷新时生效，新单词在看板确认后导入。
- 不重建或覆盖已经确认的资料。一次性初始建库脚本会在主文件存在时拒绝覆盖，增补脚本只补空字段。
- 其他来源可使用 `list_ids: []` 与 `origins.list: null`，kind 可为 listening / reading / writing / speaking / other；参见 [示例](../data/external-source.example.json)。

## ID、合并与个人内容

ID 来自规范化词形：NFKC、小写、去前后空白、合并空格，然后加 `word_` 前缀。相同词跨 List 合并来源，只保留一条复习状态。不同来源同时有 ○ 和 △ 时，整体初始分类取 unknown，原始来源标记均保留。英美拼写异体暂作为不同词，不自动合并。

不要在已经复习后随意更改单词 ID。V1 支持编辑词义、例句和记忆内容，没有隐藏词形重命名操作。

用户编辑保存到 overrides，基础词库更新不覆盖它。导入词条里已有的 source:user 记忆内容也优先于同 ID 自动候选。

## 记忆系统

支持 etymology（真实词源）、morphology（构词）、phonetic（谐音）、onomatopoeia（拟声）、association（自由联想）、word_family（词族）。词块、口诀、关联词按实际笔记添加。词块的字面含义和谐音提示分开记录。

闪卡背面显示核心义和首选联想，其他记忆线索可展开。长按联想区可改正文，也可展开编辑口诀、词块和关联词。

每条手写笔记用 `### 单词` 开头，接「类型」「标题」「记忆链」「来源」「修订」五个字段。可加一条「口诀」、多条「词块」和「关联词」。词块一行写 `拼写 | 含义 | 可选口诀`，关联词写 `拼写 | 含义或用法`。例子见 [List 4 的 astrology 和 flap](../data/notes/list_04.md)。更新已发布笔记时递增「修订」号，浏览器里的个人改写仍优先。

## 复习规则 simple-v1

| 评分 | 安排 |
| --- | --- |
| 忘记 | 10分钟后，连续成功清零，遗忘次数+1 |
| 首次模糊 | unknown 6小时，uncertain 12小时 |
| 后续模糊 | 上次间隔一半，最少30分钟、最多1天 |
| 首次记住 / 上次间隔不足1天 | unknown 1天，uncertain 2天 |
| 后续记住 | 约×2.2，至少增加1天，上限180天 |
| 掌握 | 连续记住至少3次且间隔≥7天；之后继续安排复习 |

默认每轮最多20词，只取已到期词；新词均立即可学，陌生词优先。每次评分通过单个数据库事务同时保存状态与历史。关闭本轮不会丢掉已评分记录。

统计按设备本地日期计算。今日待复习含当天结束前到期的词，当前可学指现在已经到期。今日已复习为评分次数，另列不同词数。50格表示导入 List 覆盖，不冒充完整 List 的陌生词率。

## 本地数据库、备份与升级

数据库名保留 `ielts-lexicon`，版本2，避免升级后看不到同站点旧数据。

| 存储 | 内容 |
| --- | --- |
| words | 基础词条 |
| overrides | 个人释义、搭配、例句、记忆法 |
| progress | 每词当前调度状态 |
| reviews | 每次评分、时间、前后状态 |
| meta | 设置 |

完整 JSON 备份包含以上全部内容。恢复前验证字段、ID、关联与数值，错误输入不会改动数据库；确认恢复会替换当前数据，执行前下载当前备份。浏览器可能限制下载，请确认备份文件确实保存。

JSON 词库用于增量合并，不含学习历史。CSV（UTF-8 BOM）供查阅，不是完整恢复格式。V1 不支持 CSV 导入。

数据库V1→V2仅新增 overrides store，保留现有数据；V1备份读取时补默认设置，未知未来版本拒绝。源码更新、词库构建或 Service Worker 更新不清理 IndexedDB。

## 统一公开链接与个人数据边界

所有人使用同一公开程序和内置基础词库。个人学习数据只存在各自浏览器配置文件中，不上传到 GitHub，不会因他人评分或修改而改变。共用同一浏览器配置文件的人会共用该站点数据，请使用不同浏览器配置文件。

从 localhost 换到 Pages，或换设备 / 浏览器，需要先导出完整 JSON，再到新入口恢复。公开仓库不是个人学习历史的云同步服务；不同设备独立编辑后的两份历史暂不自动合并。

## PWA 条件

首次访问要能连接服务器。正式在线链接为 HTTPS；电脑本机可用 localhost / 127.0.0.1。普通局域网 HTTP 不适合作为 iPad 的离线安装入口。不要用 file:// 打开 dist/index.html。

生产构建预缓存 HTML、JS、CSS、图标与内置词库，无 CDN 依赖。右上显示“离线可用”后可断网重载和复习。安装图标本身不代表缓存已完成。

桌面使用支持的浏览器安装入口；iPad / iPhone 使用 Safari 分享→添加到主屏幕。新版本提示后可应用更新，数据库保留。清理站点数据、无痕模式、系统回收存储可能移除数据；请求持久存储不保证浏览器授予，请定期备份。

Service Worker 缓存按应用ID与注册scope命名，只清理自身旧缓存，不触碰同域其他学习工具的缓存。

## 部署与验证

`.github/workflows/pages.yml` 在 main 更新后运行 `npm ci`、`npm test`、`npm run build`，上传 dist 并发布 Pages。Vite base 与 manifest / SW 使用相对路径，支持仓库子目录。

```sh
npm test
npm run build
npm run test:e2e
```

浏览器测试使用独立临时 Chrome profile，覆盖导入、个人编辑、评分持久化、词表增补、备份恢复、断网与桌面 / 平板 / 手机布局。实机安装需在对应设备上验证。

后续可替换调度接口为 FSRS，保留原始历史；继续扩展听音、默写、词族和四科来源分析。V1 不需要账号、云数据库或运行时 AI / OCR。
