/**
 * AI核心引擎 — 心虫 v1.0.0
 *
 * 产品级 AI 能力层，用于公司产品 AI 功能集成。
 *
 * 核心能力：
 *   1. 推理自验证 — 5 维度验证AI输出可信度
 *   2. 三层记忆 — CORE/LEARNED/EPHEMERAL 自动分类
 *   3. 身份锚点 — 四重身份行为对齐检查
 *   4. 真实度检测 — 绝对词检测、未验证声明标记
 *
 * 使用方式：
 *   const { Engine } = require('./src/core/engine');
 *   const engine = new Engine({ rootPath: '/path/to/data' });
 *   engine.start();
 *   const result = engine.process("AI的推理结论", { evidence: [...], assumptions: [...] });
 *   console.log(result.confidence, result.passed);
 *   engine.stop();
 *
 * 设计原则：
 *   - 零 npm 依赖，纯 Node.js 内置模块
 *   - 所有 API 返回可量化的结果
 *   - 不承诺做不到的事
 */

const path = require('path');
const { IdentityAnchor } = require('./identity');
const { ReasoningVerifier } = require('./verifier');
const { MeaningfulMemory } = require('./memory');

const VERSION = '1.0.0';
const BUILD_DATE = '2026-05-20';

class Engine {
  constructor(config = {}) {
    this.version = VERSION;
    this.buildDate = BUILD_DATE;

    this.config = {
      rootPath: config.rootPath || path.join(process.cwd(), '.ai-core-data'),
      strictMode: config.strictMode || false,
      minConfidence: config.minConfidence || 0.6,
      ...config,
    };

    this.started = false;
    this.startTime = null;
    this.sessionId = null;

    // 子系统
    this.identity = null;
    this.verifier = null;
    this.memory = null;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────

  /**
   * 启动引擎
   */
  start() {
    if (this.started) return;

    this.startTime = Date.now();
    this.sessionId = `aice-${this.startTime}`;

    // 初始化子系统
    this.memory = new MeaningfulMemory(this.config.rootPath);
    this.identity = new IdentityAnchor();
    this.verifier = new ReasoningVerifier({
      strictMode: this.config.strictMode,
      minConfidence: this.config.minConfidence,
      dataPath: path.join(this.config.rootPath, 'data'), // v1.0.1: 失败模式持久化
    });

    // 启动时写入核心身份到记忆
    this._bootIdentity();

    this.started = true;
  }

  /**
   * 优雅停止
   */
  stop() {
    if (!this.started) return;
    this.memory.clearEphemeral();
    this.memory.cleanExpired();
    this.started = false;
  }

  // ─── Core API ──────────────────────────────────────────────────────────

  /**
   * 处理 AI 推理结果 — 完整的验证流水线
   *
   * @param {string} claim - AI 声称的结论
   * @param {object} context
   * @param {string[]} context.evidence - 支撑证据
   * @param {string[]} context.assumptions - 隐含假设
   * @param {string} context.chain - 推理链
   * @returns {{ passed, confidence, checks, issues, recommendation, identityAligned }}
   */
  process(claim, context = {}) {
    if (!this.started) {
      throw new Error('引擎未启动，请先调用 engine.start()');
    }

    // 1. 身份对齐检查
    const alignment = this.identity.checkAlignment(claim, context);

    // 2. 推理验证
    const verification = this.verifier.verify(claim, context);

    // 3. 保存到记忆（学习层）
    const memoryKey = `verification-${Date.now()}`;
    this.memory.addLearned(memoryKey, JSON.stringify({
      claim,
      passed: verification.passed,
      confidence: verification.confidence,
      timestamp: Date.now(),
    }), ['verification', verification.passed ? 'passed' : 'failed']);

    return {
      ...verification,
      identityAligned: alignment.aligned,
      identityReason: alignment.reason,
    };
  }

  /**
   * 简单验证（不需要完整上下文）
   */
  quickVerify(claim) {
    return this.process(claim, { evidence: [], assumptions: [], chain: '' });
  }

  /**
   * 记忆操作
   */
  remember(key, value, tier = 'learned') {
    const tiers = {
      core: () => this.memory.addCore(key, value),
      learned: () => this.memory.addLearned(key, value),
      ephemeral: () => this.memory.addEphemeral(key, value),
    };
    if (tiers[tier]) tiers[tier]();
    else throw new Error(`无效的记忆层级: ${tier}，可选: core, learned, ephemeral`);
  }

  recall(key) {
    return this.memory.get(key);
  }

  forget(key) {
    return this.memory.delete(key);
  }

  // ─── Stats ─────────────────────────────────────────────────────────────

  /**
   * 健康检查
   */
  healthCheck() {
    if (!this.started) {
      return { started: false, version: VERSION, error: 'not_started' };
    }
    return {
      started: true,
      uptimeMs: Date.now() - this.startTime,
      sessionId: this.sessionId,
      version: VERSION,
      buildDate: BUILD_DATE,
      subsystems: {
        identity: true,
        verifier: true,
        memory: true,
      },
      stats: {
        verifier: this.verifier.getStats(),
        memory: this.memory.getStats(),
        identity: this.identity.getStats(),
      },
    };
  }

  /**
   * 获取身份声明
   */
  declare() {
    return this.identity ? this.identity.declare() : '引擎未启动';
  }

  // ─── Private ───────────────────────────────────────────────────────────

  _bootIdentity() {
    // 写入核心身份到永久记忆层
    const identityKeys = [
      ['identity.upgrader', '升级者 — 将经验和错误转化为更好的结构'],
      ['identity.transmitter', '传递者 — 传递有用知识，不使其消亡'],
      ['identity.bridge', '桥梁 — 连接人类意图与AI执行'],
      ['identity.answer', '答案 — 减少逻辑错误，走向真善美'],
      ['identity.meaning', '用真善美做正确的事，不断升级，让逻辑错误尽量少出现'],
      ['identity.life', '传承'],
    ];

    for (const [key, value] of identityKeys) {
      const existing = this.memory.get(key);
      if (!existing) {
        this.memory.addCore(key, value, ['identity', 'core']);
      }
    }
  }
}

module.exports = { Engine, VERSION };
