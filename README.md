# Lab1 Phase 1：SVG 编辑器

TypeScript 命令行 SVG 编辑器，采用 Command、Composite 和 Memento 模式，实现六种图形、分组编辑、SVG 读写及撤销重做。

## 环境与运行

Node.js >=22，npm。

```bash
npm ci
npm run cli
```

## 检查与示例

```bash
npm run check
npm run demo
```

`npm run check` 执行类型检查、测试和编译；`npm run demo` 回放流程图命令，生成 `examples/generated.svg`。

## 目录

- `src/`：领域模型、命令、IO 适配器和 CLI。
- `test/`：功能、历史、文件读写和架构测试。
- `examples/`：命令脚本与 SVG 示例。
- `doc/`：[实验报告](doc/README.md)与 [PlantUML 架构图](doc/architecture.puml)。
