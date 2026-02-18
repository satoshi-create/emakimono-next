/**
 * 計測期間限定ユーティリティ (2025/2/3〜2/8)
 * 教育現場向けUI改善のための行動計測
 *
 * 実装方針:
 * - GA4 event + console.log（開発時確認用）
 * - 高頻度イベントはデバウンス済み
 * - 計測期間終了後は本ファイルを削除可能
 */

import * as gtag from "./gtag";

// 計測期間フラグ（本番では環境変数で制御推奨）
const MEASUREMENT_ENABLED = true;
const DEBUG_LOG = process.env.NODE_ENV === "development";

/**
 * 計測イベント送信（GA4 + console.log）
 */
const sendEvent = (eventName, params = {}) => {
  if (!MEASUREMENT_ENABLED) return;

  const eventData = {
    ...params,
    measurement_version: "2025-02-03",
  };

  // GA4送信
  gtag.event(eventName, eventData);

  // 開発時はconsole.logで確認
  if (DEBUG_LOG) {
    console.log(`[計測] ${eventName}`, eventData);
  }
};

// セッションサマリー用カウンタ（⑨で使用、①②からもインクリメント）
let sessionFallbackCount = 0;
let sessionSlowCount = 0;

// =====================================================
// ① 画像読み込み計測
// =====================================================

/**
 * 画像読み込み完了
 * @param {string} emakiId - 絵巻ID
 * @param {number} imageIndex - 画像インデックス
 * @param {number} loadTimeMs - 読み込み時間（ms）
 * @param {string} loadType - "normal" | "fallback_priority" | "fallback_fullscreen"
 */
export const trackImageLoaded = (emakiId, imageIndex, loadTimeMs, loadType = "normal") => {
  // 最初の5枚のみ詳細計測（高頻度イベント抑制）
  if (imageIndex > 4) return;

  sendEvent("image_loaded", {
    emaki_id: emakiId,
    image_index: imageIndex,
    load_time_ms: loadTimeMs,
    load_type: loadType,
  });
};

/**
 * 画像読み込み遅延（フォールバック発火）
 * @param {string} emakiId - 絵巻ID
 * @param {number} imageIndex - 画像インデックス
 * @param {string} fallbackReason - "priority_timeout" | "fullscreen_timeout"
 */
export const trackImageFallback = (emakiId, imageIndex, fallbackReason) => {
  sessionFallbackCount++;
  sendEvent("image_load_fallback", {
    emaki_id: emakiId,
    image_index: imageIndex,
    fallback_reason: fallbackReason,
  });
};

// =====================================================
// ② 横スクロール操作計測
// =====================================================

/**
 * 初回自動スクロール開始
 * @param {string} emakiId - 絵巻ID
 * @param {string} deviceType - "pc" | "tablet" | "mobile"
 */
export const trackAutoScrollStarted = (emakiId, deviceType) => {
  sendEvent("auto_scroll_started", {
    emaki_id: emakiId,
    device_type: deviceType,
  });
};

/**
 * 自動スクロール中断（ユーザー操作による）
 * @param {string} emakiId - 絵巻ID
 * @param {string} interruptMethod - "mousedown" | "wheel" | "touch" | "click"
 * @param {number} scrollRatio - 中断時のスクロール進捗（0〜1）
 */
export const trackAutoScrollInterrupted = (emakiId, interruptMethod, scrollRatio) => {
  sendEvent("auto_scroll_interrupted", {
    emaki_id: emakiId,
    interrupt_method: interruptMethod,
    scroll_ratio: Math.round(scrollRatio * 100) / 100,
  });
};

/**
 * 手動スクロール操作検知
 * デバウンス: セッション内で各操作タイプ1回のみ送信
 */
const manualScrollTracked = {
  wheel: false,
  touch: false,
  drag: false,
};

/**
 * 手動スクロール操作（初回のみ計測）
 * @param {string} emakiId - 絵巻ID
 * @param {string} scrollMethod - "wheel" | "touch" | "drag"
 */
export const trackManualScroll = (emakiId, scrollMethod) => {
  // セッション内で各操作タイプ1回のみ
  if (manualScrollTracked[scrollMethod]) return;
  manualScrollTracked[scrollMethod] = true;

  sendEvent("manual_scroll_detected", {
    emaki_id: emakiId,
    scroll_method: scrollMethod,
  });
};

/**
 * 手動スクロール計測状態をリセット（絵巻切り替え時に呼び出し）
 */
export const resetManualScrollTracking = () => {
  manualScrollTracked.wheel = false;
  manualScrollTracked.touch = false;
  manualScrollTracked.drag = false;
};

// =====================================================
// ③ UI静止耐性計測
// =====================================================

/**
 * UI非表示状態に入った
 * @param {string} emakiId - 絵巻ID
 * @param {number} idleDurationMs - 無操作時間（ms）
 */
