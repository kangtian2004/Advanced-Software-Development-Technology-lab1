# Lab1 Phase 1：SVG 编辑器实验报告

## 架构方案

### 模块划分

| 模块 | 职责 | 主要类或接口 |
|---|---|---|
| `domain` | 图形、几何操作、组合树、文档约束和图形创建 | `Shape`、六种图形类、`SvgDocument`、`ShapeFactory` |
| `application` | 命令执行、编辑事务、历史管理和文本显示 | `Editor`、`Command`、`EditCommand`、`CommandRegistry`、`TreeFormatter` |
| `ports` | 文件存储与 SVG 编解码接口 | `FileStore`、`SvgCodec` |
| `infrastructure` | 磁盘操作、XML 解析和序列化 | `DiskFileStore`、`XmlSvgCodec` |
| `cli` | 分词、命令入口与错误输出 | `Tokenizer`、`CommandRunner` |
| `main.ts` | 依赖装配、REPL 和脚本入口 | — |

各模块位于 `src/` 下，每个类单独存放在同名文件。图形的几何属性与样式由对象封装，查询返回副本；`Group` 管理子节点及父引用，保证树结构无环。

![组件依赖图](architecture.svg)

[PlantUML 源文件](architecture.puml)

### 设计模式

| 模式 | 实现 | 作用 |
|---|---|---|
| Command | `Command` 接口及 19 个具体命令类 | 封装命令用例，分离输入解析与业务操作 |
| Composite | `Shape`、叶子图形与 `Group` | 统一操作图形和容器，递归移动与缩放子孙节点 |
| Memento | `EditCommand` 保存前后文档快照 | 一条编辑命令对应一个撤销单元，恢复属性、父级和节点顺序 |
| Factory | `ShapeFactory`、`ShapeDefinition` | 集中处理类型名与具体类的映射，复用创建和导入规则 |
| 依赖倒置 | `FileStore`、`SvgCodec` 端口 | 隔离磁盘和 XML 实现，便于替换与测试 |

编辑命令先克隆当前文档，在候选副本上执行操作。执行成功后，`Editor` 发布候选文档、记录历史并清空 redo 栈；执行失败则丢弃副本，不改变当前文档与历史。文档类和显示类命令实现 `Command`，编辑类命令继承 `EditCommand`。

### 依赖方向规则

| 模块 | 允许依赖 | 原因 |
|---|---|---|
| domain | domain | 核心模型独立于交互与 IO |
| ports | domain、ports | 接口引用文档类型 |
| application | domain、ports、application | 用例使用抽象 IO |
| infrastructure | domain、ports、infrastructure、外部库 | 实现端口并转换 XML 与领域对象 |
| cli | application、cli | 处理命令输入与输出 |
| main | 各生产模块、Node.js 标准库 | 装配具体依赖 |

保留两个按名字分派的位置：`CommandRegistry.builders` 将命令名映射为命令对象；`ShapeFactory.definitions` 将类型名映射为图形定义。两处均为后续 provider 注册机制的待重构点。图形移动、缩放与克隆使用多态，不按标签分派。

### 变化点假设

| 变化点 | 当前安排与取舍 |
|---|---|
| 新增图形或插件 | 工厂集中类型注册，图形继承 `Shape` 行为契约；动态加载、插件 schema 与 `box` 属性传播留待后续阶段实现 |
| GUI 或 agent 入口 | 输入层与应用层分离，可复用命令对象与模型；结构化查询视图尚未提取 |
| 文件来源和 XML 库 | 通过端口隔离；当前接口为同步形式，异步 IO 需要调整端口 |
| 大文档历史 | 完整快照便于正确恢复复杂树操作；每次快照为 O(n)，h 条历史空间为 O(nh)，后续可采用增量或结构共享 |
| id 查找 | 遍历图形树，避免维护额外索引的一致性成本；大文档可增加索引 |
| SVG 导入范围 | 支持本阶段子集，不支持的元素或属性使整条 read 失败，避免静默丢失内容 |

## 过程记录

使用 Codex 辅助完成架构讨论、实现与测试，主要迭代如下。

