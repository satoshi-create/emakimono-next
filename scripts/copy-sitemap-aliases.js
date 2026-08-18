/**
 * next-sitemap 後に別名パスを public/ へ複製する。
 * 拡張子付きパスは Next.js i18n の redirects が効かないことがあるため、
 * 静的ファイルとして 200 を返す。
 */
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");
const src = path.join(publicDir, "sitemap.xml");

if (!fs.existsSync(src)) {
  console.warn("copy-sitemap-aliases: public/sitemap.xml がありません");
  process.exit(0);
}

["sitemap-index.xml", "sitemap_index.xml", "news_sitemap.xml", "sitemap.html"].forEach(
  (name) => {
    fs.copyFileSync(src, path.join(publicDir, name));
    console.log(`copy-sitemap-aliases: ${name}`);
  }
);
