/**
 * =============================================================================
 * 1. 人物関連ハブリンク型定義 (PersonHubLink)
 * =============================================================================
 */
export interface PersonHubLink {
  path: string;
  labelJa: string;
  labelEn: string;
}

/**
 * =============================================================================
 * 2. 人物特集リンク型定義 (PersonFeaturedLink)
 * =============================================================================
 */
export interface PersonFeaturedLink {
  path: string;
  labelJa: string;
  labelEn: string;
}

/**
 * =============================================================================
 * 3. 人物プロフィールマスター型定義 (PersonProfile)
 * -----------------------------------------------------------------------------
 * 人物詳細ページ・SEOリダイレクト・絵巻登場人物集計の正本データ型。
 * =============================================================================
 */
export interface PersonProfile {
  slug: string;
  name: string;
  id: string;
  ruby: string;
  era: string;
  eraen: string;
  portrait: string;
  heroCloudinary?: string;
  bio: string;
  bioen: string;
  hub: PersonHubLink | null;
  nameen?: string;
  featuredLinks?: PersonFeaturedLink[];
}