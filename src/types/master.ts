/**
 * =============================================================================
 * 1. モチーフ関連書籍検索リンク型定義 (MotifAmazonSearch)
 * =============================================================================
 */
export interface MotifAmazonSearch {
  type: "amazon";
  query: string;
  title: string;
  titleEn: string;
}

/**
 * =============================================================================
 * 2. モチーフ定義アイテム型定義 (MotifMasterItem)
 * -----------------------------------------------------------------------------
 * 解説探索ビュー・モチーフネットワークで使用する共通モチーフ属性。
 * =============================================================================
 */
export interface MotifMasterItem {
  id: string;
  label: string;
  labelEn: string;
  prompt: string;
  promptEn: string;
  description: string;
  amazonSearch: MotifAmazonSearch;
}

/**
 * =============================================================================
 * 3. モチーフマスター辞書型定義 (MotifMasterMap)
 * =============================================================================
 */
export type MotifMasterMap = Record<string, MotifMasterItem>;

/**
 * =============================================================================
 * 4. 参考文献・外部リンクアイテム型定義 (ReferenceItem)
 * -----------------------------------------------------------------------------
 * 絵巻詳細ページ（[slug].js）で表示する書籍・所蔵機関・論文リンクの型。
 * =============================================================================
 */
export interface ReferenceItem {
  type: string;
  title: string;
  url?: string;
  query?: string;
  publisher?: string;
  asin?: string;
  isbn13?: string;
  author?: string;
}

/**
 * =============================================================================
 * 5. 絵巻別参考文献マスター辞書型定義 (ReferencesMasterMap)
 * =============================================================================
 */
export type ReferencesMasterMap = Record<string, ReferenceItem[]>;