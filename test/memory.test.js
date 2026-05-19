/**
 * 记忆系统测试
 */

const fs = require('fs');
const path = require('path');
const { MeaningfulMemory } = require('../src/core/memory');

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

const testPath = path.join(__dirname, '..', '.test-memory-data');

// 清理旧数据
if (fs.existsSync(testPath)) {
  fs.rmSync(testPath, { recursive: true });
}

console.log('\n=== 记忆系统测试 ===\n');

test('初始化创建数据目录', () => {
  const memory = new MeaningfulMemory(testPath);
  assert(fs.existsSync(path.join(testPath, 'data')));
});

test('添加和读取核心记忆', () => {
  const memory = new MeaningfulMemory(testPath);
  memory.addCore('test.key1', '核心数据', ['core']);
  const result = memory.get('test.key1');
  assert(result !== null);
  assertEquals(result.value, '核心数据');
  assertEquals(result.tier, 'core');
});

test('添加和读取学习记忆', () => {
  const memory = new MeaningfulMemory(testPath);
  memory.addLearned('test.key2', '学习数据', ['learned']);
  const result = memory.get('test.key2');
  assert(result !== null);
  assertEquals(result.tier, 'learned');
});

test('添加和读取临时记忆', () => {
  const memory = new MeaningfulMemory(testPath);
  memory.addEphemeral('test.key3', '临时数据', ['ephemeral']);
  const result = memory.get('test.key3');
  assert(result !== null);
  assertEquals(result.tier, 'ephemeral');
});

test('核心记忆优先级高于学习记忆', () => {
  const memory = new MeaningfulMemory(testPath);
  memory.addCore('test.priority', '核心值');
  memory.addLearned('test.priority', '学习值');
  const result = memory.get('test.priority');
  assertEquals(result.value, '核心值');
  assertEquals(result.tier, 'core');
});

test('标签搜索', () => {
  const memory = new MeaningfulMemory(testPath);
  memory.addCore('search.1', '值1', ['identity', 'core']);
  memory.addCore('search.2', '值2', ['identity', 'secondary']);
  const results = memory.searchByTag('identity');
  assertEquals(results.length, 2);
});

test('删除记忆', () => {
  const memory = new MeaningfulMemory(testPath);
  memory.addLearned('test.delete', '待删除');
  const deleted = memory.delete('test.delete');
  assert(deleted);
  const result = memory.get('test.delete');
  assert(result === null);
});

test('过期的学习记忆应被清理', () => {
  const memory = new MeaningfulMemory(testPath);
  memory.addLearned('test.expired', '过期数据');
  // 手动设置过期时间为过去
  memory._store.learned['test.expired'].expires = Date.now() - 1000;
  memory._save();

  const memory2 = new MeaningfulMemory(testPath);
  const cleaned = memory2.cleanExpired();
  assert(cleaned >= 1);
  const result = memory2.get('test.expired');
  assert(result === null);
});

test('统计正确', () => {
  const memory = new MeaningfulMemory(testPath);
  const stats = memory.getStats();
  assert(stats.core >= 0);
  assert(stats.learned >= 0);
  assert(stats.ephemeral >= 0);
});

// ─── Cleanup ─────────────────────────────────────────────────────────────

if (fs.existsSync(testPath)) {
  fs.rmSync(testPath, { recursive: true });
}

// ─── Summary ─────────────────────────────────────────────────────────────

console.log(`\n结果: ${passed} 通过, ${failed} 失败, ${passed + failed} 总计`);
if (failed > 0) process.exit(1);
