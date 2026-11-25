/**
 * =============================================================================
 * 1. 絵巻キーワード・登場人物タグ型定義 (EmakiTagItem)
 * =============================================================================
 */
export interface EmakiTagItem {
  name: string;
  id: string;
  slug: string;
}

/**
 * =============================================================================
 * 2. 絵巻シーン（場面・詞書）要素型定義 (EmakiSceneItem)
 * -----------------------------------------------------------------------------
 * SPEC.md 4.3 スキーマ不変契約に基づき、sync_all.py が出力する全フィールドを保持。
 * =============================================================================
 */
export interface EmakiSceneItem {
  /** 種別（"ekotoba" | "image" など） */
  cat: string;
  /** シーンID（章番号文字列） */
  chapter: string;
  /** 画像配信元設定（"cloudinary" | "r2" など） */
  config: string;
  /** 画像パスまたはURL */
  src: string;
  /** 画像識別名 */
  name?: string;
  /** 元画像高さ（文字列または数値） */
  srcHeight: string | number;
  /** 元画像幅（文字列または数値） */
  srcWidth: string | number;
  /** 現代語訳・解説テキスト */
  gendaibun?: string;
  /** 詞書原文テキスト */
  kotobagaki?: string;
  /** 英語解説テキスト */
  descEn?: string;
  /** 関連モチーフID配列 */
  motifs?: string[];
  /** 拡張フィールド許容 */
  [key: string]: unknown;
}

/**
 * =============================================================================
 * 3. 絵巻メタデータ1巻分型定義 (EmakiMetadata)
 * -----------------------------------------------------------------------------
 * scroll-metadata/scrolls/{titleen}.json のスキーマ契約。
 * =============================================================================
 */
export interface EmakiMetadata {
  id: number;
  title: string;
  titleen: string;
  author: string;
  authoren: string;
  edition?: string;
  encodeUrl?: string;
  backgroundImage?: string;
  thumb: string;
  thumb2?: string;
  video?: string;
  era: string;
  eraen: string;
  desc: string;
  descen: string;
  readMore?: boolean;
  type: string;
  typeen: string;
  keyword?: EmakiTagItem[];
  personname?: EmakiTagItem[];
  kotobagaki?: boolean;
  favorite?: boolean;
  sourceImageUrl?: string;
  sourceImage?: string;
  metadesc?: string;
  gif?: string;
  sourceEkotoba?: string;
  emakis: EmakiSceneItem[];
  /** 拡張フィールド許容 */
  [key: string]: unknown;
}

/**
 * =============================================================================
 * 4. 詞書・章テキスト1要素型定義 (EmakiChapterTextItem)
 * -----------------------------------------------------------------------------
 * scroll-texts/{titleen}.json の各要素スキーマ。
 * =============================================================================
 */
export interface EmakiChapterTextItem {
  chapter: string;
  genji_chapter?: string;
  title?: string;
  titleEn?: string;
  kotobagaki?: string;
  gendaibun?: string;
  descEn?: string;
  motifs?: string[];
  promptsEn?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * =============================================================================
 * 5. 既存モジュール互換エイリアス (ScrollMetadata / EmakiTextData)
 * =============================================================================
 */
export type ScrollMetadata = EmakiMetadata;
export type EmakiTextData = EmakiChapterTextItem[];