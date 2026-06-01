/**
 * 使用新关键词矩阵对现有 career_contents 重新分类
 * 运行: npx tsx scripts/reclassify-career.ts
 */
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data/sqlite.db');
const db = new Database(DB_PATH);

// 从 config 复制关键词（避免 TS 模块导入复杂）
const categoryKeywords: Record<string, Array<[string, number]>> = {
  communication: [
    ['倾听', 3], ['聆听', 3], ['共情', 3], ['同理心', 3], ['换位思考', 3],
    ['沟通', 3], ['表达', 3], ['汇报', 3], ['演讲', 3], ['写作', 2],
    ['PPT', 2], ['演示', 2], ['表达力', 3], ['口才', 2], ['说服力', 3],
    ['沟通技巧', 3], ['沟通能力', 3], ['沟通方法', 3],
    ['肢体语言', 2], ['气场', 2],
    ['冲突', 3], ['矛盾', 3], ['分歧', 3], ['调解', 3], ['化解', 3],
    ['冲突管理', 3], ['谈判', 3], ['协商', 3],
    ['向上管理', 3], ['跨部门', 3], ['情商', 3], ['人际关系', 3],
    ['会议发言', 3], ['公开场合', 2], ['反馈', 2], ['说话', 1],
  ],
  productivity: [
    ['时间管理', 3], ['番茄', 3], ['GTD', 3], ['时间块', 3],
    ['优先级', 3], ['四象限', 3], ['要事第一', 3], ['任务管理', 3],
    ['专注', 3], ['注意力', 3], ['心流', 3], ['深度工作', 3],
    ['效率', 3], ['生产力', 3], ['工作方法', 3], ['工作流', 3], ['自动化', 3],
    ['习惯', 2], ['自律', 2], ['拖延', 2], ['番茄钟', 3],
    ['效率工具', 3], ['浏览器扩展', 2], ['知识管理', 3], ['笔记', 2],
    ['AI工具', 3], ['Claude', 2], ['ChatGPT', 2], ['复盘', 2],
  ],
  teamwork: [
    ['目标对齐', 3], ['一致', 3], ['共同目标', 3], ['OKR', 3],
    ['角色分工', 3], ['分工', 3], ['职责', 2],
    ['信任', 3], ['坦诚', 3], ['透明', 2], ['心理安全', 3], ['包容', 2],
    ['协作工具', 3], ['协同工具', 3], ['协同办公', 3], ['在线协作', 3],
    ['飞书', 2], ['钉钉', 2], ['Teams', 2], ['Slack', 2], ['文档协作', 3],
    ['团队', 3], ['协作', 3], ['合作', 3], ['协同', 3],
    ['团队建设', 3], ['凝聚力', 3], ['团队文化', 3], ['团建', 3],
    ['项目管理', 3], ['Scrum', 3], ['Kanban', 3], ['敏捷', 3],
    ['远程协作', 3], ['远程办公', 3], ['分布式团队', 3],
    ['头脑风暴', 2], ['站会', 2],
  ],
  leadership: [
    ['战略', 3], ['决策', 3], ['判断力', 3], ['商业决策', 3], ['战略思维', 3],
    ['商业模式', 3], ['竞争分析', 3], ['变革', 3], ['转型', 3],
    ['团队管理', 3], ['带团队', 3], ['带人', 3], ['管理能力', 3],
    ['管理者', 3], ['管理经验', 3], ['人才培养', 3], ['梯队', 3],
    ['绩效管理', 3], ['激励', 3], ['授权', 3], ['放权', 3],
    ['领导力', 3], ['影响力', 3], ['号召力', 3],
    ['执行力', 3], ['结果导向', 3], ['拿结果', 3],
    ['管理者思维', 3], ['CEO', 3], ['CTO', 3], ['VP', 2], ['总监', 2],
    ['晋升', 2], ['职场晋升', 3], ['职业规划', 2], ['转管理', 3],
  ],
};

function autoClassify(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  const scores: Record<string, number> = { communication: 0, productivity: 0, teamwork: 0, leadership: 0 };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const [keyword, weight] of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[category] += weight;
      }
    }
  }
  
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] >= 2 && sorted[0][1] > sorted[1][1]) {
    return sorted[0][0];
  }
  return 'all';
}

const allItems = db
  .prepare("SELECT id, title, description, category FROM career_contents WHERE category = 'all' AND status = 'active'")
  .all() as Array<{ id: number; title: string; description: string | null; category: string }>;
console.log(`[Reclassify] Found ${allItems.length} items with category='all'`);

let changed = 0;
const update = db.prepare('UPDATE career_contents SET category = ?, updated_at = ? WHERE id = ?');
const now = Math.floor(Date.now() / 1000);

for (const item of allItems) {
  const newCategory = autoClassify(item.title, item.description || '');
  if (newCategory !== 'all' && newCategory !== item.category) {
    update.run(newCategory, now, item.id);
    changed++;
    console.log(`  [${newCategory}] ${item.title.substring(0, 50)}`);
  }
}

console.log(`\n[Reclassify] Reclassified ${changed}/${allItems.length} items`);

// 最终统计
const stats = db
  .prepare("SELECT category, COUNT(*) as cnt FROM career_contents WHERE status = 'active' GROUP BY category")
  .all() as Array<{ category: string; cnt: number }>;
console.log('\n[Final] Category distribution:');
for (const row of stats) {
  console.log(`  ${row.category}: ${row.cnt}`);
}

db.close();
console.log('\n[Reclassify] Done!');
