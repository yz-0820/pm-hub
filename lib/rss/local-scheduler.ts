import { fetchAllRSS } from './fetcher';

type SchedulerState = {
  started: boolean;
  running: boolean;
  intervalMs: number;
  timer?: NodeJS.Timeout;
};

function getEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return (process.env.ENABLE_LOCAL_RSS_SCHEDULER || '').toLowerCase() === 'true';
}

function getIntervalMs(): number {
  const raw = process.env.LOCAL_RSS_INTERVAL_MINUTES || '60';
  const minutes = Number(raw);
  if (!Number.isFinite(minutes) || minutes <= 0) return 60 * 60 * 1000;
  const clamped = Math.max(10, Math.min(24 * 60, Math.floor(minutes)));
  return clamped * 60 * 1000;
}

function getState(): SchedulerState {
  const g = globalThis as unknown as { __localRssSchedulerState?: SchedulerState };
  if (!g.__localRssSchedulerState) {
    g.__localRssSchedulerState = { started: false, running: false, intervalMs: 0 };
  }
  return g.__localRssSchedulerState;
}

async function runOnce(state: SchedulerState) {
  if (state.running) return;
  state.running = true;
  const startedAt = Date.now();

  try {
    const results = await fetchAllRSS();
    const totalFetched = results.reduce((sum, r) => sum + r.fetched, 0);
    const totalNew = results.reduce((sum, r) => sum + r.newArticles, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    console.log(`[RSS][LocalScheduler] Done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s. Sources=${results.length} Fetched=${totalFetched} New=${totalNew} Errors=${totalErrors}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[RSS][LocalScheduler] Failed: ${msg}`);
  } finally {
    state.running = false;
  }
}

export function startLocalRssScheduler(): void {
  if (!getEnabled()) return;

  const state = getState();
  if (state.started) return;

  state.started = true;
  state.intervalMs = getIntervalMs();

  console.log(`[RSS][LocalScheduler] Enabled. Interval=${Math.round(state.intervalMs / 60000)}min`);

  const scheduleNext = () => {
    state.timer = setTimeout(async () => {
      await runOnce(state);
      scheduleNext();
    }, state.intervalMs);
  };

  setTimeout(async () => {
    await runOnce(state);
    scheduleNext();
  }, 1500);
}

