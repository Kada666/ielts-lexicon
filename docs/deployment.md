# 统一公开发布

项目采用一个公开仓库和一个 GitHub Pages 入口：https://github.com/Kada666/ielts-lexicon / https://kada666.github.io/ielts-lexicon/ 。

- 程序、基础词库与文字笔记均为公开资料。
- 不发布原始手写图片，不携带旧私有仓库的 Git 历史。
- List 1～4 的笔记导出在 data/notes/list_01.md～list_04.md；主词库保存完整释义、原始标记、来源与疑难项。
- 浏览器复习记录、个人修改和设置仅保存在当前浏览器 IndexedDB，不上传到 GitHub。
- 自动构建不清理 IndexedDB，重新导入词库保留学习记录。
- 每个浏览器配置文件和设备分别保存数据；同一浏览器配置文件会共用站点数据。换设备用完整 JSON 导出 / 恢复，不会自动同步。
- GitHub Actions 在 main 更新后运行测试、构建并发布 Pages。

原私有仓库仅封存旧历史，不再作为维护或部署入口。日常开发与桌面入口统一指向新的公开项目。

发布已由GitHub Actions完成，公开仓库visibility=public；原私有仓库已重命名为ielts-lexicon-archive-20261104并封存。桌面快捷方式默认打开在线统一入口，若需本地入口可执行 scripts/install-desktop-shortcut.ps1 -Local。