export const trackUIHidden = (emakiId, idleDurationMs) => {
  sendEvent("ui_hidden", {
    emaki_id: emakiId,
    idle_duration_ms: idleDurationMs,
  });
};

/**
 * UI再表示トリガー種別の追跡状態
 * セッション内で各トリガー種別1回のみ送信
 */
const uiRevealedTracked = {
  mousemove: false,
  wheel: false,
  touch: false,
  click: false,
  keydown: false,
};

/**
 * UI再表示された（各トリガー種別1回のみ）
 * @param {string} emakiId - 絵巻ID
 * @param {string} triggerType - "mousemove" | "wheel" | "touch" | "click" | "keydown"
 */
export const trackUIRevealed = (emakiId, triggerType) => {
  // 各トリガー種別1回のみ（高頻度イベント抑制）
  if (uiRevealedTracked[triggerType]) return;
  uiRevealedTracked[triggerType] = true;

  sendEvent("ui_revealed", {
    emaki_id: emakiId,
    trigger_type: triggerType,
  });
};

/**
 * UI再表示計測状態をリセット（絵巻切り替え時に呼び出し）
 */
export const resetUIRevealedTracking = () => {
  uiRevealedTracked.mousemove = false;
  uiRevealedTracked.wheel = false;
  uiRevealedTracked.touch = false;
  uiRevealedTracked.click = false;
  uiRevealedTracked.keydown = false;
};

// =====================================================
// ④ シーン遷移・滞在計測
// =====================================================

/**
 * シーン滞在時間計測用の状態
 */
let currentSceneStartTime = Date.now();
let currentSceneIndex = 0;

/**
 * シーン遷移発生
 * @param {string} emakiId - 絵巻ID
 * @param {number} fromScene - 遷移元シーン
 * @param {number} toScene - 遷移先シーン
 * @param {string} source - "navigation" | "modal" | "scroll_detect" | "initial"
 */
export const trackSceneTransition = (emakiId, fromScene, toScene, source) => {
  // 同じシーンへの遷移は無視
  if (fromScene === toScene) return;

  sendEvent("scene_transition", {
    emaki_id: emakiId,
    from_scene: fromScene,
    to_scene: toScene,
    source: source,
  });
};

/**
 * シーン滞在時間を計測・送信
 * @param {string} emakiId - 絵巻ID
 * @param {number} sceneIndex - 離脱したシーン
 * @param {number} dwellMs - 滞在時間（ms）
 */
export const trackSceneDwell = (emakiId, sceneIndex, dwellMs) => {
  // 1秒未満の滞在は無視（ノイズ除去）
  if (dwellMs < 1000) return;

  sendEvent("scene_dwell", {
    emaki_id: emakiId,
    scene_index: sceneIndex,
    dwell_ms: dwellMs,
  });
};

/**
 * シーン変更時の滞在計測ヘルパー
 * @param {string} emakiId - 絵巻ID
 * @param {number} newSceneIndex - 新しいシーンインデックス
 * @param {string} source - 遷移ソース
 */
export const handleSceneChange = (emakiId, newSceneIndex, source) => {
  const now = Date.now();
  const dwellMs = now - currentSceneStartTime;

  // 前のシーンの滞在時間を送信
  if (currentSceneIndex !== newSceneIndex) {
    trackSceneDwell(emakiId, currentSceneIndex, dwellMs);
    trackSceneTransition(emakiId, currentSceneIndex, newSceneIndex, source);
  }

  // 新しいシーンの計測開始
  currentSceneStartTime = now;
  currentSceneIndex = newSceneIndex;
};

/**
 * シーン計測状態をリセット（絵巻切り替え時に呼び出し）
 */
export const resetSceneTracking = () => {
  currentSceneStartTime = Date.now();
  currentSceneIndex = 0;
};

// =====================================================
// ⑤ フルスクリーン挙動計測
// =====================================================

/**
 * フルスクリーン開始時刻
 */
let fullscreenStartTime = 0;

/**
 * フルスクリーンON
 * @param {string} emakiId - 絵巻ID
 * @param {number} sceneIndex - 開始時のシーン
 */
export const trackFullscreenEnter = (emakiId, sceneIndex) => {
  fullscreenStartTime = Date.now();

  sendEvent("fullscreen_enter", {
    emaki_id: emakiId,
    scene_index: sceneIndex,
  });
};

/**
 * フルスクリーンOFF
 * @param {string} emakiId - 絵巻ID
 * @param {string} exitMethod - "button" | "esc_or_browser"
 */
export const trackFullscreenExit = (emakiId, exitMethod) => {
  const dwellMs = fullscreenStartTime > 0 ? Date.now() - fullscreenStartTime : 0;

  sendEvent("fullscreen_exit", {
    emaki_id: emakiId,
    exit_method: exitMethod,
    dwell_ms: dwellMs,
  });

  fullscreenStartTime = 0;
};

