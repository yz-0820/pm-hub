export async function register() {
  // 动态导入避免 webpack 解析 Node.js 内置模块
  try {
    const { startLocalCareerScheduler } = await import('./lib/career/local-scheduler');
    startLocalCareerScheduler();
  } catch (e) {
    console.error('[Career][LocalScheduler] Failed to start:', e);
  }
}
