import Database from 'better-sqlite3';
import https from 'https';
import http from 'http';

const dbPath = process.env.DATABASE_URL || './data/sqlite.db';
const sqlite = new Database(dbPath);

// 获取所有资源
const allResources = sqlite.prepare('SELECT id, title, url, category, resource_type FROM resources').all() as Array<{
  id: number;
  title: string;
  url: string;
  category: string;
  resource_type: string;
}>;

console.log(`共找到 ${allResources.length} 条资源\n`);

// 检查URL是否可访问（跟随重定向）
function checkUrl(url: string, maxRedirects = 3): Promise<{ status: number; ok: boolean; finalUrl: string }> {
  return new Promise((resolve) => {
    if (maxRedirects <= 0) {
      resolve({ status: 0, ok: false, finalUrl: url });
      return;
    }

    const client = url.startsWith('https:') ? https : http;
    const req = client.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
      const status = res.statusCode || 0;
      
      // 处理重定向
      if (status >= 300 && status < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString();
        console.log(`  ↳ 重定向到: ${redirectUrl.slice(0, 60)}...`);
        checkUrl(redirectUrl, maxRedirects - 1).then(resolve);
        return;
      }
      
      resolve({ status, ok: status >= 200 && status < 400, finalUrl: url });
    });
    req.on('error', () => resolve({ status: 0, ok: false, finalUrl: url }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, ok: false, finalUrl: url });
    });
    req.end();
  });
}

async function validateResources() {
  const results = {
    valid: [] as typeof allResources,
    invalid: [] as Array<typeof allResources[0] & { status: number }>,
  };

  console.log('正在检查资源链接有效性（跟随重定向）...\n');

  for (const resource of allResources) {
    process.stdout.write(`检查: ${resource.title.slice(0, 40)}... `);
    const { status, ok } = await checkUrl(resource.url);
    
    if (ok) {
      console.log('✓ 正常');
      results.valid.push(resource);
    } else {
      console.log(`✗ 失败 (状态: ${status})`);
      results.invalid.push({ ...resource, status });
    }
  }

  console.log('\n========================================');
  console.log(`检查结果: ${results.valid.length} 个正常, ${results.invalid.length} 个失效`);
  console.log('========================================\n');

  if (results.invalid.length > 0) {
    console.log('失效的资源链接:');
    results.invalid.forEach((r) => {
      console.log(`\n[${r.category}] ${r.title}`);
      console.log(`  URL: ${r.url}`);
      console.log(`  状态: ${r.status || '无法访问'}`);
    });
  }

  return results;
}

validateResources().then(() => {
  sqlite.close();
  process.exit(0);
});
