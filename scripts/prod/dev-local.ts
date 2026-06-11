import { spawn, ChildProcess } from 'child_process';
import { existsSync, appendFileSync, mkdirSync } from 'fs';
import { createConnection } from 'net';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

type NamedChild = {
  name: string;
  child: ChildProcess;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const flowchartRoot = join(projectRoot, '..', 'next-ai-draw-io');
const LOG_DIR = join(projectRoot, 'logs');

function logToFile(name: string, data: string) {
  try {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${name}] ${data}`;
    appendFileSync(join(LOG_DIR, `${name}.log`), line);
  } catch {
    // 忽略日志写入失败
  }
}

function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.setTimeout(800, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function run(name: string, command: string, cwd: string): NamedChild {
  const child = spawn(command, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    shell: true,
    windowsHide: true,
  });

  child.stdout?.on('data', (data: Buffer) => logToFile(name, data.toString()));
  child.stderr?.on('data', (data: Buffer) => logToFile(name, data.toString()));

  return { name, child };
}

function stopAll(children: NamedChild[], code: number) {
  for (const { child } of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exit(code);
}

async function main() {
  // 确保日志目录存在
  try {
    mkdirSync(LOG_DIR, { recursive: true });
  } catch {
    // 目录已存在或创建失败时忽略
  }

  const children: NamedChild[] = [];

  children.push(run('pm-hub', 'npm run dev:web', projectRoot));

  if (!existsSync(flowchartRoot)) {
    console.warn(`[flowchart] Skipped: ${flowchartRoot} does not exist.`);
  } else if (await isPortOpen(6002)) {
    console.warn('[flowchart] Skipped: port 6002 is already in use.');
  } else {
    children.push(run('flowchart', 'npm run dev', flowchartRoot));
  }

  const onSignal = () => stopAll(children, 0);
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);

  for (const item of children) {
    item.child.on('error', () => stopAll(children, 1));
    item.child.on('exit', (code) => {
      const exitCode = typeof code === 'number' ? code : 1;
      stopAll(children, exitCode);
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
