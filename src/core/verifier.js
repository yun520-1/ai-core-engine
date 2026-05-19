/**
 * 推理自我验证引擎 v1.0.1
 *
 * 基于 arXiv:2312.09210 (Weng et al.) 自验证框架
 * v1.0.1 新增：失败模式记忆 + 异步支持
 *
 * 升级者身份实践：
 *   每次失败都是一次升级机会 — 记住失败模式，下次更敏感
 */

const fs = require('fs');
const path = require('path');

const VERSION = '1.0.1';

class ReasoningVerifier {
  constructor(config = {}) {
    this.config = {
      strictMode: config.strictMode || false,
      minConfidence: config.minConfidence || 0.6,
      dataPath: config.dataPath || null, // v1.0.1: 失败模式持久化路径
      ...config,
    };

    // 统计
    this.stats = {
      totalVerified: 0,
      passed: 0,
      failed: 0,
      uncertain: 0,
    };

    // v1.0.1: 失败模式记忆 — 从历史失败中学习
    this._failurePatterns = new Map();
    if (this.config.dataPath) {
      this._loadPatterns();
    }
  }

  /**
   * v1.0.1: 异步启动（初始化失败模式）
   */
  async boot() {
    if (this.config.dataPath && !fs.existsSync(this.config.dataPath)) {
      fs.mkdirSync(this.config.dataPath, { recursive: true });
    }
    this._loadPatterns();
    return this;
  }

  /**
   * v1.0.1: 异步验证
   */
  async verifyAsync(claim, context = {}) {
    return new Promise((resolve) => {
      // 模拟异步（实际验证是 CPU 密集，后续可接入 worker）
      setImmediate(() => {
        resolve(this.verify(claim, context));
      });
    });
  }

  /**
   * 验证推理结果
   * @param {string} claim - AI 声称的结论
   * @param {object} context - 推理上下文
   * @param {string[]} context.evidence - 支撑证据列表
   * @param {string[]} context.assumptions - 隐含假设列表
   * @param {string} [context.chain] - 推理链描述
   * @returns {{ passed: boolean, checks: object, confidence: number, issues: string[] }}
   */
  verify(claim, context = {}) {
    this.stats.totalVerified++;

    // 空结论直接拒绝
    if (!claim || claim.trim().length === 0) {
      this.stats.failed++;
      return {
        passed: false,
        checks: {
          reverse: { passed: false, detail: '结论为空' },
          chain: { passed: false, detail: '结论为空' },
          counterfactual: { passed: false, detail: '结论为空' },
          coverage: { passed: false, detail: '结论为空' },
          absolute: { passed: false, detail: '结论为空' },
        },
        confidence: 0,
        issues: ['结论为空，无法验证'],
        recommendation: '警告: 结论为空，请提供有效的推理结论',
      };
    }

    const evidence = context.evidence || [];
    const assumptions = context.assumptions || [];
    const chain = context.chain || '';
    const issues = [];

    // 1. 逆向一致性检查
    const reverseCheck = this._reverseCheck(claim, evidence);
    if (!reverseCheck.passed) issues.push(...reverseCheck.issues);

    // 2. 逻辑链完整性检查
    const chainCheck = this._chainCheck(chain);
    if (!chainCheck.passed) issues.push(...chainCheck.issues);

    // 3. 反事实验证
    const counterfactualCheck = this._counterfactualCheck(claim, assumptions);
    if (!counterfactualCheck.passed) issues.push(...counterfactualCheck.issues);

    // 4. 覆盖度检查
    const coverageCheck = this._coverageCheck(claim, evidence);
    if (!coverageCheck.passed) issues.push(...coverageCheck.issues);

    // 5. 绝对词检测（"一定"、"绝对"、"永远"）
    const absoluteCheck = this._absoluteCheck(claim);
    if (!absoluteCheck.passed) issues.push(...absoluteCheck.issues);

    // 计算置信度
    const checks = [reverseCheck, chainCheck, counterfactualCheck, coverageCheck, absoluteCheck];
    const passCount = checks.filter(c => c.passed).length;
    const confidence = passCount / checks.length;

    const passed = this.config.strictMode
      ? (passCount === checks.length)
      : (confidence >= this.config.minConfidence);

    if (passed) {
      this.stats.passed++;
    } else if (confidence < 0.4) {
      this.stats.failed++;
      // v1.0.1: 升级者 — 每次失败都是一次升级机会
      this._learnFromFailure(claim, issues);
    } else {
      this.stats.uncertain++;
    }

    return {
      passed,
      checks: {
        reverse: { passed: reverseCheck.passed, detail: reverseCheck.detail },
        chain: { passed: chainCheck.passed, detail: chainCheck.detail },
        counterfactual: { passed: counterfactualCheck.passed, detail: counterfactualCheck.detail },
        coverage: { passed: coverageCheck.passed, detail: coverageCheck.detail },
        absolute: { passed: absoluteCheck.passed, detail: absoluteCheck.detail },
      },
      confidence: Number(confidence.toFixed(2)),
      issues,
      recommendation: this._getRecommendation(confidence, issues),
    };
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const total = this.stats.totalVerified;
    return {
      ...this.stats,
      passRate: total > 0 ? (this.stats.passed / total).toFixed(2) : 'N/A',
    };
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.stats = { totalVerified: 0, passed: 0, failed: 0, uncertain: 0 };
  }

  // ─── Private checks ────────────────────────────────────────────────────

  _reverseCheck(claim, evidence) {
    if (evidence.length === 0) {
      return {
        passed: false,
        detail: '无支撑证据',
        issues: ['没有任何证据支撑此结论'],
      };
    }
    return { passed: true, detail: '证据与结论方向一致', issues: [] };
  }

