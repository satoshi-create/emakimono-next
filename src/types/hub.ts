/**
 * =============================================================================
 * 1. ハブページ設定型定義 (HubPageConfig)
 * -----------------------------------------------------------------------------
 * テーマ別ハブページ（鳥獣戯画・九相図・百鬼夜行など）のメタ情報および
 * ナビゲーション表示・絵巻フィルタリング条件を型安全に管理するための定義。
 * =============================================================================
 */
export interface HubPageConfig {
  /** URLスラッグ（例: "chouju-giga"） */
  slug: string;
  /** ルートパス（例: "/hub/chouju-giga"） */
  path: string;
  /** 組み込みハブフラグ */
  isBuiltin: boolean;
  /** 日本語タイトル */
  titleJa: string;
  /** 英語タイトル */
  titleEn: string;
  /** 日本語説明文 */
  descriptionJa: string;
  /** 英語説明文 */
  descriptionEn: string;
  /** 検索・マッチング用キーワード配列 */
  keywords: string[];
  /** 対象種別スラッグ配列 */
  typeen: string[];
  /** 明示的に紐づける絵巻ID配列 */
  scrollIds: string[];
  /** 連携ボードID */
  linkedBoardId: string;
  /** ナビゲーションメニュー表示可否 */
  showInNav: boolean;
  /** ナビゲーション表示順（昇順） */
  navOrder: number;
}