/**
 * 人物詳細・一覧で SSG / 公開する slug。
 * metadata.personname に載せた代表人物はここに追加すること
 * （未掲載 slug は seoRedirects で personnamelist へ 301）。
 */
export const DISPLAY_PERSON_SLUGS = [
  "danrinkougou",
  "ononokomachi",
  "tachibananaomoto",
  "fujiwarasaneyori",
] as const;
