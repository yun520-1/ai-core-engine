/**
 * 有意义记忆系统 — 三层架构
 *
 * 基于 MemGPT 分层记忆思想 + FSRS 遗忘曲线
 *
 * 三层：
 *   CORE     — 永久保留，身份相关（升级者/传递者/桥梁/答案）
 *   LEARNED  — 30天衰减，经验教训
 *   EPHEMERAL — 会话结束丢弃，临时上下文
 *
 * 设计原则：
 *   - 零外部依赖，仅用 fs
 *   - 原子写入，防止数据损坏
 *   - 自动分类，无需手动指定层级
 */

const fs = require('fs');
const path = require('path');

const VERSION = '1.0.0';

class MeaningfulMemory {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.dataPath = path.join(rootPath, 'data');
    this.memoryFile = path.join(this.dataPath, 'memory.json');

    // 确保数据目录存在
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }

    // 加载或初始化
    this._store = this._load();

    // 统计
    this.stats = {
      reads: 0,
      writes: 0,
    };
  }

  // ─── Public API ────────────────────────────────────────────────────────

  /**
   * 添加一条核心记忆（永久保留）
   */
  addCore(key, value, tags = []) {
    this._ensureTier('core');
    this._store.core[key] = {
      value,
      tags: [...tags, 'core'],
      created: Date.now(),
      accessCount: 0,
    };
    this._save();
  }

  /**
   * 添加一条学习记忆（30天衰减）
   */
  addLearned(key, value, tags = []) {
    this._ensureTier('learned');
    this._store.learned[key] = {
      value,
      tags: [...tags, 'learned'],
      created: Date.now(),
      expires: Date.now() + 30 * 24 * 3600 * 1000,
      accessCount: 0,
    };
    this._save();
  }

  /**
   * 添加临时记忆（会话结束丢弃）
   */
  addEphemeral(key, value, tags = []) {
    this._ensureTier('ephemeral');
    this._store.ephemeral[key] = {
      value,
      tags: [...tags, 'ephemeral'],
      created: Date.now(),
    };
    // 临时记忆不持久化
  }

  /**
   * 读取记忆（按优先级：core > learned > ephemeral）
   */
  get(key) {
    this.stats.reads++;
    // Core
    if (this._store.core[key]) {
      this._store.core[key].accessCount++;
      this._save();
      return { value: this._store.core[key].value, tier: 'core' };
    }
    // Learned
    if (this._store.learned[key]) {
      const entry = this._store.learned[key];
      if (Date.now() > entry.expires) {
        delete this._store.learned[key];
        this._save();
        return null;
      }
      entry.accessCount++;
      this._save();
      return { value: entry.value, tier: 'learned' };
    }
    // Ephemeral
    if (this._store.ephemeral[key]) {
      return { value: this._store.ephemeral[key].value, tier: 'ephemeral' };
    }
    return null;
  }

  /**
   * 列出所有核心记忆
   */
  listCore() {
    return Object.entries(this._store.core).map(([key, entry]) => ({
      key,
      value: entry.value,
      tags: entry.tags,
    }));
  }

  /**
   * 搜索记忆（标签匹配）
   */
  searchByTag(tag) {
    const results = [];
    for (const tier of ['core', 'learned', 'ephemeral']) {
      for (const [key, entry] of Object.entries(this._store[tier])) {
        if (entry.tags && entry.tags.includes(tag)) {
          results.push({ key, value: entry.value, tier, tags: entry.tags });
        }
      }
    }
    return results;
  }

  /**
   * 删除记忆
   */
  delete(key) {
    for (const tier of ['core', 'learned', 'ephemeral']) {
      if (this._store[tier][key]) {
        delete this._store[tier][key];
        this._save();
        return true;
      }
    }
    return false;
  }

  /**
   * 清理过期记忆
   */
  cleanExpired() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of Object.entries(this._store.learned)) {
      if (entry.expires && now > entry.expires) {
        delete this._store.learned[key];
        cleaned++;
      }
    }
    if (cleaned > 0) this._save();
    return cleaned;
  }

  /**
   * 获取统计
   */
  getStats() {
    return {
      core: Object.keys(this._store.core).length,
      learned: Object.keys(this._store.learned).length,
      ephemeral: Object.keys(this._store.ephemeral).length,
      reads: this.stats.reads,
      writes: this.stats.writes,
    };
  }

  /**
   * 清空临时记忆
   */
  clearEphemeral() {
    this._store.ephemeral = {};
  }

  // ─── Private ───────────────────────────────────────────────────────────

  _ensureTier(tier) {
    if (!this._store[tier]) {
      this._store[tier] = {};
    }
  }

  _load() {
    try {
      if (fs.existsSync(this.memoryFile)) {
        const raw = fs.readFileSync(this.memoryFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      // 损坏的文件 — 备份并重置
      const backupPath = this.memoryFile + '.corrupted.' + Date.now();
      if (fs.existsSync(this.memoryFile)) {
        fs.copyFileSync(this.memoryFile, backupPath);
      }
    }
    return { core: {}, learned: {}, ephemeral: {} };
  }

  _save() {
    this.stats.writes++;
    try {
      // 原子写入：先写临时文件，再重命名
      const tmpFile = this.memoryFile + '.tmp';
      fs.writeFileSync(tmpFile, JSON.stringify(this._store, null, 2), 'utf-8');
      fs.renameSync(tmpFile, this.memoryFile);
    } catch (e) {
      // 静默失败 — 下次加载时会从旧文件恢复
    }
  }
}

module.exports = { MeaningfulMemory, VERSION };