| 阶段 | 问题或决策 | 处理与验证 |
|---|---|---|
| 需求分析 | 确定六种内置图形、Command、面向对象和阶段范围 | 编码前记录架构方案；`box` 按后续阶段处理 |
| 模型与历史 | 跨父级分组和删除子树需要恢复完整结构，逐节点执行可能中途失败 | 采用候选副本事务与快照历史，验证中途数值溢出不会造成部分修改 |
| 依赖调整 | XML 导入需要图形工厂，工厂位于 application 会产生反向依赖 | 将 `ShapeFactory`、`ShapeDefinition` 放入 domain，通过依赖检查 |
| SVG 导入 | 自动分配的 id 可能与后续显式 id 冲突 | 先收集全部显式 id，再分配缺失 id，补充嵌套和后置 id 测试 |
| 首轮测试 | 89 项中 88 项通过，带空格文件名的测试缺少双引号 | 修正测试输入，保持参数校验规则；验证保存与读回结果一致 |
| 测试扩充 | 内存测试无法覆盖实际 CLI、退出码和磁盘行为 | 增加子进程、临时磁盘读写及 250 步混合操作测试，97 项通过 |
| 字符校验 | 仅在保存时校验可能使编辑接收无法序列化的字符 | 将 XML 字符校验前移到模型和导入边界，增加回归用例，99 项通过 |
| 分派检查 | XML 遍历中存在依据 text 标签判断行为的逻辑 | 改为检查模型文本能力，类型名映射集中在工厂 |
| 示例检查 | 验证生成的流程图 | 回放命令并渲染 SVG，检查矩形、文字、连接线和中文显示 |

### 修订记录

- 图形工厂由 application 调整至 domain，符合预定依赖方向。
- 增加 `ShapeDefinition`，集中创建与导入的参数规则。
- 导入时保留有限的展示属性，CLI `set` 白名单不变。
- 文档命令成功后清空历史并设置 IO 屏障，下一次成功编辑开启新历史。

## 一致性自查

### 模块划分

实际目录与方案一致。每个生产类位于同名文件；工厂位置调整已列入修订记录。`main.ts` 仅承担装配和输入输出，不包含几何操作或分组算法。

### 依赖方向

`architecture.test.ts` 检查所有生产代码 import，包括 type-only 引用，当前没有违反依赖方向的情况。抽样结果：

- `Rect` 只依赖 `Shape`，领域模型不导入 IO 或应用层。
- `Editor` 依赖文档模型、端口和应用层命令类型。
- `XmlSvgCodec` 依赖 domain、ports 和 XML 库，不依赖 application。
- `CommandRunner` 只依赖应用层及本层分词器。

生产模块无 `switch` 分派；图形行为通过继承与组合实现。

## 质量保证手段

### 验证方法

```bash
npm ci
npm run check
npm run demo
node dist/main.js --script examples/flowchart.commands
```

验证环境为 macOS、Node.js 24.22.0、npm 11.19.1。依赖使用精确版本并提交 lockfile。类型检查、编译和 99 项自动测试全部通过；独立克隆后安装依赖、重新检查及回放编译后的 CLI 均通过。

| 测试文件 | 覆盖内容 |
|---|---|
| `editor.test.ts` | 六种图形、几何与样式、组合树操作、历史分支、IO 屏障及失败原子性 |
| `xml.test.ts` | SVG 往返、缺失 id 分配、特殊字符、路径规则和非法输入 |
| `cli.test.ts` | 真实进程、脚本与 stdin、引号和颜色、错误输出、退出码及磁盘读写 |
| `history.test.ts` | 固定种子的 250 步混合操作，检查历史状态、id 唯一性、父子关系和序列化一致性 |
| `architecture.test.ts` | 依赖方向、禁止 switch 和一类一文件 |

### 实现约定与边界

- `init` 默认 800×600，只给宽度时高度为 600；`canvas` 修改需同时给宽高。画布尺寸为正，图形尺寸非负，坐标可为负数。
- 分组保持原文档遍历顺序；跨父级分组放到最低共同祖先下。重复成员及祖先与子孙同时入组均拒绝。
- `addto` 移到目标容器末尾；`front/back` 仅调整同级顺序。顶层容器按要求禁止解组。
- 文档命令失败不影响历史；成功的 init/read/save/canvas 修改建立历史屏障，显示命令和 canvas 查询不进入历史。
- `save` 成功后更新默认路径，`init` 清空路径。省略 fill/stroke 时不写入对应属性，scale 不改变 stroke-width。
- 支持 rect、circle、ellipse、line、text、g；不支持 path、CSS、资源引用、tspan、DTD 和实体声明。`create box` 报未知类型，带 `data-kind="box"` 的 g 按普通组读取。
- 导入 transform 原样保留，move/scale 修改局部几何值。跨不同变换父级重组不保证屏幕位置不变；复杂组透明度的解组结果不保证合成效果等价。
- 完整快照历史未设置容量上限，尚未进行大文档压力测试。
