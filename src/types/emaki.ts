
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

// ============================================================
// New schema-aware types for Emaki scroll viewer JSON
// scene_title がタイムライン・一覧・モーダルで使う主要なセクション識別子
// ============================================================

export type EmakiCategory = "scene_title" | "image" | "ekotoba";

export interface BaseEmakiItem {
  cat: EmakiCategory;
  chapter: number;
  sort_key: number;
  scroll_id: string;
}

/** 段タイトル（タイムライン・リスト・詳細モーダルで表示するセクション） */
export interface SceneTitleItem extends BaseEmakiItem {
  cat: "scene_title";
  /** 段タイトル（日本語） */
  title: string;
  scene_id: string;
  /** 段タイトル（英語） */
  title_en?: string;
}

export interface ImageItem extends BaseEmakiItem {
  cat: "image";
  src: string;
  width: number;
  height: number;
  name?: string;
  config?: string;
  page_id?: string | null;
}

export interface EkotobaItem extends BaseEmakiItem {
  cat: "ekotoba";
  text: string;
  text_en?: string;
}

export type EmakiItem = SceneTitleItem | ImageItem | EkotobaItem;

export interface EmakiScrollMetadata {
  scroll_id: string;
  id: number;
  title: string;
  description: string;
  era?: string;
  author?: string;
}

export interface EmakiScroll {
  metadata: EmakiScrollMetadata;
  emakis: EmakiItem[];
}

export function isSceneTitleItem(item: EmakiItem): item is SceneTitleItem {
  return item.cat === "scene_title";
}

export function isImageItem(item: EmakiItem): item is ImageItem {
  return item.cat === "image";
}

export function isEkotobaItem(item: EmakiItem): item is EkotobaItem {
  return item.cat === "ekotoba";
}
