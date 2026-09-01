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
  handleToId: (id: number) => void;
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
 * 戻り値の sectionsCacheRef / scrollDimsRef は Conteiner 側の
 * 絵巻切替リセット effect から操作するために公開している。
 */
export type UseEmakiScrollResult = {
  /** シーン検出キャッシュ。絵巻切替時に Conteiner が null 化する */
  sectionsCacheRef: RefObject<{ baseScrollLeft: number; items: { id: number; offset: number }[] }>;
  /** scrollWidth/clientWidth キャッシュ。絵巻切替時に Conteiner がリセットする */
  scrollDimsRef: RefObject<{ w: number; c: number; ts: number }>;
};

/**
 * useEmakiAutoPlay — 初回ナッジ + 再生モードの rAF ループ（ネイティブ scrollLeft）。
 * useEmakiIdleUI を内部合成する（isUIVisible / showUI もここから提供）。
 * playModeAnimationRef は Conteiner 側（detectCurrentScene・ホイール停止・絵巻切替）が参照する。
 */
export type UseEmakiAutoPlayResult = {
  isAutoScrolling: boolean;
  isPlayMode: boolean;
  startPlayMode: () => void;
  stopPlayMode: () => void;
  playModeAnimationRef: RefObject<number | null>;
  isUIVisible: boolean;
  showUI: () => void;
};

/** useEmakiPalmDrag — 手のひらモード（pointer events） */
export type UseEmakiPalmDragResult = {
  isPalmMode: boolean;
  suppressClickUntilRef: RefObject<number>;
};

/** useEmakiIdleUI — 静止UI耐性（idle timer）。useEmakiAutoPlay が内部合成して利用 */
export type UseEmakiIdleUIResult = {
  isUIVisible: boolean;
  /** 再生モード停止・ホイール操作時の UI 復帰に使う（Conteiner 側の setIsUIVisible(true) 呼び出しを置換） */
  showUI: () => void;
};

/** useScrollPositionRestore — フルスクリーン切り替え時のスクロール位置復元（副作用のみ・戻り値なし） */
export type UseScrollPositionRestoreParams = {
  dataId: string;
  toggleFullscreen: boolean;
  orientation: string;
  scrollPositionStore: {
    scrollLeft: number;
    scrollRatio: number;
    restored: boolean;
    isTransitioning: boolean;
    emakiId: string | null;
  };
};
