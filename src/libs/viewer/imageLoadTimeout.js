// アダプティブタイムアウト: 直近の画像ロード時間からフォールバック閾値を動的算出
// セッション内（メモリ）限定。localStorage 永続化は汚染により廃止。

// =============================================================================
// デバッグスイッチ
// 検証完了後は false にすることで、すべてのコンソール出力を一括で停止できます。
// =============================================================================
const DEBUG_IMAGE_LOAD = false;

function logDebug(tag, ...args) {
  if (!DEBUG_IMAGE_LOAD) return;
  const time = performance.now().toFixed(1);
  console.log(`%c[${time}ms][${tag}]`, "color: #3b82f6; font-weight: bold;", ...args);
}

// ---------------------------------------------------------------------------
// 1. 定数・サンプルバッファ（State 相当・モジュールスコープ）
// ---------------------------------------------------------------------------
export const loadTimeSamples = [];
export const MAX_SAMPLES = 8;
export const TIMEOUT_MULTIPLIER = 2.5;
export const MIN_MEASURABLE_LOAD_MS = 150;

export const PER_EMAKI_TIMEOUT = {
  "Chōjū-jinbutsu-giga_first": 1.3,
  "jigokusoushi_anzyuin": 1.5,
  "kusouzumaki": 1.2,
  "eshi-no-soshi_tohaku": 1.2,
  "gakisoushi_kawamoto": 1.2,
};

export const TIMEOUT_BOUNDS = {
  priority: { min: 3000, max: 12000, fallback: 5000 },
  fullscreen: { min: 4000, max: 15000, fallback: 6000 },
  universal: { min: 5000, max: 18000, fallback: 8000 },
};

// ---------------------------------------------------------------------------
// [計算関数] ネットワーク種別倍率
// ---------------------------------------------------------------------------
export const getConnectionMultiplier = () => {
  if (typeof navigator === "undefined") return 1;
  const conn = navigator.connection?.effectiveType;
  if (!conn) return 1;
  if (conn === "slow-2g") return 2.5;
  if (conn === "2g") return 1.8;
  if (conn === "3g") return 1.3;
  return 1;
};

// ---------------------------------------------------------------------------
// [フロー 1] onLoadingComplete 時のサンプル記録（emakiId 無し時は LazyImage 側で呼ばない）
// MIN_MEASURABLE_LOAD_MS 未満は計測ノイズとして捨てる
// ---------------------------------------------------------------------------
export const recordLoadTime = (ms) => {
  if (!Number.isFinite(ms) || ms < MIN_MEASURABLE_LOAD_MS) return;
  loadTimeSamples.push(ms);
  if (loadTimeSamples.length > MAX_SAMPLES) loadTimeSamples.shift();
  logDebug("Timeout:Sample", { ms, sampleCount: loadTimeSamples.length });
};

// ---------------------------------------------------------------------------
// [フロー 2] フォールバックタイマー閾値の算出（LazyImage の IO / slow 判定と共有）
// サンプル未蓄積時は bounds.fallback × 接続・巻別倍率
// ---------------------------------------------------------------------------
export const getAdaptiveTimeout = (type, emakiId) => {
  const bounds = TIMEOUT_BOUNDS[type];
  const connMultiplier = getConnectionMultiplier();
  const emakiMultiplier = PER_EMAKI_TIMEOUT[emakiId] || 1;
  const combinedMultiplier = Math.min(connMultiplier * emakiMultiplier, 3);
  let resolved;
  if (loadTimeSamples.length === 0) {
    resolved = Math.round(bounds.fallback * combinedMultiplier);
  } else {
    const avg =
      loadTimeSamples.reduce((a, b) => a + b, 0) / loadTimeSamples.length;
    const maxAdjusted = Math.round(bounds.max * combinedMultiplier);
    resolved = Math.min(
      maxAdjusted,
      Math.max(bounds.min, Math.round(avg * TIMEOUT_MULTIPLIER))
    );
  }
  logDebug("Timeout:Calc", {
    type,
    emakiId,
    resolvedMs: resolved,
    sampleCount: loadTimeSamples.length,
    combinedMultiplier,
  });
  return resolved;
};
