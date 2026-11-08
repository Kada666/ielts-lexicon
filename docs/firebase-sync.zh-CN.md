# 开通跨设备同步

网页继续使用 GitHub Pages。Firebase 提供邮箱登录和私有复习记录。没有配置 Firebase 的部署可直接使用离线词库和计时快测。

## 在 Firebase 控制台创建项目

1. 打开 [Firebase 控制台](https://console.firebase.google.com/)，创建自己拥有的项目，使用免费的 Spark 方案。分析功能可跳过。
2. 在项目概览点 Web 图标 `</>` 注册 Web 应用，复制 **项目设置 → 常规 → 你的应用** 下的公开 `firebaseConfig`。应用继续用 GitHub Pages，可跳过 Firebase Hosting。
3. 打开 **Authentication → 登录方法**，启用「电子邮件/密码」。到 **Authentication → 用户** 添加你自己的学习账号。请在控制台设置密码，并只在看板登录表单里输入。
4. 打开 **Firestore Database**，用生产模式创建默认数据库。在 **规则** 标签页粘贴并发布本仓库的 [firestore.rules](../firestore.rules)。规则把复习事件限制在账号自己的路径下，只允许创建和原样重试。可在规则模拟器检查未登录读取和跨账号读取都被拒绝。

## 启用已有看板

- 将 Web 配置对象转成 JSON，写入 GitHub 仓库 **Settings → Secrets and variables → Actions → Variables**，变量名为 `FIREBASE_WEB_CONFIG`。触发现有 Pages 工作流重新发布。只使用公开 Web 配置字段，服务账号私钥、密码和令牌留在各自的安全存储中。
- 本地测试可把同一个 JSON 放在忽略提交的 `.env.local` 中，变量名为 `VITE_FIREBASE_CONFIG`。
- 两台设备打开同一个看板，进入 **学习设置 → 跨设备同步**，使用相同账号登录。首次点「同步本机进度」会把该浏览器中已有的复习事件合并到账号。

## 同步范围和验收

每次作答先写入 IndexedDB。联网后上传复习事件，另一台设备按事件 ID 去重并重算到期时间。内置词可随收到的事件加入本机。外部自建词须在另一端先导入词条，个人联想与其他设置可通过现有 JSON 备份迁移。

同一个浏览器配置文件只绑定一个账号，避免把已有本地记录误上传给另一个账号。退出后本地仍能继续复习，重新登录绑定账号后补传。

验收用两个独立浏览器配置文件或两台设备。电脑做一道快测，确认手机收到记录。手机断网作答，联网后确认电脑收到且重复同步不会产生重复记录。

Firebase 参考文档。[Web 配置](https://firebase.google.com/docs/web/setup) · [邮箱登录](https://firebase.google.com/docs/auth/web/password-auth) · [安全规则](https://firebase.google.com/docs/firestore/security/get-started) · [免费方案](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
