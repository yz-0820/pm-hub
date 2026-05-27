import { spawn, ChildProcess } from 'child_process';

type NamedChild = {
  name: string;
  child: ChildProcess;
};

function run(name: string, command: string): NamedChild {
  const child = spawn(command, {
    stdio: 'inherit',
    env: process.env,
    shell: true,
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
