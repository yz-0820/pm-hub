import { fetchAllCareerContents } from './fetcher';
import { invalidateContentCache } from './cache';

type SchedulerState = {
  started: boolean;
  running: boolean;
  intervalMs: number;
  timer?: NodeJS.Timeout;
};

function getEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return true; // 默认启用
}

function getIntervalMs(): number {
  const raw = process.env.LOCAL_CAREER_INTERVAL_MINUTES || '15';
  const minutes = Number(raw);
  if (!Number.isFinite(minutes) || minutes <= 0) return 15 * 60 * 1000;
  const clamped = Math.max(5, Math.min(120, Math.floor(minutes)));
  return clamped * 60 * 1000;
}

function getState(): SchedulerState {
  const g = globalThis as unknown as { __localCareerSchedulerState?: SchedulerState };
  if (!g.__localCareerSchedulerState) {
    g.__localCareerSchedulerState = { started: false, running: false, intervalMs: 0 };
  }
  return g.__localCareerSchedulerState;
}

async function runOnce(state: SchedulerState) {
  if (state.running) return;
  state.running = true;
  const startedAt = Date.now();

  try {
    const results = await fetchAllCareerContents();
    const totalFetched = results.reduce((sum: number, r) => sum + r.fetched, 0);
    const totalNew = results.reduce((sum: number, r) => sum + r.newContents, 0);
    const totalUpdated = results.reduce((sum: number, r) => sum + r.updatedContents, 0);
    const totalErrors = results.reduce((sum: number, r) => sum + r.errors.length, 0);

    if (totalNew > 0 || totalUpdated > 0) {
      await invalidateContentCache();
    }

    console.log(`[Career][LocalScheduler] Done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s. Sources=${results.length} Fetched=${totalFetched} New=${totalNew} Updated=${totalUpdated} Errors=${totalErrors}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[Career][LocalScheduler] Failed: ${msg}`);
  } finally {
    state.running = false;
  }
}

export function startLocalCareerScheduler(): void {
  if (!getEnabled()) return;

  const state = getState();
  if (state.started) return;

  state.started = true;
  state.intervalMs = getIntervalMs();

  console.log(`[Career][LocalScheduler] Enabled. Interval=${Math.round(state.intervalMs / 60000)}min`);

  const scheduleNext = () => {
    state.timer = setTimeout(async () => {
      await runOnce(state);
      scheduleNext();
    }, state.intervalMs);
  };

  // 首次延迟 3 秒后执行，然后每隔 intervalMs 执行一次
  setTimeout(async () => {
    await runOnce(state);
    scheduleNext();
  }, 3000);
}
