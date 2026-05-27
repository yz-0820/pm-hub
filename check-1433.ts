import Database from 'better-sqlite3';
const sqlite = new Database('./data/sqlite.db');

const item = sqlite.prepare('SELECT id, title, description, content FROM career_contents WHERE id = 1433').get() as any;
console.log('ID:', item.id);
console.log('Title:', item.title);
console.log('Description:', (item.description || '').substring(0, 300));
console.log('Content:', (item.content || '').substring(0, 300));

// Check if it has workplace anchors
const workplaceAnchors = ['职场', '工作', '公司', '老板', '同事', '上司', '下属', '汇报', '绩效', '面试', '招聘', '跨部门', '述职', '周报', 'OKR', 'KPI', '开会', '会议'];
const text = `${item.title} ${item.description || ''} ${item.content || ''}`;
console.log('\n包含的职场词:');
for (const a of workplaceAnchors) {
  if (text.includes(a)) console.log(`  "${a}"`);
}

sqlite.close();
