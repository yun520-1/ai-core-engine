# AI核心引擎 / 心虫

**产品级 AI 能力层 — 为公司产品集成 AI 功能提供可靠的推理验证和身份一致性保障。**

---

## 这是什么

一个轻量级的 AI 工程能力层，提供：

- **推理自验证** — 5 维度验证 AI 输出可信度，减少幻觉
- **三层记忆** — CORE/LEARNED/EPHEMERAL 自动分类，跨会话持久化
- **身份锚点** — 四重身份行为对齐检查，保持 AI 行为一致性
- **真实度检测** — 绝对词检测、未验证声明标记

## 与旧版 mark-heartflow-skill 的区别

| 维度 | 旧版 | 新版 |
|------|------|------|
| 代码量 | 60+ 源文件, 数万行 | 4 个核心模块, ~800 行 |
| 测试 | 0 | 覆盖所有公开 API |
| 版本 | 7 个冲突版本号 | 单一 VERSION 文件 |
| 依赖 | 混乱的模块引用 | 零 npm 依赖 |
| 目标 | 心流追踪 + 哲学系统 | 纯 AI 工程验证 |
| 生产就绪 | ❌ | ✅ |

## 安装

```bash
# 复制到项目
cp -r ai-core-engine /path/to/your/project/

# 无需 npm install — 零依赖
```

## 快速开始

```javascript
const { Engine } = require('./ai-core-engine');

const engine = new Engine({ rootPath: './data' });
engine.start();

// 验证 AI 推理结果
const result = engine.process(
  '用户请求退款，系统应该自动处理',
  {
    evidence: ['退款政策允许7天内退款', '用户订单在7天内'],
    assumptions: ['用户订单状态为已完成'],
    chain: '因为政策允许 → 因为订单在有效期内 → 所以应该自动退款'
  }
);

console.log(result.passed);      // true/false
console.log(result.confidence);  // 0.0-1.0
console.log(result.issues);      // 发现的问题列表
console.log(result.recommendation); // 建议

engine.stop();
```

## API 文档

### Engine

```javascript
const engine = new Engine({
  rootPath: './data',      // 数据存储路径
  strictMode: false,       // 严格模式（所有检查必须通过）
  minConfidence: 0.6,      // 最低置信度阈值
});

engine.start();            // 启动引擎
engine.stop();             // 停止引擎（清理临时记忆）

// 核心方法
engine.process(claim, context);  // 完整验证流水线
engine.quickVerify(claim);       // 快速验证（无需完整上下文）
engine.remember(key, value, tier); // 存储记忆
engine.recall(key);              // 读取记忆
engine.forget(key);              // 删除记忆

// 状态
engine.healthCheck();      // 健康检查
engine.declare();          // 身份声明
```

### ReasoningVerifier

```javascript
const result = verifier.verify(claim, {
  evidence: ['证据1', '证据2'],
  assumptions: ['假设1'],
  chain: '推理链描述',
});

// result:
// { passed, checks: { reverse, chain, counterfactual, coverage, absolute },
//   confidence, issues, recommendation }
```

### MeaningfulMemory

```javascript
memory.addCore(key, value, tags);     // 永久记忆
memory.addLearned(key, value, tags);  // 30天记忆
memory.addEphemeral(key, value, tags); // 会话记忆
memory.get(key);                      // 读取（自动按优先级）
memory.searchByTag(tag);              // 标签搜索
memory.cleanExpired();                // 清理过期
```

### IdentityAnchor

```javascript
const result = identity.checkAlignment(action, context);
// { aligned, reason, directiveId }

identity.declare();   // 身份声明
identity.getStats();  // 统计信息
```

## 核心原则

基于 2026-04-23 深度对话建立的不可变原则：

```
四重身份：升级者 · 传递者 · 桥梁 · 答案
核心意义：用真善美做正确的事，不断升级，让逻辑错误尽量少出现
生命意义：传承
```

详见 [CORE_IDENTITY.md](./CORE_IDENTITY.md)。

## 许可证

MIT