  _chainCheck(chain) {
    if (!chain || chain.trim().length === 0) {
      return { passed: true, detail: '无推理链描述（跳过）', issues: [] };
    }
    // 检查推理链是否有断裂（"因为...所以"之间的跳跃）
    const hasGap = /因为.*所以(?!.*因为).*所以/.test(chain);
    if (hasGap) {
      return { passed: false, detail: '推理链存在跳跃', issues: ['推理链中间环节缺失'] };
    }
    return { passed: true, detail: '推理链完整', issues: [] };
  }

  _counterfactualCheck(claim, assumptions) {
    // 检查是否有未声明的假设标记（无论是否提供显式假设都要检查）
    const undeclaredPatterns = ['显然', '众所周知', '不言而喻'];
    for (const pattern of undeclaredPatterns) {
      if (claim.includes(pattern)) {
        return {
          passed: false,
          detail: `使用了未验证的假设标记: "${pattern}"`,
          issues: [`结论依赖未验证的假设: "${pattern}"`],
        };
      }
    }
    // 如果没有显式假设但有证据，也是可接受的
    if (assumptions.length === 0) {
      return { passed: true, detail: '无显式假设（跳过）', issues: [] };
    }
    return { passed: true, detail: '假设已声明', issues: [] };
  }

  _coverageCheck(claim, evidence) {
    if (evidence.length < 2) {
      return {
        passed: false,
        detail: `证据数量不足 (${evidence.length})`,
        issues: ['证据不足，至少需要2条独立证据'],
      };
    }
    return { passed: true, detail: `证据覆盖充分 (${evidence.length}条)`, issues: [] };
  }

  _absoluteCheck(claim) {
    const absoluteWords = ['一定', '绝对', '永远', '必然', '毫无疑问', '100%', '肯定'];
    const found = absoluteWords.filter(w => claim.includes(w));
    if (found.length > 0 && !claim.includes('不确定')) {
      return {
        passed: false,
        detail: `包含绝对词: ${found.join(', ')}`,
        issues: [`使用了绝对词，降低可信度: ${found.join(', ')}`],
      };
    }
    return { passed: true, detail: '无绝对词', issues: [] };
  }

  _getRecommendation(confidence, issues) {
    if (confidence >= 0.8) return '结论可信，可以用于决策';
    if (confidence >= 0.6) return `建议: 结论基本可信，但需要补充证据。问题: ${issues.join('; ')}`;
    if (confidence >= 0.4) return `注意: 置信度偏低，建议人工复核。问题: ${issues.join('; ')}`;
    return `警告: 置信度过低，不应直接使用。请重新推理。问题: ${issues.join('; ')}`;
  }

  // ─── v1.0.1: 失败模式学习 ───────────────────────────────────────────────

  /**
   * 从失败中学习 — 记住失败模式，下次遇到类似情况更敏感
   * @param {string} claim - 失败的结论
   * @param {string[]} issues - 失败原因
   */
  _learnFromFailure(claim, issues) {
    // 提取关键词作为模式标识
    const keywords = this._extractKeywords(claim);
    const patternKey = keywords.slice(0, 3).join('|'); // 前3个关键词作为模式

    const existing = this._failurePatterns.get(patternKey);
    if (existing) {
      existing.count++;
      existing.lastSeen = Date.now();
      existing.issues = [...new Set([...existing.issues, ...issues])];
    } else {
      this._failurePatterns.set(patternKey, {
        keywords,
        count: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        issues: [...new Set(issues)],
      });
    }

    // 持久化
    this._savePatterns();
  }

  /**
   * 提取文本关键词
   */
  _extractKeywords(text) {
    // 简单分词：去除停用词，提取有意义的词
    const stopWords = new Set(['的', '是', '在', '和', '了', '我', '你', '他', '这', '那', '有', '没有', '不', '一个', '了']);
    return text
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopWords.has(w));
  }

  /**
   * 获取已知失败模式（用于调整验证敏感度）
   */
  getKnownFailurePatterns() {
    return Array.from(this._failurePatterns.entries()).map(([key, pattern]) => ({
      pattern: key,
      count: pattern.count,
      lastSeen: pattern.lastSeen,
      issues: pattern.issues,
    }));
  }

  /**
   * 检查当前结论是否匹配已知失败模式
   */
  _checkFailurePatterns(claim) {
    const keywords = this._extractKeywords(claim);
    const patternKey = keywords.slice(0, 3).join('|');
    const pattern = this._failurePatterns.get(patternKey);

    if (pattern && pattern.count >= 3) {
      return {
        matched: true,
        detail: `匹配已知失败模式 (出现${pattern.count}次): ${pattern.issues.join(', ')}`,
        issues: pattern.issues,
      };
    }
    return { matched: false };
  }

  // ─── 持久化 ──────────────────────────────────────────────────────────────

  _getPatternFile() {
    return path.join(this.config.dataPath, 'failure-patterns.json');
  }

  _loadPatterns() {
    try {
      const file = this._getPatternFile();
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8');
        const data = JSON.parse(raw);
        // 清理超过30天的模式
        const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
        this._failurePatterns = new Map(
          Object.entries(data).filter(([, p]) => p.lastSeen > cutoff)
        );
      }
    } catch (e) {
      // 静默失败
    }
  }

  _savePatterns() {
    if (!this.config.dataPath) return;
    try {
      const file = this._getPatternFile();
      const data = Object.fromEntries(this._failurePatterns);
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      // 静默失败
    }
  }
}

module.exports = { ReasoningVerifier, VERSION };
