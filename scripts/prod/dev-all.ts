import { spawn, ChildProcess } from 'child_process';
import { appendFileSync } from 'fs';
import { join } from 'path';

type NamedChild = {
  name: string;
  child: ChildProcess;
};

const LOG_DIR = join(process.cwd(), 'logs');

function logToFile(name: string, data: string) {
  try {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${name}] ${data}`;
    appendFileSync(join(LOG_DIR, `${name}.log`), line);
  } catch {
    // 忽略日志写入失败
  }
}

function run(name: string, command: string): NamedChild {
  const child = spawn(command, {
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
    const { mkdirSync } = await import('fs');
    mkdirSync(LOG_DIR, { recursive: true });
  } catch {
    // 目录已存在或创建失败时忽略
  }

  const children: NamedChild[] = [
    run('web', 'npm run dev:web'),
    run('rss', 'npm run rss:schedule'),
    run('career', 'npm run career:schedule'),
  ];

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

main().catch(() => process.exit(1));
