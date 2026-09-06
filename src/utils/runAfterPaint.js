/**
 * Run after the next paint (double rAF), then optionally on idle.
 * Use for non-critical mount work (likes fetch, analytics, sessionStorage).
 * @param {() => void} fn
 * @param {{ timeout?: number }} [opts] idle timeout ms (default 2000)
 * @returns {() => void} cancel
 */
export function runAfterPaint(fn, opts = {}) {
  if (typeof window === "undefined") return () => {};

  const idleTimeout = opts.timeout ?? 2000;
  let raf1 = 0;
  let raf2 = 0;
  let idleId = 0;
  let timeoutId = 0;
  let cancelled = false;

  const run = () => {
    if (cancelled) return;
    fn();
  };

  const scheduleIdle = () => {
    if (cancelled) return;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(run, { timeout: idleTimeout });
    } else {
      timeoutId = window.setTimeout(run, 0);
    }
  };

  raf1 = window.requestAnimationFrame(() => {
    raf2 = window.requestAnimationFrame(scheduleIdle);
  });

  return () => {
    cancelled = true;
    if (raf1) window.cancelAnimationFrame(raf1);
    if (raf2) window.cancelAnimationFrame(raf2);
    if (idleId && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idleId);
    }
    if (timeoutId) window.clearTimeout(timeoutId);
  };
}
