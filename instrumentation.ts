import type { StdioOptions } from 'child_process';

type SchedulerName = 'rss' | 'career';

type SchedulerProcessState = {
  started: Partial<Record<SchedulerName, boolean>>;
};

const schedulerCommands: Record<SchedulerName, { envKey: string; entry: string; logPrefix: string }> = {
  rss: {
    envKey: 'ENABLE_LOCAL_RSS_SCHEDULER',
    entry: 'scripts/prod/scheduled-fetch-rss.ts',
    logPrefix: 'RSS',
  },
  career: {
    envKey: 'ENABLE_LOCAL_CAREER_SCHEDULER',
    entry: 'scripts/prod/scheduled-fetch-career.ts',
    logPrefix: 'Career',
  },
};

function getSchedulerProcessState(): SchedulerProcessState {
  const g = globalThis as unknown as { __pmHubSchedulerProcessState?: SchedulerProcessState };
  if (!g.__pmHubSchedulerProcessState) {
    g.__pmHubSchedulerProcessState = { started: {} };
  }
  return g.__pmHubSchedulerProcessState;
}

function shouldStartScheduler(name: SchedulerName): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  const envKey = schedulerCommands[name].envKey;
  const value = process.env[envKey];
  // 必须显式设置为 true 才启动
  return value !== undefined && value.toLowerCase() === 'true';
}

async function startSchedulerProcess(name: SchedulerName) {
  if (!shouldStartScheduler(name)) return;

  const state = getSchedulerProcessState();
  if (state.started[name]) return;
  state.started[name] = true;

  const { entry, logPrefix } = schedulerCommands[name];
  const runtimeRequire = eval('require') as NodeRequire;
  const { spawn } = runtimeRequire('child_process') as typeof import('child_process');
  const { join } = runtimeRequire('path') as typeof import('path');
  const tsxCli = join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const shouldForwardLogs = (process.env.LOCAL_SCHEDULER_LOGS || '').toLowerCase() === 'true';
  const stdio: StdioOptions = shouldForwardLogs ? ['ignore', 'pipe', 'pipe'] : 'ignore';

  const child = spawn(process.execPath, [tsxCli, entry], {
    cwd: process.cwd(),
    env: process.env,
    stdio,
    windowsHide: true,
  });

  console.log(`[${logPrefix}][SchedulerProcess] Started silently`);

  if (shouldForwardLogs) {
    child.stdout?.on('data', (chunk) => {
      process.stdout.write(`[${logPrefix}][SchedulerProcess] ${chunk}`);
    });

    child.stderr?.on('data', (chunk) => {
      process.stderr.write(`[${logPrefix}][SchedulerProcess] ${chunk}`);
    });
  }

  child.on('exit', (code, signal) => {
    state.started[name] = false;
    console.error(`[${logPrefix}][SchedulerProcess] Exited code=${code ?? 'null'} signal=${signal ?? 'null'}`);
  });
}

export async function register() {
  for (const name of Object.keys(schedulerCommands) as SchedulerName[]) {
    try {
      await startSchedulerProcess(name);
    } catch (e) {
      console.error(`[${schedulerCommands[name].logPrefix}][SchedulerProcess] Failed to start:`, e);
    }
  }
}
