/**
 * 人物詳細・一覧で SSG する slug。
 * 小野小町は cache 未登場だが Wellcome 九相図追加を見据えて維持。
 * seoRedirects の未公開人物 301 と同期すること。
 */
const DISPLAY_PERSON_SLUGS = ["danrinkougou", "ononokomachi"];

module.exports = { DISPLAY_PERSON_SLUGS };
