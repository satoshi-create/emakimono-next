import ja from "../../../../messages/ja.json";
import en from "../../../../messages/en.json";

const TABLE = { ja, en };

export function tDevUpload(key, locale = "ja") {
  const ns = TABLE[locale]?.devUploadScroll ?? TABLE.ja.devUploadScroll;
  return ns[key] ?? key;
}