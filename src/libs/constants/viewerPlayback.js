/**
 * ビューア自動再生・シーン検出の定数。
 * getDeviceType()（measurementUtils）と同じ 768 / 1024 ブレークポイント。
 */

/** 60fps 換算: PC 2.4px/f, Tablet 1.6px/f, Mobile 1.2px/f */
export const PLAYBACK_SPEED_PX_PER_SEC = {
  pc: 144,
  tablet: 96,
  mobile: 72,
};

export const DEVICE_BREAKPOINT_TABLET = 768;
export const DEVICE_BREAKPOINT_PC = 1024;

/** コンテナ幅に対する読取位置（右端からの割合。0.38 ≒ 画面中央寄り） */
export const SCENE_READING_POSITION_RATIO = 0.38;

/** シーン切替ヒステリシス（px）— 現シーンからの優位がこれ未満なら維持 */
export const SCENE_DETECTION_HYSTERESIS_PX = 80;

/** 再生中の画像先読み（scene index ベース） */
export const PLAYBACK_IMAGE_LOOKAHEAD = 6;

/** 再生中: シーン検出間隔（ms）— rAF ループ側で実行 */
export const PLAYBACK_SCENE_DETECT_MS = 1500;

/** 末尾付近で scrollWidth を再計測する余白（px） */
export const PLAYBACK_SCROLL_LIMIT_NEAR_END_PX = 80;

/** ▶ 再生中は LazyImage のフェード / setImageLoaded を抑止（スケルトン即非表示のみ） */
export const PLAYBACK_SUPPRESS_IMAGE_VISUAL_UPDATE = true;

/** next/image lazyBoundary（通常 / 再生中） */
export const PLAYBACK_LAZY_BOUNDARY_NORMAL = "800px";
export const PLAYBACK_LAZY_BOUNDARY_PLAY = "1400px";

/** 再生先読み decode を requestIdleCallback で分散する枚数/回 */
export const PLAYBACK_DECODE_BATCH_PER_IDLE = 2;

/** 再生先読み時の Cloudinary 配信幅上限（decode/paint 軽量化） */
export const PLAYBACK_MAX_DELIVERY_WIDTH = 1080;

/** @returns {number} px/秒 */
export const getPlaybackSpeedPxPerSec = () => {
  if (typeof window === "undefined") return PLAYBACK_SPEED_PX_PER_SEC.pc;
  const width = window.innerWidth;
  if (width >= DEVICE_BREAKPOINT_PC) return PLAYBACK_SPEED_PX_PER_SEC.pc;
  if (width >= DEVICE_BREAKPOINT_TABLET) return PLAYBACK_SPEED_PX_PER_SEC.tablet;
  return PLAYBACK_SPEED_PX_PER_SEC.mobile;
};
