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
// 1. 状態管理（State）— セッション内ハイドレーションキー集合
// 一度 onLoadingComplete した画像。描画窓 remount 時の blur/skeleton 再発を抑止。
// ---------------------------------------------------------------------------
export const hydratedImageKeys = new Set();

// ---------------------------------------------------------------------------
// [フロー 1] マウント・ハイドレーション済み判定
// emakiId 無し（詞書オーバーレイ）は src をキーにフォールバック
// ---------------------------------------------------------------------------
export const isHydratedImageKey = (hydrateKey) => {
  const hit = Boolean(hydrateKey && hydratedImageKeys.has(hydrateKey));
  logDebug("Hydration:Check", { hydrateKey, hit });
  return hit;
};

// ---------------------------------------------------------------------------
// [フロー 2] ロード完了時のキー登録
// ---------------------------------------------------------------------------
export const registerHydratedImageKey = (hydrateKey) => {
  if (hydrateKey) {
    hydratedImageKeys.add(hydrateKey);
    logDebug("Hydration:Register", { hydrateKey, size: hydratedImageKeys.size });
  }
};
