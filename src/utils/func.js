/**
 * Shared hooks and list helpers for pages and components.
 *
 * 実装は責務ごとに分割済み。本ファイルは既存 import（`@/utils/func`）を壊さないための
 * facade（re-export）のみ。
 *
 * - ロケールフック: `@/hooks/useLocale`
 * - 時代表示ヘルパー: `@/utils/emakiEra`
 * - 集計・フィルタ: `@/utils/emakiList`
 * - 章テキスト接続: `@/utils/emakiChapterText`
 *
 * 新規コードは func.js ではなく上記のモジュールを直接 import すること。
 */
export {
  useLocale,
  useLocaleData,
  useLocaleMeta,
} from "@/hooks/useLocale";
export { eraColor, eraNameEn } from "./emakiEra";
export {
  authorItem,
  convertAuthor,
  eraItem,
  filterdKeywords,
  findPersonProfile,
  genjieSlugItem,
  keywordItem,
  kusouzuSlugItem,
  personnameItem,
  personProfileItem,
  removeNestedEmakisObj,
  typeItem,
} from "./emakiList";
export {
  ChaptersDesc,
  ChaptersGendaibun,
  ChaptersTitle,
  connectGenjiChapters,
  connectGenjiChaptersScene,
  getChapterDescRaw,
} from "./emakiChapterText";
