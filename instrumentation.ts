type SchedulerName = 'rss' | 'career';

type SchedulerProcessState = {
  started: Partial<Record<SchedulerName, boolean>>;
};

const schedulerCommands: Record<SchedulerName, { envKey: string; script: string; logPrefix: string }> = {
  rss: {
    envKey: 'ENABLE_LOCAL_RSS_SCHEDULER',
    script: 'rss:schedule',
    logPrefix: 'RSS',
  },
  career: {
    envKey: 'ENABLE_LOCAL_CAREER_SCHEDULER',
    script: 'career:schedule',
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
  return (process.env[envKey] || 'true').toLowerCase() !== 'false';
}

async function startSchedulerProcess(name: SchedulerName) {
  if (!shouldStartScheduler(name)) return;

  const state = getSchedulerProcessState();
  if (state.started[name]) return;
  state.started[name] = true;

  const { script, logPrefix } = schedulerCommands[name];
  const runtimeRequire = eval('require') as NodeRequire;
  const { spawn } = runtimeRequire('child_process') as typeof import('child_process');
  const child = spawn('npm.cmd', ['run', script], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    windowsHide: true,
    detached: true,
  });

  // 子进程独立运行，不阻塞父进程退出
  child.unref();

  child.stdout?.on('data', (chunk) => {
    process.stdout.write(`[${logPrefix}][SchedulerProcess] ${chunk}`);
  });

  child.stderr?.on('data', (chunk) => {
    process.stderr.write(`[${logPrefix}][SchedulerProcess] ${chunk}`);
  });

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
