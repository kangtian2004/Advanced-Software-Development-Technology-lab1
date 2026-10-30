# Lab1 Phase 1：SVG 编辑器

## 架构方案（实现前记录）

采用 TypeScript 面向对象实现。domain 负责图形树和约束；application 负责命令、事务和历史；ports 定义文件与 SVG 编解码边界；infrastructure 实现文件和 XML；cli 负责分词、交互及错误展示。main 作为组合根装配依赖。

必须使用 Command；容器采用 Composite；撤销重做采用完整文档 Memento。每次编辑在副本上运行，成功后才发布，失败不修改文档或历史。

依赖：domain 不依赖其他层；ports 仅依赖 domain；application 仅依赖 domain/ports；infrastructure 仅依赖 domain/ports；cli 仅依赖 application；main 可依赖各层完成装配。按名字分派仅允许命令注册表和 ShapeFactory，保留为后续插件化待重构点。

变化点：未来增加 GUI 时复用 application/domain；未来支持图形插件时替换工厂注册方式；本阶段不实现 box。XML 解析和磁盘读写通过端口隔离。暂不用增量撤销，优先保证树结构变更和失败原子性正确。

## 过程记录

1. 阅读原始作业，确认必须实现六种内置图形及全部 Phase 1 命令，box 仅属于后续阶段。
2. 在编码前记录模块依赖与快照式撤销决策，后续按实现阶段补充验证和修订。

本记录如实描述当前聊天中的 AI 辅助实现，不伪造学生参与或讨论。
