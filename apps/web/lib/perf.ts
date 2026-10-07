/**
 * Lightweight server-side timing utility.
 * Logs operation durations with a `[PERF]` prefix so they're easy to grep.
 * No-op in production unless PERF_LOGGING=true is set.
 */

const enabled = process.env.NODE_ENV !== 'production' || process.env.PERF_LOGGING === 'true';

export function time<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!enabled) return fn();
  const start = performance.now();
  return fn().finally(() => {
    const ms = Math.round((performance.now() - start) * 100) / 100;
    console.log(`[PERF] ${label}: ${ms}ms`);
  });
}

export function timeSync<T>(label: string, fn: () => T): T {
  if (!enabled) return fn();
  const start = performance.now();
  const result = fn();
  const ms = Math.round((performance.now() - start) * 100) / 100;
  console.log(`[PERF] ${label}: ${ms}ms`);
  return result;
}