// =====================================================
// ⑥ hash付きURL初期表示計測
// =====================================================

/**
 * hash付きURLでの初期表示
 * @param {string} emakiId - 絵巻ID
 * @param {number} sceneIndex - hash指定されたシーン
 */
export const trackInitialLoadWithHash = (emakiId, sceneIndex) => {
  sendEvent("initial_load_with_hash", {
    emaki_id: emakiId,
    scene_index: sceneIndex,
  });
};

// =====================================================
// ⑦ セッション環境コンテキスト (TIER 1)
// =====================================================

let sessionContextSent = false;

/**
 * セッション環境情報を送信（1セッション1回）
 * @param {string} emakiId
 * @param {number} totalImages - 絵巻の総画像数
 */
export const trackSessionContext = (emakiId, totalImages) => {
  if (typeof window === "undefined") return;
  if (sessionContextSent) return;
  sessionContextSent = true;

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const now = new Date();

  sendEvent("session_context", {
    emaki_id: emakiId,
    device_type: getDeviceType(),
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    connection_type: conn?.effectiveType || "unknown",
    downlink_mbps: conn?.downlink ?? -1,
    arrival_time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    total_images: totalImages,
  });
};

// =====================================================
// ⑧ 画像ロード遅延検出 (TIER 1)
// =====================================================

/**
 * 画像ロードがアダプティブ閾値の70%を超えた場合に送信
 * fallbackには至らなかったが「遅かった」画像を検出
 * @param {string} emakiId
 * @param {number} imageIndex
 * @param {number} loadTimeMs - 実測ロード時間
 * @param {number} thresholdMs - その時点のアダプティブ閾値
 * @param {boolean} isFullscreen
 * @param {string} loadingType - "eager" | "lazy"
 */
export const trackImageLoadSlow = (emakiId, imageIndex, loadTimeMs, thresholdMs, isFullscreen, loadingType) => {
  if (loadTimeMs < thresholdMs * 0.7) return;

  sessionSlowCount++;
  sendEvent("image_load_slow", {
    emaki_id: emakiId,
    image_index: imageIndex,
    load_time_ms: loadTimeMs,
    threshold_ms: thresholdMs,
    is_fullscreen: isFullscreen,
    loading_type: loadingType,
  });
};

// =====================================================
// ⑨ セッション鑑賞サマリー (TIER 1)
// =====================================================

let sessionMaxScrollRatio = 0;
let sessionScenesVisited = new Set();
let sessionFullscreenUsed = false;
let sessionStartTime = Date.now();
let sessionEmakiId = "";
let engagementSent = false;
let engagementListenerAdded = false;


/**
 * スクロール進捗を更新
 * @param {number} ratio - 現在のスクロール比率 (0-1)
 */
export const updateScrollProgress = (ratio) => {
  if (ratio > sessionMaxScrollRatio) {
    sessionMaxScrollRatio = Math.round(ratio * 100) / 100;
  }
};

/**
 * セッション鑑賞状態を更新
 * @param {string} emakiId
 * @param {number} sceneIndex
 * @param {boolean} fullscreenUsed
 */
export const updateEngagementState = (emakiId, sceneIndex, fullscreenUsed) => {
  sessionEmakiId = emakiId;
  if (sceneIndex != null) sessionScenesVisited.add(sceneIndex);
  if (fullscreenUsed) sessionFullscreenUsed = true;
};

/**
 * セッション鑑賞サマリーを送信
 */
const sendEngagement = () => {
  if (!sessionEmakiId || engagementSent) return;
  engagementSent = true;

  sendEvent("viewer_engagement", {
    emaki_id: sessionEmakiId,
    total_duration_ms: Date.now() - sessionStartTime,
    max_scroll_ratio: sessionMaxScrollRatio,
    scenes_visited: sessionScenesVisited.size,
    fullscreen_used: sessionFullscreenUsed,
    fallback_count: sessionFallbackCount,
    slow_count: sessionSlowCount,
  });
};

/**
 * engagementリスナーを登録（1回だけ呼ぶ）
 */
export const initEngagementTracking = () => {
  if (engagementListenerAdded || typeof window === "undefined") return;
  engagementListenerAdded = true;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendEngagement();
  });
  window.addEventListener("beforeunload", sendEngagement);
};

// =====================================================
// デバイスタイプ判定ヘルパー
// =====================================================

/**
 * 画面幅からデバイスタイプを判定
 * @returns {"pc" | "tablet" | "mobile"}
 */
export const getDeviceType = () => {
  if (typeof window === "undefined") return "pc";
  const width = window.innerWidth;
  if (width >= 1024) return "pc";
  if (width >= 768) return "tablet";
  return "mobile";
};

/**
 * 全計測状態をリセット（絵巻切り替え時に呼び出し）
 */
export const resetAllTracking = () => {
  resetManualScrollTracking();
  resetUIRevealedTracking();
  resetSceneTracking();
};
