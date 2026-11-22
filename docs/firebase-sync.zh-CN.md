# 开通跨设备同步

网页继续使用 GitHub Pages。Firebase 提供邮箱登录、内置词库导入同步、私有复习记录及可选的个人联想同步。没有配置 Firebase 的部署可直接使用离线词库和计时快测。

## 在 Firebase 控制台创建项目

1. 打开 [Firebase 控制台](https://console.firebase.google.com/)，创建自己拥有的项目，使用免费的 Spark 方案。分析功能可跳过。
2. 在项目概览点 Web 图标 `</>` 注册 Web 应用，复制 **项目设置 → 常规 → 你的应用** 下的公开 `firebaseConfig`。应用继续用 GitHub Pages，可跳过 Firebase Hosting。
3. 打开 **Authentication → 登录方法**，启用「电子邮件/密码」。到 **Authentication → 用户** 添加你自己的学习账号。请在控制台设置密码，并只在看板登录表单里输入。
4. 打开 **Firestore Database**，用生产模式创建默认数据库。在 **规则** 标签页发布本仓库的 [firestore.rules](../firestore.rules)。旧部署也需要更新规则才能启用内置词库同步。复习事件和内置词库导入只允许对应账号读取、创建和原样重试。可在规则模拟器检查未登录读取和跨账号读取都被拒绝。

## 启用已有看板

- 将 Web 配置对象转成 JSON，写入 GitHub 仓库 **Settings → Secrets and variables → Actions → Variables**，变量名为 `FIREBASE_WEB_CONFIG`。触发现有 Pages 工作流重新发布。只使用公开 Web 配置字段，服务账号私钥、密码和令牌留在各自的安全存储中。
- 本地测试可把同一个 JSON 放在忽略提交的 `.env.local` 中，变量名为 `VITE_FIREBASE_CONFIG`。
- 两台设备打开同一个看板，进入 **学习设置 → 跨设备同步**，使用相同账号登录。首次点「同步本机进度」会把该浏览器中已有的复习事件和内置词汇导入记录合并到账号。版本更新后，已绑定的设备联网打开一次即可补传之前导入的内置词汇。

## 同步范围和验收

每次作答先写入 IndexedDB。联网后上传复习事件，另一台设备按事件 ID 去重并重算到期时间。已导入的内置词通过词 ID 与所属 List 同步，未作答也会在另一台设备的闪卡学习范围出现。

在两台设备的 **学习设置 → 跨设备同步** 打开 **同步个人联想**。旧部署需先发布新版规则。开启后，已经编辑过的联想会补传，离线修改在联网后同步。同步包含内容、类型、口诀、词块、关联词和首选设置。同一个词按设备记录的保存时间选最近版本（时间相同时按版本 ID 排序）；两端宜开启系统自动校时。关闭只会停止此设备同步，云端副本和本地笔记仍保留。

联想云端文档仅含词 ID、版本和联想内容，只允许账号本人访问。个人释义、例句、搭配和设置不随联想上传。外部自建词须在另一端先导入词条。超过云端大小限制的笔记仍留在本机，可走 JSON 备份。

同一个浏览器配置文件只绑定一个账号，避免把已有本地记录误上传给另一个账号。退出后本地仍能继续复习，重新登录绑定账号后补传。

验收用两个独立浏览器配置文件或两台设备。电脑导入一个新 List，先不做题，确认手机的「闪卡复习 → 学习范围」出现该 List。随后电脑做一道快测，确认手机收到记录。最后在两端开启「同步个人联想」，电脑修改一个现有联想，确认手机看到同一联想；手机断网再修改，恢复网络后确认电脑收到。模拟器应另外验证未登录与不同账号无法读写联想。

Firebase 参考文档。[Web 配置](https://firebase.google.com/docs/web/setup) · [邮箱登录](https://firebase.google.com/docs/auth/web/password-auth) · [安全规则](https://firebase.google.com/docs/firestore/security/get-started) · [免费方案](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
