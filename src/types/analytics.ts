// GA4 計測イベントの引数型 — src/libs/api/measurementUtils.js の実装と突き合わせ
// 正本: measurementUtils.js（実装）/ analytics/dimensions.yaml（イベント定義）
// 目的: イベント追加・修正時に実装全体を読まなくて済むようにする

/** デバイスタイプ（getDeviceType の戻り値） */
export type DeviceType = "pc" | "tablet" | "mobile";

/** 手動スクロール操作種別（trackManualScroll） */
export type ScrollMethod = "wheel" | "touch" | "drag";

/** 自動スクロール中断トリガー（trackAutoScrollInterrupted） */
export type InterruptMethod = "mousedown" | "wheel" | "touch" | "click";

/** UI再表示トリガー種別（trackUIRevealed） */
export type UIRevealTrigger =
  | "mousemove"
  | "wheel"
  | "touch"
  | "click"
  | "keydown";

/** シーン遷移ソース（trackSceneTransition / handleSceneChange） */
export type SceneChangeSource =
  | "navigation"
  | "modal"
  | "scroll_detect"
  | "initial"
  | "quiz";

/** 画像ロード種別（trackImageLoaded） */
export type ImageLoadType = "normal" | "fallback_priority" | "fallback_fullscreen";

/** 画像ロードフォールバック理由（trackImageFallback） */
export type FallbackReason = "priority_timeout" | "fullscreen_timeout";

/** フルスクリーン終了方法（trackFullscreenExit） */
export type FullscreenExitMethod = "button" | "esc_or_browser";

/** 画像読み込みモード（trackImageLoadSlow） */
export type LoadingType = "eager" | "lazy";

/** GA4 イベント params 共通型。measurement_version は sendEvent が常に付与 */
export type EventParams = {
  measurement_version: string;
  [key: string]: string | number | boolean | undefined;
};

export type ImageLoadedEvent = EventParams & {
  emaki_id: string;
  image_index: number;
  load_time_ms: number;
  load_type: ImageLoadType;
};

export type ImageLoadFallbackEvent = EventParams & {
  emaki_id: string;
  image_index: number;
  fallback_reason: FallbackReason;
};

export type ImageLoadSlowEvent = EventParams & {
  emaki_id: string;
  image_index: number;
  load_time_ms: number;
  threshold_ms: number;
  is_fullscreen: boolean;
  loading_type: LoadingType;
};

export type AutoScrollStartedEvent = EventParams & {
  emaki_id: string;
  device_type: DeviceType;
};

export type AutoScrollInterruptedEvent = EventParams & {
  emaki_id: string;
  interrupt_method: InterruptMethod;
  scroll_ratio: number;
};

export type ManualScrollDetectedEvent = EventParams & {
  emaki_id: string;
  scroll_method: ScrollMethod;
};

export type UIHiddenEvent = EventParams & {
  emaki_id: string;
  idle_duration_ms: number;
};

export type UIRevealedEvent = EventParams & {
  emaki_id: string;
  trigger_type: UIRevealTrigger;
};

export type SceneTransitionEvent = EventParams & {
  emaki_id: string;
  from_scene: number;
  to_scene: number;
  source: SceneChangeSource;
};

export type SceneDwellEvent = EventParams & {
  emaki_id: string;
  scene_index: number;
  dwell_ms: number;
};

export type FullscreenEnterEvent = EventParams & {
  emaki_id: string;
  scene_index: number;
};

export type FullscreenExitEvent = EventParams & {
  emaki_id: string;
  exit_method: FullscreenExitMethod;
  dwell_ms: number;
};

export type InitialLoadWithHashEvent = EventParams & {
  emaki_id: string;
  scene_index: number;
};

export type SessionContextEvent = EventParams & {
  emaki_id: string;
  device_type: DeviceType;
  viewport_width: number;
  viewport_height: number;
  connection_type: string;
  downlink_mbps: number;
  arrival_time: string;
  total_images: number;
};

export type ViewerEngagementEvent = EventParams & {
  emaki_id: string;
  total_duration_ms: number;
  max_scroll_ratio: number;
  scenes_visited: number;
  fullscreen_used: boolean;
  fallback_count: number;
  slow_count: number;
};

/** 観察力クイズ開始 */
export type QuizStartEvent = EventParams & {
  emaki_id: string;
  quiz_id: string;
  quiz_version: number;
};

/** 観察力クイズ回答（is_correct は GA4 次元用に "true"|"false"） */
export type QuizAnswerEvent = EventParams & {
  emaki_id: string;
  quiz_id: string;
  question_id: string;
  question_order: number;
  choice_index: number;
  is_correct: "true" | "false";
};

/** クイズから該当場面へジャンプ */
export type QuizJumpToSceneEvent = EventParams & {
  emaki_id: string;
  quiz_id: string;
  question_id: string;
  to_scene: number;
  to_chapter?: string | number;
};

/** 観察力クイズ完了 */
export type QuizCompleteEvent = EventParams & {
  emaki_id: string;
  quiz_id: string;
  score: number;
  total: number;
  rank: string;
  jump_count: number;
};
