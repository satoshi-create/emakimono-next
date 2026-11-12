import { getDeviceType } from "@/libs/api/measurementUtils";
import {
  MANUAL_IMAGE_LOOKAHEAD,
  MANUAL_IMAGE_LOOKAHEAD_CONSTRAINED,
  PLAYBACK_IMAGE_LOOKAHEAD,
} from "@/libs/constants/viewerPlayback";

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
// [計算関数] 手動鑑賞時の先読み幅（回線・巻・端末特性）
// 3g 以下・鳥獣戯画第一巻・タブレット/モバイル・effectiveType 不明時は
// 先読みを 1 枚に絞り、教室 Wi-Fi や iOS Safari 等での同時接続飽和を防ぐ
// ---------------------------------------------------------------------------
export const getManualLookahead = (emakiId) => {
  if (emakiId === "Chōjū-jinbutsu-giga_first") {
    return MANUAL_IMAGE_LOOKAHEAD_CONSTRAINED;
  }
  if (typeof navigator === "undefined") return MANUAL_IMAGE_LOOKAHEAD;
  const conn = navigator.connection?.effectiveType;
  if (conn === "slow-2g" || conn === "2g" || conn === "3g") {
    return MANUAL_IMAGE_LOOKAHEAD_CONSTRAINED;
  }
  const deviceType = getDeviceType();
  if (deviceType === "tablet" || deviceType === "mobile") {
    return MANUAL_IMAGE_LOOKAHEAD_CONSTRAINED;
  }
  if (!conn || conn === "unknown") {
    return MANUAL_IMAGE_LOOKAHEAD_CONSTRAINED;
  }
  return MANUAL_IMAGE_LOOKAHEAD;
};

// ---------------------------------------------------------------------------
// [フロー 1] eager loading 判定（uniqueIndex と視線中心の delta）
// マウント済みシーンは視線より先にネット開始する。描画窓が枚数を制限するため
// 前方 eager を厚くして二重 lazy ゲートを避ける。
// ---------------------------------------------------------------------------
export const isEagerLoad = (
  uniqueIndex,
  prefetchIndex,
  isPlayMode,
  toggleFullscreen,
  manualLookahead = MANUAL_IMAGE_LOOKAHEAD
) => {
  if (uniqueIndex === 0) {
    logDebug("Eager:Check", { uniqueIndex, result: true, reason: "priority_index_0" });
    return true;
  }
  const center = Number.isFinite(prefetchIndex) ? prefetchIndex : 0;
  const delta = uniqueIndex - center;
  let result;
  if (toggleFullscreen) {
    result = delta >= -1 && delta <= Math.max(manualLookahead, 1);
  } else if (isPlayMode) {
    result = delta >= -2 && delta <= PLAYBACK_IMAGE_LOOKAHEAD;
  } else {
    result = delta >= -1 && delta <= manualLookahead;
  }
  logDebug("Eager:Check", {
    uniqueIndex,
    prefetchIndex: center,
    delta,
    isPlayMode,
    toggleFullscreen,
    manualLookahead,
    result,
  });
  return result;
};
