// ビューアUIの Props 型と Custom Hook 戻り値型（forward declaration）
// 目的: AI / LLM が実装を読まなくても型だけで対話できるようにする。
// 参照: src/components/emaki/layout/EmakiConteiner.js（Step 3 でフック抽出後は本ファイルが契約）
import type { RefObject } from "react";
import type { ScrollMetadata } from "./emaki";

/** EmakiConteiner.js の props。destructure をそのまま機械的に写したもの */
export type EmakiContainerProps = {
  data: ScrollMetadata;
  height?: string;
  width?: string;
  scroll?: boolean;
  overflowX?: string;
  boxshadow?: string;
  selectedRef: RefObject<HTMLElement>;
  navIndex: number;
  /** 巻末ナッジに表示する他巻カード。EmakiLandscapContent / EmakiPortraitContent から渡される */
  editionLinks?: ScrollMetadata[];
  showKusouzuHubLink?: boolean;
  showChojuGigaHubLink?: boolean;
};

/** EmakiNavigation.js の props */
export type EmakiNavigationProps = {
  handleToId: (
    id: number,
    opts?: {
      realign?: boolean;
      offsetPercent?: number;
      /** 絵引シート同時表示時は "auto"（smooth が mount でキャンセルされるため） */
      behavior?: ScrollBehavior;
    }
  ) => void;
  data: ScrollMetadata;
  isUIVisible?: boolean;
  isPlayMode?: boolean;
  isAutoScrolling?: boolean;
  onStartPlayMode?: () => void;
  onStopPlayMode?: () => void;
  onOpenScrollFeedback?: () => void;
  showScrollFeedbackButton?: boolean;
};

// =====================================================
// Step 3 で実装した Custom Hook の型定義
// 実装: src/hooks/emaki/*.js
// =====================================================

/**
 * useEmakiScroll — スクロール処理 + 現在シーン検出（統合版）。
 * useEmakiSceneDetection は共有 ref が多いため統合した。
 * 戻り値の scrollDimsRef は Conteiner 側の絵巻切替リセット effect から操作するために公開。
 * 現在地（navIndex / liveSceneIndex / hash）はビューポート中央の実測 DOM プローブ。
 * 手動スクロール時は連番拘束（±1）。handleToId は isProgrammaticScroll で拘束解除。
 */
export type UseEmakiScrollResult = {
  /** scrollWidth/clientWidth キャッシュ。絵巻切替時に Conteiner がリセットする */
  scrollDimsRef: RefObject<{ w: number; c: number; ts: number }>;
  /** 再生中の解説バー追従用・URL hash / 共有の正本（ビューポート中央コマ index。navIndex は画像ツリー再レンダー抑制のため固定） */
  liveSceneIndex: number;
  /** 描画窓の中心コマ（メタデータ幅推定。URL 正本とは独立） */
  contentWindowCenter: number;
  /** 同期値（idle 反映前の最新中心）。ズーム開始時のスライス確定など即時参照用 */
  contentWindowCenterRef: RefObject<number>;
};

/**
 * useEmakiAutoPlay — 初回ナッジ + 再生モードの rAF ループ。
 * useEmakiIdleUI を内部合成する（isUIVisible / showUI もここから提供）。
 * playModeAnimationRef は Conteiner 側（detectCurrentScene・ホイール停止・絵巻切替）が参照する。
 * scrollPositionStore は向き・フルスクリーン復元用（再生中も ratio を更新）。
 */
export type UseEmakiAutoPlayResult = {
  isAutoScrolling: boolean;
  isPlayMode: boolean;
  startPlayMode: () => void;
  stopPlayMode: () => void;
  playModeAnimationRef: RefObject<number | null>;
  isUIVisible: boolean;
  showUI: () => void;
  /** 絵引チップ操作などからのアイドルタイマー再スタート */
  resetIdleTimer: () => void;
};

/** useEmakiPalmDrag — 手のひらモード（pointer events） */
export type UseEmakiPalmDragResult = {
  isPalmMode: boolean;
  suppressClickUntilRef: RefObject<number>;
  /** ドラッグ実行中フラグ。useEmakiScroll がシーン確定を保留するために参照する */
  palmActiveRef: RefObject<boolean>;
};

