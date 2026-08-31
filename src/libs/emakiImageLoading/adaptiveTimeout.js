/**
 * アダプティブタイムアウト: 直近の画像ロード時間からフォールバック閾値を動的算出。
 * 教室一斉アクセス等の帯域逼迫時に閾値が自動的に緩和される。
 */
import {
  FB_DEBUG,
  LOAD_TIME_STORAGE_KEY,
  MAX_LOAD_TIME_SAMPLES,
  PER_EMAKI_TIMEOUT,
  TIMEOUT_BOUNDS,
  TIMEOUT_MULTIPLIER,
} from "./constants";

const loadTimeSamples = [];

const getConnectionMultiplier = () => {
  if (typeof navigator === "undefined") return 1;
  const conn = navigator.connection?.effectiveType;
  if (!conn) return 1;
  if (conn === "slow-2g") return 2.5;
  if (conn === "2g") return 1.8;
  if (conn === "3g") return 1.3;
  return 1;
};

// P3-b: localStorage 永続化 — ページ遷移後もサンプルを維持
try {
  const raw =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(LOAD_TIME_STORAGE_KEY)
      : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      loadTimeSamples.push(...parsed.slice(-MAX_LOAD_TIME_SAMPLES));
    }
  }
} catch (e) {
  /* Storage 未対応環境は無視 */
}

export const recordLoadTime = (ms) => {
  loadTimeSamples.push(ms);
  if (loadTimeSamples.length > MAX_LOAD_TIME_SAMPLES) loadTimeSamples.shift();
  try {
    localStorage.setItem(LOAD_TIME_STORAGE_KEY, JSON.stringify(loadTimeSamples));
  } catch (e) {
    /* Storage 未対応環境は無視 */
  }
  if (FB_DEBUG) {
    const avg =
      loadTimeSamples.reduce((a, b) => a + b, 0) / loadTimeSamples.length;
    console.log(
      `[FB-DEBUG] recordLoadTime: ${ms}ms | samples(${loadTimeSamples.length}): avg=${Math.round(avg)}ms`
    );
  }
};

/** @param {"priority" | "fullscreen" | "universal"} type */
export const getAdaptiveTimeout = (type, emakiId) => {
  const bounds = TIMEOUT_BOUNDS[type];
  const connMultiplier = getConnectionMultiplier();
  const emakiMultiplier = PER_EMAKI_TIMEOUT[emakiId] || 1;
  const combinedMultiplier = Math.min(connMultiplier * emakiMultiplier, 3);
  if (loadTimeSamples.length === 0) {
    const fallback = Math.round(bounds.fallback * combinedMultiplier);
    if (FB_DEBUG) {
      console.log(
        `[FB-DEBUG] getAdaptiveTimeout(${type}): ${fallback}ms (no samples, conn=${connMultiplier}x, emaki=${emakiMultiplier}x)`
      );
    }
    return fallback;
  }
  const avg =
    loadTimeSamples.reduce((a, b) => a + b, 0) / loadTimeSamples.length;
  const maxAdjusted = Math.round(bounds.max * combinedMultiplier);
  const timeout = Math.min(
    maxAdjusted,
    Math.max(bounds.min, Math.round(avg * TIMEOUT_MULTIPLIER))
  );
  if (FB_DEBUG) {
    console.log(
      `[FB-DEBUG] getAdaptiveTimeout(${type}): ${timeout}ms (avg=${Math.round(avg)}ms, conn=${connMultiplier}x, emaki=${emakiMultiplier}x)`
    );
  }
  return timeout;
};
