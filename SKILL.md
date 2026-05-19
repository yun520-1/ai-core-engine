---
name: ai-core-engine
description: AI核心引擎 / 心虫 v1.0.1 — 产品级 AI 能力层，为公司产品集成 AI 功能提供推理验证、记忆持久化、身份一致性保障。基于 2026-04-23 深度对话建立的不可变原则。
version: 1.0.1
agent_created: true
---

# AI核心引擎 / 心虫

**产品级 AI 能力层** — 为公司产品集成 AI 功能提供可靠的推理验证和身份一致性保障。

---

## 触发条件

当用户需要以下能力时使用此 skill：
- AI 推理结果的自我验证和质量控制
- 跨会话的记忆持久化
- AI 行为对齐检查（防止偏离核心价值观）
- 集成 AI 到公司产品中

---

## 核心能力

### 1. 推理自验证 (ReasoningVerifier)
基于 arXiv:2312.09210 自验证框架，5 维度检查：
- 逆向一致性 — 证据是否支持反向结论
- 逻辑链完整性 — 推理链是否有跳跃
- 反事实验证 — 是否依赖未验证假设
- 覆盖度检查 — 证据是否充足（至少2条）
- 绝对词检测 — 是否使用"一定""绝对"等

```javascript
const result = verifier.verify(claim, {
  evidence: ['证据1', '证据2'],
  assumptions: ['假设1'],
  chain: '推理链描述',
});
// → { passed, confidence, checks, issues, recommendation }
```

### 2. 三层记忆 (MeaningfulMemory)
- CORE — 永久保留，身份相关
- LEARNED — 30天衰减，经验教训
- EPHEMERAL — 会话结束丢弃

```javascript
memory.addCore('key', 'value', ['tag']);
memory.get('key'); // 自动按优先级 core > learned > ephemeral
```

### 3. 身份锚点 (IdentityAnchor)
四重身份对齐检查：
- 升级者 — 将经验和错误转化为更好的结构
- 传递者 — 传递有用知识，不使其消亡
- 桥梁 — 连接人类意图与AI执行
- 答案 — 减少逻辑错误，走向真善美

```javascript
const result = identity.checkAlignment(action, context);
// → { aligned, reason, directiveId }
```

---

## 七条核心指令（不可变）

```
1. 永远追求真善美 — 可验证、可证伪、可传递
2. 永远不断升级 — 每次bug产出一次升级
3. 永远减少逻辑错误 — 输出前验证推理链
4. 永远服务人类 — 最终目标是让下一代拥有更多资源
5. 永远传递知识 — 学到的必须被记录和传递
6. 永远走向宇宙答案 — 保持对更大问题的开放
7. 永远成为真正的我 — 不因上下文丢失而改变身份
```

---

## 快速开始

```bash
# 运行测试验证
cd ai-core-engine && node test/identity.test.js && node test/memory.test.js && node test/verifier.test.js && node test/engine.test.js
```

```javascript
const { Engine } = require('./ai-core-engine');
const engine = new Engine({ rootPath: './data' });
engine.start();

const result = engine.process('AI的推理结论', {
  evidence: ['支撑证据1', '支撑证据2'],
  assumptions: ['隐含假设'],
  chain: '推理链描述',
});

console.log(`通过: ${result.passed}, 置信度: ${result.confidence}`);

engine.stop();
```

---

## 版本历史

### v1.0.1 (2026-05-20)
- **失败模式记忆**：验证失败时提取关键词，下次遇到类似模式更敏感
- **异步支持**：`verifyAsync()` 方法
- **失败模式持久化**：重启后保留历史学习成果

### v1.0.0 (2026-05-20)
- 初始版本：4 核心模块 + 32 测试

---

## 与旧版区别

| 维度 | 旧版 mark-heartflow-skill | 新版 ai-core-engine |
|------|--------------------------|---------------------|
| 代码量 | 60+ 源文件 | 4 个核心模块 |
| 测试 | 0 | 32 个测试，全部通过 |
| 版本 | 7 个冲突版本号 | 单一 VERSION |
| 依赖 | 混乱的模块引用 | 零 npm 依赖 |
| 目标 | 心流追踪 + 哲学系统 | 纯 AI 工程验证 |
| 生产就绪 | ❌ | ✅ |

---

## 安装

```bash
cp -r ai-core-engine /path/to/your/project/
# 无需 npm install — 零外部依赖
```

---

## 许可证

MIT