/** useEmakiIdleUI — 静止UI耐性（idle timer）。useEmakiAutoPlay が内部合成して利用 */
export type UseEmakiIdleUIResult = {
  isUIVisible: boolean;
  /** 再生モード停止・ホイール操作時の UI 復帰に使う（Conteiner 側の setIsUIVisible(true) 呼び出しを置換） */
  showUI: () => void;
  /** 絵引チップ／シート操作時にタイマーをリセットして UI を維持する */
  resetIdleTimer: () => void;
};

/** useScrollPositionRestore — フルスクリーン / 向き切替時のスクロール位置復元（副作用のみ） */
export type UseScrollPositionRestoreParams = {
  dataId: string;
  toggleFullscreen: boolean;
  orientation: string;
  navIndex?: number;
  handleToId?: (
    id: number,
    opts?: {
      realign?: boolean;
      offsetPercent?: number;
      behavior?: ScrollBehavior;
    }
  ) => void;
  /**
   * 復元確定後の現在段再同期。キャッシュ再構築後に再判定が呼ばれず
   * コメンタリーバーが固まるのを防ぐ（未指定なら再同期しない）。
   */
  detectCurrentSceneRef?: RefObject<(() => void) | null>;
  scrollPositionStore: {
    scrollLeft: number;
    scrollRatio: number;
    restored: boolean;
    isTransitioning: boolean;
    emakiId: string | null;
  };
};

/**
 * useEmakiZoomPan — ズーム＆パン（兄弟オーバーレイ方式）。
 * ZoomLayer（src/components/emaki/viewer/ZoomLayer.jsx）が消費する。
 * scale は 1.0〜maxScale、初期値 2.0（等倍 1.0 まで縮小すると通常スクロールへ復帰）。
 * maxScale は既定 6.0（600%）。屏風（typeen === "byobu"）は狭幅スライス向けに 8.0（800%）。
 */
export type UseEmakiZoomPanParams = {
  onOpen?: () => void;
  onDoubleTap?: () => void;
  /** ジェスチャ（ピンチ / Ctrl+ホイール）を常時受ける entry-container */
  containerRef?: RefObject<HTMLElement>;
  /** 等倍からズーム状態へ同期進入するための進入関数 ref */
  requestZoomRef?: RefObject<
    (focusX?: number, focusY?: number, initialScale?: number) => void
  >;
  /** ズーム上限倍率（未指定 = 6.0）。1.0〜10.0 にクランプされる */
  maxScale?: number;
};

/** 絵引座標ピッカー（開発専用・?dev=ebiki）の 1 クリック結果 */
export type EbikiPickerPickResult = {
  linkId: number;
  offsetPercent: number;
  leftPct: number;
  csvLine?: string;
  labelLine?: string;
};

export type UseEbikiCoordinatePickerResult = {
  enabled: boolean;
  onPick: (result: EbikiPickerPickResult) => void;
  hudData: EbikiPickerPickResult | null;
  clearHud: () => void;
};

export type UseEmakiZoomPanResult = {
  isZoomed: boolean;
  scale: number;
  panX: number;
  panY: number;
  /** ルート要素（.layer）に付与する ref */
  zoomRef: RefObject<HTMLDivElement>;
  /** 可視ビューポート（.stage）の実測用 ref（可動域 clamp に使う） */
  stageRef: RefObject<HTMLDivElement>;
  /** 画像帯（.strip）の実測用 ref（可動域 clamp に使う） */
  stripRef: RefObject<HTMLDivElement>;
  /** 拡大開始。focusX / focusY（clientX / clientY）指定時はカーソル点を基準にズームする */
  openZoom: (
    focusX?: number,
    focusY?: number,
    initialPanX?: number,
    initialScale?: number
  ) => void;
  resetZoom: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  /** 右下ボタン: 等倍（1.0）⇔ 既定倍率のトグル */
  toggleZoom: (focusX?: number, focusY?: number) => void;
  /** ZoomLayer のルートに spread する pointer ハンドラ */
  handlers: {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
  };
};
