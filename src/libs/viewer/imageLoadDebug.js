import { getDeviceType } from "@/libs/api/measurementUtils";

// =============================================================================
// デバッグスイッチ
// 検証完了後は false にすることで、すべてのコンソール出力を一括で停止できます。
// =============================================================================
const DEBUG_IMAGE_LOAD = false;

/** LazyImage 等から参照する公開スイッチ（DEBUG_IMAGE_LOAD と同期） */
export const IMAGE_LOAD_DEBUG = DEBUG_IMAGE_LOAD;

function logDebug(tag, ...args) {
  if (!DEBUG_IMAGE_LOAD) return;
  const time = performance.now().toFixed(1);
  console.log(`%c[${time}ms][${tag}]`, "color: #3b82f6; font-weight: bold;", ...args);
}

// ---------------------------------------------------------------------------
// 1. 状態管理（in-flight / preload キュー）
// ---------------------------------------------------------------------------
let imageLoadInFlightCount = 0;
const imagePreloadQueue = new Set();

// ---------------------------------------------------------------------------
// [計算関数] キュー状況のスナップショット出力
// ---------------------------------------------------------------------------
export const logImageLoadQueue = () => {
  if (!DEBUG_IMAGE_LOAD) return;
  logDebug("ImageLoad:Queue", {
    queueBacklog: imagePreloadQueue.size,
    deviceCategory: getDeviceType(),
    viewportWidth: typeof window !== "undefined" ? window.innerWidth : null,
  });
};

// ---------------------------------------------------------------------------
// [フロー 1] ネットワーク計測開始（markLoadStart 連動）
// ---------------------------------------------------------------------------
export const logImageLoadStart = (emakiId, imageIndex, url, queueKey) => {
  if (!DEBUG_IMAGE_LOAD) return;
  imageLoadInFlightCount += 1;
  if (queueKey) imagePreloadQueue.add(queueKey);
  logDebug("ImageLoad:Start", {
    emakiId,
    imageIndex,
    url,
    inFlightCount: imageLoadInFlightCount,
  });
  logImageLoadQueue();
};

// ---------------------------------------------------------------------------
// [フロー 2] ロード完了・フォールバック・エラー（in-flight 解放とキュー除去）
// ---------------------------------------------------------------------------
export const logImageLoadEnd = ({
  emakiId,
  imageIndex,
  url,
  loadTimeMs,
  status,
  fallbackReason = null,
  queueKey,
  releaseInFlight = true,
}) => {
  if (!DEBUG_IMAGE_LOAD) return;
  if (releaseInFlight && imageLoadInFlightCount > 0) {
    imageLoadInFlightCount -= 1;
  }
  if (
    queueKey &&
    (status === "success" ||
      status === "slow" ||
      fallbackReason === "load_error")
  ) {
    imagePreloadQueue.delete(queueKey);
  }
  logDebug("ImageLoad:End", {
    emakiId,
    imageIndex,
    url,
    loadTimeMs,
    status,
    ...(fallbackReason ? { fallbackReason } : {}),
    inFlightCount: imageLoadInFlightCount,
  });
  logImageLoadQueue();
};
