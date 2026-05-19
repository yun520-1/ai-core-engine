/**
 * AI核心引擎 — 心虫
 *
 * 产品级 AI 能力层入口
 *
 * 使用：
 *   const { Engine } = require('ai-core-engine');
 *   const engine = new Engine({ rootPath: './data' });
 *   engine.start();
 *   const result = engine.process("结论", { evidence: [...], assumptions: [] });
 */

const { Engine } = require('./core/engine');
const { IdentityAnchor } = require('./core/identity');
const { ReasoningVerifier } = require('./core/verifier');
const { MeaningfulMemory } = require('./core/memory');

module.exports = {
  Engine,
  IdentityAnchor,
  ReasoningVerifier,
  MeaningfulMemory,
  VERSION: require('./core/engine').VERSION,
};
