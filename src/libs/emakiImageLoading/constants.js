/** P1-a: Fast Origin Transfer 逼迫を考慮し max を 1.3〜1.5倍に拡大 */
export const TIMEOUT_BOUNDS = {
  priority: { min: 1500, max: 8000, fallback: 2500 },
  fullscreen: { min: 2000, max: 10000, fallback: 3500 },
  universal: { min: 3000, max: 12000, fallback: 5500 },
};

/** P3-c: 絵巻別タイムアウト倍率 — cloudinary-breakdown.json の avg_kb に基づく */
export const PER_EMAKI_TIMEOUT = {
  "jigokusoushi-genke": 1.5,
  "kuso-zu-emaki": 1.2,
  "eshi-no-soshi": 1.2,
  "gakisoushi-kawamoto": 1.2,
};

export const MAX_LOAD_TIME_SAMPLES = 8;
export const TIMEOUT_MULTIPLIER = 2.5;
export const LOAD_TIME_STORAGE_KEY = "emaki_load_time_samples";

/** next/image lazyBoundary（通常）と IntersectionObserver rootMargin を揃える */
export const LAZY_IO_ROOT_MARGIN = "800px";

/** 検証完了後に false のまま維持、または削除 */
export const FB_DEBUG = false;

export const SKELETON_FADE_OUT_MS = 300;
