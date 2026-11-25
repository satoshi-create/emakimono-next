/**
 * =============================================================================
 * 1. 九相図10段階チャプター型定義 (KusouzuChapterItem)
 * -----------------------------------------------------------------------------
 * scroll-texts/kusouzu-chapters.json のスキーマ定義。
 * =============================================================================
 */
export interface KusouzuChapterItem {
  slug: string;
  stage_en: string;
  stage_ch: string;
  title: string;
  titleen: string;
  ruby: string;
  gendaibun: string;
  desc: string;
  descen: string;
  thumbCloudinary: string;
  [key: string]: unknown;
}

/**
 * =============================================================================
 * 2. 源氏物語54帖チャプター型定義 (GenjiChapterItem)
 * -----------------------------------------------------------------------------
 * scroll-texts/genji-chapters.json のスキーマ定義。
 * =============================================================================
 */
export interface GenjiChapterItem {
  slug?: string;
  chapter?: string | number;
  genji_chapter?: string | number;
  title: string;
  titleen?: string;
  ruby?: string;
  gendaibun?: string;
  desc?: string;
  descen?: string;
  [key: string]: unknown;
}