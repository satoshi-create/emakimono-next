/**
 * 絵引（民俗・生活誌）オーバーレイの型定義。
 * 正本は scrolls/source/ebiki/ebiki.csv → scripts/convert-ebiki-csv.js → src/data/folklore/
 * 既存の emaki-text-data / image-metadata-cache には埋め込まない。
 */

/** 行為カテゴリ（CSV act_category） */
export type FolkloreActCategory =
  | "labor_trade"
  | "dwell"
  | "carry"
  | "eat"
  | "body_life"
  | "play_ritual"
  | "wear";

/** 宮本常一『絵巻物に見る日本常民生活誌』の参照 */
export type FolkloreMiyamoto = {
  chapter_title: string;
  insight: string;
  page_ref: string;
};

/** 神奈川大学『絵引』原画DB の書誌 */
export type FolkloreEbikiRef = {
  title: string;
  original_emaki: string;
  volume: string;
  page: string;
  number: string;
  artist: string;
  location: string;
  url: string;
};

/** 民具・生活誌アイテム 1 件 */
export type FolkloreItem = {
  item_id: string;
  name: string;
  /** 英語タイトル（locale=en 時に優先） */
  name_en?: string;
  reading: string;
  act_category: FolkloreActCategory;
  act_label: string;
  /** 英語カテゴリ名（locale=en 時に優先） */
  act_label_en?: string;
  target_subject: string;
  era: string;
  /** 英語時代名（locale=en 時に優先） */
  era_en?: string;
  keywords: string[];
  summary: string;
  /** 英語概要（locale=en 時に優先） */
  summary_en?: string;
  miyamoto: FolkloreMiyamoto;
  /** ビューア URL スラッグ（正規化済み） */
  titleen: string;
  /** CSV 生の scroll_id */
  scroll_id_raw: string;
  /** 段 ID（CSV scene_id）。ビューア chapter と対応 */
  scene_id: string;
  scene_title: string;
  scene_desc: string;
  /**
   * 段コンテナ内の相対位置（0〜100）。
   * 0 = 段の右端（開始）、50 = 中央、100 = 左端（末尾）。RTL 読み進み方向へオフセット。
   */
  offset_percent?: number;
  /** 対象画像スライスの linkId（未指定時は scene_id から推定） */
  link_id?: number;
  /** 切り抜きサムネイル（例: /assets/folklore/{item_id}.webp） */
  crop_thumb?: string;
  ebiki: FolkloreEbikiRef;
};

/**
 * titleen → chapter(scene_id) → item_id[]
 * 段単位でチップ表示するための逆引き。
 */
export type FolkloreByTitleen = Record<string, Record<string, string[]>>;
