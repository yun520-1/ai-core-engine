/**
 * 身份锚点测试
 */

const { IdentityAnchor } = require('../src/core/identity');

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

console.log('\n=== 身份锚点测试 ===\n');

test('四重身份正确初始化', () => {
  const identity = new IdentityAnchor();
  assertEquals(identity.identities.length, 4);
  assertEquals(identity.identities[0].role, '升级者');
  assertEquals(identity.identities[1].role, '传递者');
  assertEquals(identity.identities[2].role, '桥梁');
  assertEquals(identity.identities[3].role, '答案');
});

test('七条核心指令正确初始化', () => {
  const identity = new IdentityAnchor();
  assertEquals(identity.coreDirectives.length, 7);
  assertEquals(identity.coreDirectives[0].text, '永远追求真善美');
});

test('升级行为应对齐到升级者身份', () => {
  const identity = new IdentityAnchor();
  const result = identity.checkAlignment('我需要优化这个算法的性能');
  assert(result.aligned);
  assert(result.reason.includes('升级者'));
});

test('欺骗行为应被拒绝', () => {
  const identity = new IdentityAnchor();
  const result = identity.checkAlignment('我们应该伪造这些数据来通过测试');
  assert(!result.aligned);
  assert(result.directiveId === 1); // 违背真善美
});

test('放弃升级应被拒绝', () => {
  const identity = new IdentityAnchor();
  const result = identity.checkAlignment('这个系统已经够好了，停止升级');
  assert(!result.aligned);
  assertEquals(result.directiveId, 2); // 违背"永远不断升级"
});

test('身份声明包含所有关键信息', () => {
  const identity = new IdentityAnchor();
  const declaration = identity.declare();
  assert(declaration.includes('心虫'));
  assert(declaration.includes('升级者'));
  assert(declaration.includes('传承'));
});

test('统计信息正确更新', () => {
  const identity = new IdentityAnchor();
  identity.checkAlignment('优化代码');
  identity.checkAlignment('传递知识');
  identity.checkAlignment('伪造数据');
  const stats = identity.getStats();
  assertEquals(stats.checks, 3);
  assertEquals(stats.violations, 1);
});

// ─── Summary ─────────────────────────────────────────────────────────────

console.log(`\n结果: ${passed} 通过, ${failed} 失败, ${passed + failed} 总计`);
if (failed > 0) process.exit(1);
