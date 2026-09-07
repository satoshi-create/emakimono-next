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

/** 再生中の画像先読み（uniqueIndex ベース）— 帯域逼迫抑制のため控えめに */
export const PLAYBACK_IMAGE_LOOKAHEAD = 8;

/**
 * 手動スクロール時の画像 eager 先読み（uniqueIndex 差分・前方寄り）。
 * 描画窓に載っただけでは lazy のままなので、マウント＝ロード開始に近づける。
 */
export const MANUAL_IMAGE_LOOKAHEAD = 6;

/**
 * 描画窓（Phase 1）: section 殻は常置し、中身（LazyImage 等）だけ配列 index 付近に限定。
 * uniqueIndex では ekotoba 混在で壊れるため、窓は配列 index 基準。
 * 一度マウントした中身は sticky（unmount しない）。前方を厚く・後方は薄く（繰り広げ UX）。
 */
export const CONTENT_WINDOW_BEHIND = 2;
export const CONTENT_WINDOW_AHEAD = 10;
/** @deprecated 対称半径互換。新規は BEHIND/AHEAD を使う */
export const CONTENT_WINDOW_ENTER_RADIUS = 5;
/** @deprecated sticky mount 後は未使用（互換のため残置） */
export const CONTENT_WINDOW_EXIT_RADIUS = 5;
/** 再生・自動スクロール中 */
export const CONTENT_WINDOW_PLAY_BEHIND = 3;
export const CONTENT_WINDOW_PLAY_AHEAD = 12;
/** @deprecated */
export const CONTENT_WINDOW_PLAY_ENTER_RADIUS = 8;

/** 初回ナッジ開始までの待ち（ms）。入場レイアウト確定後に動かし、初回パン衝突を減らす */
export const INITIAL_NUDGE_DELAY_MS = 1200;
/** 初回ナッジ速度倍率（本再生より遅くし、手動介入時の飛びを抑える） */
export const INITIAL_NUDGE_SPEED_FACTOR = 0.55;

/** 再生中: シーン検出間隔（ms）— rAF ループ側で実行 */
export const PLAYBACK_SCENE_DETECT_MS = 1500;

/** 末尾付近で scrollWidth を再計測する余白（px） */
export const PLAYBACK_SCROLL_LIMIT_NEAR_END_PX = 80;

/** @returns {number} px/秒 */
export const getPlaybackSpeedPxPerSec = () => {
  if (typeof window === "undefined") return PLAYBACK_SPEED_PX_PER_SEC.pc;
  const width = window.innerWidth;
  if (width >= DEVICE_BREAKPOINT_PC) return PLAYBACK_SPEED_PX_PER_SEC.pc;
  if (width >= DEVICE_BREAKPOINT_TABLET) return PLAYBACK_SPEED_PX_PER_SEC.tablet;
  return PLAYBACK_SPEED_PX_PER_SEC.mobile;
};
