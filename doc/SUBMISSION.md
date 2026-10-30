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

当前分阶段历史由 AI 在本地实际创建，作者记录为 Codex；未冒充学生身份。最终版本带 `final` tag。教师所需的远程仓库地址和截止时间尚未提供，因此没有声称已经推送或满足截止时间。

先在 GitHub 或 Gitee 建立空仓库（不要自动初始化 README），然后在本项目目录使用实际地址：

```bash
git remote add origin <你的实际仓库地址>
git push -u origin main
git push origin final
```

如果 origin 已存在，先用 `git remote -v` 确认再决定是否修改。若更改了代码，不要盲目移动已提交的 final；根据课程规定确认最终 tag 的更新方式。

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
