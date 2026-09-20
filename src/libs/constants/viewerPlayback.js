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

/**
 * シーン切替ヒステリシス（ビューポート占有率の相対優位）。
 * 挑戦者の占有率が現シーンの占有率をこの割合だけ上回るまで現シーンを維持し、
 * 境界でのチャタリングを防ぐ。
 * 絶対差にすると、狭幅スライス（舟木本 等）で最大占有率自体が小さくしきい値に
 * 到達できないため、巻頭へ戻っても切替不能になる点に注意。
 */
export const SCENE_DETECTION_HYSTERESIS_SHARE = 0.12;

/**
 * 占有率の同率許容幅（ビューポート占有率の差）。
 * この範囲内は「同率」とみなし、右端（RTL 起点＝start が小さい方）を優先する。
 * 幅がほぼ等しいスライスが複数同時に見えている初期表示で、選択が定まらないのを防ぐ。
 */
export const SCENE_DETECTION_TIE_TOLERANCE = 0.005;

/** ズームストリップの最小スライス枚数（前後1枚＝計3枚。端では反対側へ枠を伸ばして確保） */
export const ZOOM_STRIP_MIN_SLICES = 3;

/**
 * 屏風（typeen === "byobu"）のズームストリップ最小スライス枚数。
 * 高解像度スライスはデコード後 約19MB/枚。5枚同時常駐は iOS のメモリガード
 * （256MB 制限）に触れ、低解像度プレビューモードへ落ちてぼやける原因になる。
 * 650〜800% 拡大時に画面内へ見えるのは1スライスのごく一部（約60px 幅）のため、
 * 中心＋前後1枚の3枚でもパン領域は確保でき、GPU 常駐を 97MB → 58MB へ削減できる。
 */
export const ZOOM_STRIP_MIN_SLICES_BYOBU = 3;

/** 再生中の画像先読み（uniqueIndex ベース）— eager 同時発火を抑え、帯域を可視近傍へ集中 */
export const PLAYBACK_IMAGE_LOOKAHEAD = 3;

/**
 * 手動スクロール時の画像 eager 先読み（uniqueIndex 差分・前方寄り）。
 * 描画窓に載っただけでは lazy のままなので、マウント＝ロード開始に近づける。
 */
export const MANUAL_IMAGE_LOOKAHEAD = 2;

/**
 * 描画窓（Phase 1）: section 殻は常置し、中身（LazyImage 等）だけ配列 index 付近に限定。
 * uniqueIndex では ekotoba 混在で壊れるため、窓は配列 index 基準。
 * 一度マウントした中身は sticky（unmount しない）。前方を厚く・後方は薄く（繰り広げ UX）。
 */
export const CONTENT_WINDOW_BEHIND = 2;
export const CONTENT_WINDOW_AHEAD = 6;
/** @deprecated 対称半径互換。新規は BEHIND/AHEAD を使う */
export const CONTENT_WINDOW_ENTER_RADIUS = 5;
/** @deprecated sticky mount 後は未使用（互換のため残置） */
export const CONTENT_WINDOW_EXIT_RADIUS = 5;
/** 再生・自動スクロール中 */
export const CONTENT_WINDOW_PLAY_BEHIND = 3;
export const CONTENT_WINDOW_PLAY_AHEAD = 12;
/**
 * 屏風（typeen === "byobu"）専用の描画窓。
 * スライスのアスペクト比が約 0.365 と極端に細く、通常の前後数枚では横長ビューポートを
 * 埋めきれず左側が空白になる。舟木本は全 12 スライスと少ないため、中身を常時全枚マウント
 * しても問題ない（通常絵巻の描画窓には影響させない）。
 */
export const CONTENT_WINDOW_BYOBU_BEHIND = 64;
export const CONTENT_WINDOW_BYOBU_AHEAD = 64;
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
