import { spawn, ChildProcess } from 'child_process';
import { existsSync } from 'fs';
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
    stdio: 'inherit',
    env: process.env,
    shell: true,
    windowsHide: true,
  });

  return { name, child };
}

function stopAll(children: NamedChild[], code: number) {
  for (const { child } of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exit(code);
}

async function main() {
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
