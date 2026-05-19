/**
 * 推理验证引擎测试
 */

const { ReasoningVerifier } = require('../src/core/verifier');

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

// ─── Tests ───────────────────────────────────────────────────────────────

console.log('\n=== 推理验证器测试 ===\n');

const verifier = new ReasoningVerifier({ minConfidence: 0.6 });

test('有充分证据和推理链的结论应通过', () => {
  const result = verifier.verify(
    '用户应该获得退款',
    {
      evidence: ['退款政策允许7天内退款', '用户订单在有效期内'],
      assumptions: ['订单状态为已完成'],
      chain: '因为政策允许→因为订单在有效期内→所以应该退款',
    }
  );
  assert(result.passed, '应该通过验证');
  assert(result.confidence >= 0.6, `置信度应该 >= 0.6, 实际: ${result.confidence}`);
});

test('无证据的结论不应通过', () => {
  const result = verifier.verify(
    '这个功能一定成功',
    { evidence: [], assumptions: [], chain: '' }
  );
  assert(!result.passed, '无证据的结论不应通过');
  assert(result.confidence <= 0.4, `置信度应该低, 实际: ${result.confidence}`);
});

test('包含绝对词的结论应被标记', () => {
  const result = verifier.verify(
    '这个方案绝对正确，一定不会出问题',
    {
      evidence: ['测试通过', '代码审查通过'],
      assumptions: [],
      chain: '',
    }
  );
  const absCheck = result.checks.absolute;
  assert(!absCheck.passed, '绝对词检查应该不通过');
});

test('空结论应被拒绝', () => {
  const result = verifier.verify('', { evidence: [], assumptions: [], chain: '' });
  assert(!result.passed, '空结论应被拒绝');
  assertEquals(result.confidence, 0, '空结论置信度应为0');
});

test('反事实验证应检测未验证假设', () => {
  const result = verifier.verify(
    '显然这个方案是最优的',
    {
      evidence: ['方案A比其他方案快'],
      assumptions: [],
      chain: '',
    }
  );
  const cfCheck = result.checks.counterfactual;
  assert(!cfCheck.passed, '未验证假设应被检测');
});

test('覆盖度检查要求至少2条证据', () => {
  const result = verifier.verify(
    '系统性能提升了',
    {
      evidence: ['响应时间减少了50%'],
      assumptions: [],
      chain: '',
    }
  );
  const covCheck = result.checks.coverage;
  assert(!covCheck.passed, '证据不足应被检测');
});

test('5条证据全部通过的结论置信度应为1.0', () => {
  const result = verifier.verify(
    '系统的CPU使用率从80%降到了50%，内存使用从4GB降到了2GB',
    {
      evidence: ['优化了算法复杂度', '减少了内存分配', '使用了缓存'],
      assumptions: ['硬件环境不变'],
      chain: '因为优化了算法→因为减少了内存分配→所以资源使用降低',
    }
  );
  assert(result.confidence === 1.0, `置信度应为1.0, 实际: ${result.confidence}`);
});

test('统计信息正确', () => {
  const stats = verifier.getStats();
  assert(stats.totalVerified >= 7, `至少验证了7次, 实际: ${stats.totalVerified}`);
});

// ─── Summary ─────────────────────────────────────────────────────────────

console.log(`\n结果: ${passed} 通过, ${failed} 失败, ${passed + failed} 总计`);
if (failed > 0) process.exit(1);
