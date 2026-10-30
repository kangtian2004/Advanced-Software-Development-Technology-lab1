# 提交与理解指南

## 本地验收

在项目根目录运行：

```bash
npm ci
npm run check
npm run demo
```

运行 `npm run cli` 进入交互界面，再手动尝试：创建一个组和两种图形；移动组；连续 undo/redo；save 后 undo 应报 IO 屏障错误；read examples/other.svg 应提示自动分配 rect1。

## Git 状态与远程提交

当前分阶段历史由 AI 在本地实际创建，作者记录为 Codex；未冒充学生身份。最终版本带 `final` tag。

用户提供的目标仓库：[https://github.com/kangtian2004/Advanced-Software-Development-Technology-lab1](https://github.com/kangtian2004/Advanced-Software-Development-Technology-lab1)。本地 `origin` 已配置为该仓库。用户确认没有额外环境或验收要求，截止时间仍以课程通知为准。

交付前远程仓库经检查为空。提交采用完整 Git 历史推送，分支为 `main`，最终版本标签为 `final`。本次认证仅通过进程临时环境传递，不把访问令牌写入代码、Git 配置或交付压缩包，也不更改系统的凭据保存设置。

今后在本机 Git 使用具有此仓库写权限的 GitHub 账号完成登录后，可执行：

```bash
git push --atomic -u origin main refs/tags/final
```

不需要重新添加 origin。若从压缩包恢复，请先用 `git remote -v` 确认地址；若更改代码，不要盲目覆盖已经公开的 final 标签，应根据课程规定处理。

推送之后核对：

```bash
git status --short
git log --oneline --reverse
git show --no-patch final
git ls-remote origin refs/heads/main refs/tags/final refs/tags/final^{}
```

按课程平台要求提交仓库链接和 final 标签，时间以教师通知和远程服务器记录为准。

## 你需要真正理解的几个问题

1. **为什么必须 Command？** 命令对象封装一次用例，CLI 不直接执行图形操作。编辑命令还携带前后状态，可作为一个完整历史单元撤销重做。
2. **为什么不是给所有图形写 switch？** `Shape` 子类通过多态完成 move/scale/clone；只有工厂负责把输入类型名映射为对象。
3. **为什么 Group 能像 Rect 一样操作？** 两者都继承 Shape；Group 在自己的方法里递归委托子节点，形成 Composite。
4. **失败为什么不留下半成品？** 命令修改的是候选副本；中途报错时副本不发布，当前文档、历史和默认路径保持不变。
5. **快照撤销有什么代价？** 结构恢复简单、可靠，但每条命令需要复制文档，历史多时内存增大；后续可以使用增量或结构共享。
6. **为什么没有实现 box？** 原文明确把它列为后续插件化阶段目标；当前读取其普通 g 结构，但不恢复插件语义。
7. **怎样知道实现满足要求？** 结合类型检查、需求对照测试、实际 CLI 和磁盘测试、混合历史不变量验证、SVG 演示渲染，以及架构依赖检查；不能仅凭程序启动成功。

## 真实的个人过程记录

`doc/README.md` 已明确记录 AI 辅助实现和实际修复。请在亲自运行与阅读后补充你自己的真实观察、疑问、取舍及修正，不要把 AI 自查改写成你曾经做过但实际没有做过的评审。
