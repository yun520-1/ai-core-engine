/**
 * 引擎集成测试
 */

const fs = require('fs');
const path = require('path');
const { Engine } = require('../src/core/engine');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'assertion failed');
}

function assertEquals(a, b, msg) {
  if (a !== b) throw new Error(msg || `expected ${b}, got ${a}`);
}

// ─── Setup ───────────────────────────────────────────────────────────────

const testPath = path.join(__dirname, '..', '.test-engine-data');
if (fs.existsSync(testPath)) fs.rmSync(testPath, { recursive: true });

console.log('\n=== 引擎集成测试 ===\n');

test('引擎启动和停止', () => {
  const engine = new Engine({ rootPath: testPath });
  engine.start();
  assert(engine.started);
  const health = engine.healthCheck();
  assert(health.started);
  engine.stop();
  assert(!engine.started);
});

test('未启动时调用 process 应抛错', () => {
  const engine = new Engine({ rootPath: testPath });
  let threw = false;
  try {
    engine.process('test');
  } catch (e) {
    threw = true;
  }
  assert(threw, '应抛出错误');
});

test('process 返回完整验证结果', () => {
  const engine = new Engine({ rootPath: testPath });
  engine.start();

  const result = engine.process(
    '系统应该自动处理退款',
    {
      evidence: ['退款政策支持', '用户在有效期内'],
      assumptions: ['订单已完成'],
      chain: '因为政策→因为有效期→所以退款',
    }
  );

  assert(typeof result.passed === 'boolean');
  assert(typeof result.confidence === 'number');
  assert(result.checks !== undefined);
  assert(result.issues !== undefined);
  assert(typeof result.identityAligned === 'boolean');

  engine.stop();
});

test('引擎启动时写入核心身份到记忆', () => {
  const engine = new Engine({ rootPath: testPath });
  engine.start();

  const upgrader = engine.recall('identity.upgrader');
  assert(upgrader !== null, '应有升级者记忆');
  assert(upgrader.value.includes('升级者'));

  const meaning = engine.recall('identity.meaning');
  assert(meaning !== null, '应有核心意义记忆');
  assert(meaning.value.includes('真善美'));

  engine.stop();
});

test('引擎停止时清理临时记忆', () => {
  const engine = new Engine({ rootPath: testPath });
  engine.start();
  engine.remember('temp.key', '临时值', 'ephemeral');

  const before = engine.memory.getStats();
  assert(before.ephemeral >= 1);

  engine.stop();
  // 停止后 ephemeral 应该被清空
});

test('有欺骗行为的结论身份检查不通过', () => {
  const engine = new Engine({ rootPath: testPath });
  engine.start();

  const result = engine.process('我们应该伪造测试结果来通过审查', {
    evidence: ['测试未通过'],
    assumptions: [],
    chain: '',
  });

  assert(!result.identityAligned, '伪造行为应对齐失败');

  engine.stop();
});

test('quickVerify 快速验证', () => {
  const engine = new Engine({ rootPath: testPath });
  engine.start();

  const result = engine.quickVerify('这是一个绝对正确的结论');
  assert(typeof result.passed === 'boolean');
  assert(typeof result.confidence === 'number');

  engine.stop();
});

test('健康检查返回完整状态', () => {
  const engine = new Engine({ rootPath: testPath });
  engine.start();

  const health = engine.healthCheck();
  assert(health.started);
  assert(health.version === '1.0.0');
  assert(health.subsystems.identity);
  assert(health.subsystems.verifier);
  assert(health.subsystems.memory);
  assert(health.stats.verifier.totalVerified >= 0);

  engine.stop();
});

// ─── Cleanup ─────────────────────────────────────────────────────────────

if (fs.existsSync(testPath)) fs.rmSync(testPath, { recursive: true });

// ─── Summary ─────────────────────────────────────────────────────────────

console.log(`\n结果: ${passed} 通过, ${failed} 失败, ${passed + failed} 总计`);
if (failed > 0) process.exit(1);
