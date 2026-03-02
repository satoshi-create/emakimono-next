// types/scroll.ts

// 1. キーワードの形
export interface Keyword {
  id: string;
  name: string;
  slug: string;
}

// 2. 登場人物の形
export interface PersonName {
  name: string;
  name_en: string;
}

// 3. メタデータ本体の形
export interface ScrollMetadata {
  id: number;
  era: string;
  /** 時代（英語、RPC で返る場合） */
  eraen?: string;
  title: string;
  author: string;
  /** 英語の著者名（RPC で返る場合） */
  authoren?: string;
  source: {
    url: string;
    name: string;
  };
  personnames: PersonName[] | null; // 誰もいない場合もあるので null を許容
  keyword: Keyword[];
  scroll_id: string;
  thumbnail: string;
  description: string;
  /** 種別（日本語） */
  type?: string;
  /** 種別（英語、RPC で返る場合） */
  typeen?: string;
}

// 4. Supabase RPC から返ってくる全体の形
export interface ScrollResponse {
  metadata: ScrollMetadata;
}

// ============================================================
// 絵巻ビューワー詳細用（get_emaki_data RPC の戻り値）
// ============================================================

/** emakis 配列の要素の共通フィールド */
export interface EmakiDetailItemBase {
  cat: "scene_title" | "image" | "ekotoba";
  chapter: number;
  sort_key: number;
  scroll_id: string;
  src?: string | null;
  width?: number | null;
  height?: number | null;
}

/** scene_title / image / ekotoba の差分配分（RPC が返す形状に合わせた緩い型） */
export interface EmakiDetailItem extends EmakiDetailItemBase {
  [key: string]: unknown;
}

/** get_emaki_data RPC の戻り値 */
export interface EmakiDetailResponse {
  emakis: EmakiDetailItem[];
  metadata?: Record<string, unknown>;
}
