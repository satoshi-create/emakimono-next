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
  title: string;
  author: string;
  source: {
    url: string;
    name: string;
  };
  personnames: PersonName[] | null; // 誰もいない場合もあるので null を許容
  keyword: Keyword[];
  scroll_id: string;
  thumbnail: string;
  description: string;
}

// 4. Supabase RPC から返ってくる全体の形
export interface ScrollResponse {
  metadata: ScrollMetadata;
}
