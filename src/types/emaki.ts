// TypeScript type definitions for Emaki scroll viewer JSON data

/**
 * Represents the metadata for an image in the Emaki scroll viewer.
 */
export type ImageMetadata = {
  /** Unique identifier for the image */
  id: string;
  /** Width of the image in pixels */
  width: number;
  /** Height of the image in pixels */
  height: number;
  /** URL of the image */
  url: string;
  /** Chapter number associated with the image */
  chapter: number;
};

/**
 * Represents the text data for a specific Emaki scroll.
 * 参照: src/utils/connectEmakiText.tsx
 */
export type EmakiTextData = {
  /** Title of the scroll */
  title: string;
  /** English title of the scroll (optional) */
  title_en?: string;
  /** Main text content of the scroll */
  text: string;
  /** Chapter number of the scroll */
  chapter: number;
};

// =====================================================
// データ正本の型 — image-metadata-cache.json の実キーを機械的に写したもの
// 正本: src/data/image-metadata-cache/image-metadata-cache.json
// 参照: src/pages/[slug].js / src/utils/func.js / src/components/emaki/layout/*.js
// 注: 正本 JSON は .cursorignore のため、本ファイルが唯一の機械的スキーマ
// =====================================================

/** キーワードタグ（keyword[] の要素）。参照: EmakiLandscapContent / EmakiPortraitContent */
export type KeywordTag = {
  name: string;
  id: string;
  slug: string;
};

/** 登場人物（personname[] の要素）。参照: EmakiPersonLinks / KusouzuModelLink / personname ページ */
export type PersonName = {
  name: string;
  id: string;
  slug: string;
  ruby?: string;
  portrait?: string;
};

/** 参考文献（reference[] の要素）。参照: EmakiLandscapContent / EmakiPortraitContent の details 節 */
export type ReferenceItem = {
  type: string;
  url: string;
  title: string;
};

/** kusouzuslug: `[{ id: "1" }, ...]` の形。参照: func.js kusouzuSlugItem */
export type KusouzuSlug = { id: string };

/** シーン共通キー。linkId は [slug].js getStaticProps、ekotobaId は ekotoba のみ、uniqueIndex は EmakiConteiner 内で付与 */
type EmakiSceneBase = {
  cat: string;
  /** emaki-text-data の章キー（scene id）。源氏帖番号ではない */
  chapter: number | string;
  /** 源氏絵のみ。54帖マスター参照用の帖番号 */
  genji_chapter?: number | string;
  config: string;
  src: string;
  name: string;
  linkId: number;
  ekotobaId?: number;
  uniqueIndex?: number | null;
};

/** 絵画シーン（cat === "image"）。srcWidth/srcHeight は image のみに存在 */
export type EmakiImageScene = EmakiSceneBase & {
  cat: "image";
  srcWidth?: number;
  srcHeight?: number;
};

/** 詞書シーン（cat === "ekotoba"） */
export type EmakiEkotobaScene = EmakiSceneBase & {
  cat: "ekotoba";
};

export type EmakiScene = EmakiImageScene | EmakiEkotobaScene;

/**
 * 絵巻1巻分のメタデータ（image-metadata-cache.json の1要素）。
 * 参照: [slug].js / EmakiLandscapContent / EmakiPortraitContent / EmakiConteiner
 */
export type ScrollMetadata = {
  id: string;
  title: string;
  /** URL slug 兼一意ID（naming-convention.md 参照） */
  titleen: string;
  /** English display title (optional). URL slug remains titleen. */
  title_en?: string;
  author?: string;
  authoren?: string;
  /** レガシー typos（atuhoren）は rename しない方針（AGENTS.md） */
  atuhoren?: string;
  edition?: string;
  encodeUrl?: string;
  backgroundImage?: string[];
  thumb?: string;
  thumb2?: string;
  video?: string;
  gif?: string;
  era?: string;
  eraen?: string;
  desc?: string;
  descen?: string;
  metadesc?: string;
  readMore?: boolean;
  type?: string;
  typeen?: string;
  subtype?: string;
  keyword?: KeywordTag[];
  /** @deprecated UI は参照しない。sync 互換のため JSON に残る場合あり */
  kotobagaki?: boolean;
  /** @deprecated UI は参照しない。解説バーは scroll 時常時。タブは kobun 有無 */
  sceneText?: boolean;
  favorite?: boolean;
  sourceImage?: string;
  sourceImageUrl?: string;
  sourceAuthor?: string;
  sourceCollection?: string;
  sourceLicense?: string;
  sourceEkotoba?: string;
  reference?: ReferenceItem[];
  personname?: PersonName[];
  kusouzuslug?: KusouzuSlug[];
  /** 源氏絵用。実データでは未使用 */
  genjieslug?: { id?: string }[];
  emakis: EmakiScene[];
};
