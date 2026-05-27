import { startLocalCareerScheduler } from './lib/career/local-scheduler';

export async function register() {
  // 启动职业发展本地定时抓取
  startLocalCareerScheduler();
}
