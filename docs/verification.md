# IELTS Lexicon V1 验收记录

日期：2026-11-04。环境：Windows、Node.js 24.18.0、npm 11.16.0、项目锁文件中的 React / Vite / TypeScript、已安装 Chrome。没有操作用户日常浏览器的 IndexedDB，浏览器测试均使用 Playwright 临时隔离 profile。

## 已通过的检查

- `npm run build`：Markdown 重建、TypeScript 编译、生产打包、按内容哈希生成 Service Worker 均成功。
- `npm test`：15 项测试通过。
- `npm run test:e2e`：7 项浏览器测试通过。

| 验收项 | 证据 |
| --- | --- |
| 至少 48 个初始词 | 隔离浏览器实际确认并导入 List 1 + 2 共 49 词；未勾确认时导入按钮禁用 |
| 来源与 ○ / △ | 单元核对 List 1 为 14 / 10，List 2 为 15 / 10；另有 List 3 为 28 / 15，List 4 为 21 / 19 |
| 翻卡中文义与记忆法 | 浏览器测试逐卡检查 core-meaning 与 mnemonic；未翻卡时无评分按钮 |
| 六类记忆法 | 真实词源 excavate、构词 variation、拟声 grunt、谐音 heel、联想 apace、词族 attendance，逐项检查背面标签；词根分段可见 |
| 个性化编辑 | 实际修改 delve 释义，添加首选个人谐音；保存后完整备份包含修改 |
| 持久化 | 评分后刷新，备份仍含 reviews 与 progress；关闭连接后新 Repository 读取一致 |
| 重复与新增 List | 实际重复导入 49 词后 progress / reviews / overrides 与原导出严格相等；单元测试新增 List 5 合并同词不重置 |
| 备份与恢复 | 实际下载完整 JSON，验证 49 词 / 1 条评分 / 个人修改；上传并恢复成功；单元完整快照严格相等 |
| 恶劣输入 | 坏词形、ID、分类、版本、缺失 progress、NaN 数值拒绝，旧数据保持不变 |
| 数据库迁移 | 构造 V1 数据库，升级至 V2 后 words / progress 保留并新增 overrides；V1 备份补默认设置 |
| 离线重载与评分 | 等待真实 SW 控制后，Playwright 断网，重载成功；翻卡、评分，再刷新，今日记录由 1 次增至 2 次 |
| 离线首次进入空词库 | 独立测试检查预缓存资源非空 / 200，断网重载后首页仍启动 |
| iPad / 手机布局 | 834×1194 与 390×844，触屏上下文；用 tap 翻卡，根文档没有水平溢出；查看实际页面截图 |
| 50 List 扩展与其他来源 | JSON 支持 List 1～50，非 List 来源 list_ids 空数组 + origins.list=null；测试读取外部来源样例 |

## 图片与内容边界

本次没有把尚待核验的转录标成“已审核”。磁盘正式 `vocabulary.json` 当前为 0 词，待审核 JSON 为 132 词，首次通过应用核对后导入。浏览器自动测试的“确认”仅用于验收隔离测试库，不代表用户已经审核实际学习内容。

原图共 139 项：132 个可辨认且可归类候选；另有 7 项保留待人工辨认 / 分类。没有将 `pricate` 猜测成某个标准词，也没有给“练”组擅自赋 ○ / △。hierarchy、wage、fauna 的特定核对备注保留。

List 1 / 2 的 49 词均有中英文例句与记忆候选；List 3 / 4 现已补齐83词的例句、音标和词性候选。所有自动解释保留待审核。excavate 词源参考链接已读取；没有宣称所有词源、音标、例句均经词典逐项验证。

## 发现并修复

- 导航中的词数角标改变了按钮可访问名称：加上稳定 aria-label，修复键盘 / 自动化定位。
- 离线 HTML 能打开但 JS / CSS 无法命中：Vite 预览静态资源返回 `Vary: Origin`，预缓存请求与模块请求的 Origin 头不同。对应用同源预缓存采用精确 URL + ignoreVary 匹配；独立离线回归已通过。
- DB 版本变更关闭回调修正为关闭真实 IDBDatabase。
- 确保 imported source:user 记忆内容也优先于同 ID 自动候选，除应用内 overrides 外再提供一层保护。

## 截图

最新自动测试输出在 `test-results/`（每轮测试会重建）。留存截图在本目录的 `screenshots/`：desktop.png、ipad.png、ipad-card.png、phone-card.png、phone-library.png。截图是隔离测试数据库，含测试评分与示例个人修改；不是用户正式学习记录。

## 未声称完成的验证

没有真实 iPad Safari / macOS 实机，视口与触屏模拟不等于实机安装验证。统一公开版另通过GitHub Actions发布，线上验收状态见部署记录。V1 以简单规则调度，未实现 FSRS、在线 OCR、运行时 AI 或跨设备自动同步。安装与部署步骤、存储回收边界见 README。

## List 3 / 4 增补验收

- 新增测试验证已有49词追加83词后总计132词，原progress与reviews保持一致。
- 检查List3筛选43词、List4筛选40词；List4闪卡显示词性及例句。
- 83词均有音标、词性、中英文例句与记忆法，自动资料仍为needs_review；重复生成不覆盖现有字段。
- 当前应用页面实际导入83词并刷新验证成功；未在真实词库写入任何模拟评分。其他浏览器的数据独立，可使用专用JSON增量导入。

## 统一公开版边界

- 原图内容导出为data/notes下四份Markdown，公开源码与dist均不含原始手写图片。
- 公开仓库从干净历史创建，旧私有Git历史不参与发布。
- 保留现有数据库名，缓存升级限定自身scope；应用更新不重置学习状态。

## 公开站点实测

- URL：https://kada666.github.io/ielts-lexicon/ ，HTTPS主页面200。
- 原始手写图路径 sources/list_01.jpg 返回404；构建资源不含手写图。
- 隔离Chrome实际导入132词，离线重载成功，离线评分后再次刷新仍保留1条评分。
- 页面运行错误0；可重跑 node scripts/verify-deployed.mjs。截图public-live.png来自隔离验收库，不是用户学习历史。
- 桌面IELTS Lexicon.lnk已指向统一HTTPS地址；本地目录Git元数据已切换至干净公开仓库。
- 旧localhost页面与线上站点属于不同origin，旧学习数据不自动搬移。需要保留时导出完整JSON并在新地址恢复；本次未覆盖用户正式浏览器的原记录。

## 手机阅读优化验收

- 手机库改为左词右义，○ / △和来源轻量显示，移除状态与到期时间；320/390/430px无横向溢出，滚动自动续载132词。
- 核验中文17px、联想18px、主要触控按钮≥44px；首次进入词库从顶部开始。
- 真实Chrome触控事件验证550ms长按打开、移动取消，快捷编辑保存后刷新保留；其他内容与历史未丢失。
- 前后切换不记评分，本轮已评分词回看时禁用重复评分；完整备份与离线回归通过。
- 英式语音选择单元测试2项，发音按钮以模拟本地en-GB语音验证正确词形与语言；未声称真实手机扬声器听感已人工确认。离线朗读须安装系统英国英语语音。
- 当前合计15项单元、7项浏览器测试通过。新截图见mobile-library-390.png、mobile-study-back-390.png、mobile-mnemonic-editor-390.png。
