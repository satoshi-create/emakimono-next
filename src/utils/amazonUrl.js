/**
 * AmazonアソシエイトURL生成ユーティリティ
 * 将来のPA-API導入時は、本モジュール内でPA-APIレスポンスのキャッシュを参照する形へ拡張可能。
 */
const ASSOCIATE_TAG = "emakiviewer20-22";

/**
 * 参考文献アイテムから最適なAmazonリンクURLを解決する
 * @param {Object} item - 参考文献オブジェクト
 * @returns {string} 解決されたURL
 */
export function resolveReferenceUrl(item) {
  if (!item) return "#";
  if (item.type !== "amazon") return item.url || "#";

  // 1. すでに正規URLまたは短縮URLが明示されている場合（タグがなければ付与）
  if (item.url) {
    if (item.url.includes("tag=")) return item.url;
    const separator = item.url.includes("?") ? "&" : "?";
    return `${item.url}${separator}tag=${ASSOCIATE_TAG}`;
  }

  // 2. ASIN または 10桁ISBN がある場合（個別商品ページ）
  if (item.asin || item.isbn10) {
    const code = item.asin || item.isbn10;
    return `https://www.amazon.co.jp/dp/${encodeURIComponent(code)}?tag=${ASSOCIATE_TAG}`;
  }

  // 3. 検索キーワード（query）または書籍タイトルから検索結果URLを生成（確実・安全）
  const searchKeyword = item.query || item.searchQuery || item.title || "";
  const cleanKeyword = searchKeyword.replace(/[『』「」]/g, "").trim();
  return `https://www.amazon.co.jp/s?k=${encodeURIComponent(cleanKeyword)}&tag=${ASSOCIATE_TAG}`;
}
