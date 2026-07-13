const { existsSync, mkdirSync, appendFileSync } = require('fs');
const { createConnection } = require('net');
const { dirname, join, resolve } = require('path');
const { spawn } = require('child_process');

const projectRoot = resolve(__dirname, '..', '..');
const flowchartRoot = resolve(projectRoot, '..', 'next-ai-draw-io');
const nodeExe = process.execPath;
const nodeDir = dirname(nodeExe);
const npmCli = process.env.npm_execpath;
const logDir = join(projectRoot, 'logs');

const mode = process.argv[2] || 'local';

function fail(message) {
  console.error(`[dev-runner] ${message}`);
  process.exit(1);
}

function ensureNode22Runtime() {
  const major = Number.parseInt(process.versions.node.split('.')[0], 10);
  if (major !== 22) fail(`Node.js 22 is required; current runtime is ${process.version}.`);
  if (!npmCli || !existsSync(npmCli)) fail('Run this launcher through an npm script so npm_execpath is available.');
}

function logToFile(name, data) {
  try {
    mkdirSync(logDir, { recursive: true });
    appendFileSync(join(logDir, `${name}.log`), `[${new Date().toISOString()}] ${data}`);
  } catch {
    // Keep dev processes alive even if log writing fails.
  }
}

function isPortOpen(port) {
  return new Promise((resolvePort) => {
    const socket = createConnection({ port, host: '127.0.0.1' });
    socket.once('connect', () => {
      socket.destroy();
      resolvePort(true);
    });
    socket.once('error', () => resolvePort(false));
    socket.setTimeout(800, () => {
      socket.destroy();
      resolvePort(false);
    });
  });
}

function spawnNpm(name, args, cwd, extraEnv = {}) {
  const env = {
    ...process.env,
    ...extraEnv,
    Path: `${nodeDir};${process.env.Path || ''}`,
    npm_config_node_gyp: process.env.npm_config_node_gyp,
  };

  const child = spawn(nodeExe, [npmCli, ...args], {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    process.stdout.write(`[${name}] ${text}`);
    logToFile(name, text);
  });

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    process.stderr.write(`[${name}] ${text}`);
    logToFile(name, text);
  });

  child.on('error', (error) => {
    console.error(`[${name}] Failed to start: ${error.message}`);
  });

  return child;
}

function stopAll(children, code) {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exit(code);
}

async function startWeb(children) {
  if (await isPortOpen(3000)) {
    console.log('[pm-hub] Skipped: port 3000 is already in use.');
    return;
  }

  children.push(
    spawnNpm('pm-hub', ['run', 'dev:web:raw'], projectRoot, {
      ENABLE_LOCAL_RSS_SCHEDULER: 'false',
      ENABLE_LOCAL_CAREER_SCHEDULER: 'false',
      LOCAL_SCHEDULER_LOGS: 'false',
    })
  );
}

async function startFlowchart(children) {
  if (!existsSync(join(flowchartRoot, 'package.json'))) {
    console.log(`[flowchart] Skipped: ${flowchartRoot} does not exist.`);
    return;
  }

  if (await isPortOpen(6002)) {
    console.log('[flowchart] Skipped: port 6002 is already in use.');
    return;
  }

  children.push(spawnNpm('flowchart', ['run', 'dev'], flowchartRoot));
}

function startSchedulers(children) {
  children.push(spawnNpm('rss', ['run', 'rss:schedule'], projectRoot));
  children.push(spawnNpm('career', ['run', 'career:schedule'], projectRoot));
}

async function main() {
  ensureNode22Runtime();

  const children = [];
  if (mode === 'web') {
    await startWeb(children);
  } else if (mode === 'flowchart') {
    await startFlowchart(children);
  } else if (mode === 'local') {
    await startWeb(children);
    await startFlowchart(children);
  } else if (mode === 'schedulers') {
    startSchedulers(children);
  } else {
    fail(`Unknown mode "${mode}". Use web, flowchart, local, or schedulers.`);
  }

  if (children.length === 0) return;

  process.on('SIGINT', () => stopAll(children, 0));
  process.on('SIGTERM', () => stopAll(children, 0));

  for (const child of children) {
    child.on('exit', (code) => {
      stopAll(children, typeof code === 'number' ? code : 1);
    });
  }
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
