import fs from "fs";
import path from "path";
import https from "https";

// メタデータキャッシュファイルのパス
const METADATA_PATH =
  "/home/user/emakimono-next/src/data/image-metadata-cache/image-metadata-cache.json";

// Cloudinary 変換ベース URL（ビューアーと同じ WebP / 1920px / eco画質）
const CLOUDINARY_TRANSFORM_BASE =
  "https://res.cloudinary.com/dw2gjxrrf/image/upload/fl_progressive,c_limit,w_1920,f_auto,q_auto:eco";

const args = process.argv.slice(2);
const searchKeyword = (args[0] || "").toLowerCase();

if (!searchKeyword) {
  console.log(`
【使い方】
  node download_from_metadata.mjs <検索キーワード (titleen, edition, id, 画像名など)>

【実行例】
  # 乙巻をダウンロード（titleen や edition、キーワードで指定可能）
  node download_from_metadata.mjs second
  # または
  node download_from_metadata.mjs otu
  # 丙巻
  node download_from_metadata.mjs third
  # 丁巻
  node download_from_metadata.mjs fourth
`);
  process.exit(1);
}

if (!fs.existsSync(METADATA_PATH)) {
  console.error(`エラー: メタデータファイルが見つかりません: ${METADATA_PATH}`);
  process.exit(1);
}

const rawData = fs.readFileSync(METADATA_PATH, "utf-8");
const emakiList = JSON.parse(rawData);

// 1. キーワードに合致する絵巻・画像を抽出
const matchedImages = [];

for (const emaki of emakiList) {
  // 絵巻全体の属性（title, titleen, edition など）のチェック
  const title = String(emaki.title || "").toLowerCase();
  const titleen = String(emaki.titleen || "").toLowerCase();
  const edition = String(emaki.edition || "").toLowerCase();
  const emakiMatch =
    title.includes(searchKeyword) ||
    titleen.includes(searchKeyword) ||
    edition.includes(searchKeyword);

  if (Array.isArray(emaki.emakis)) {
    for (const item of emaki.emakis) {
      if (item.cat !== "image" || item.config !== "cloudinary") continue;

      const name = String(item.name || "").toLowerCase();
      const src = String(item.src || "").toLowerCase();

      // 絵巻全体のキーワード一致、または画像単体（name, src）の一致
      if (emakiMatch || name.includes(searchKeyword) || src.includes(searchKeyword)) {
        matchedImages.push({
          emakiTitle: emaki.title,
          edition: emaki.edition,
          titleen: emaki.titleen,
          name: item.name,
          src: item.src,
        });
      }
    }
  }
}

if (matchedImages.length === 0) {
  console.log(`該当する画像が見つかりませんでした: "${searchKeyword}"`);
  console.log(`\n【登録されている絵巻タイトルの例】:`);
  emakiList.slice(0, 10).forEach((e) => {
    console.log(` - ${e.title} (${e.edition || ""}) / titleen: ${e.titleen}`);
  });
  process.exit(0);
}

// 出力先ディレクトリ
const outputDir = path.resolve(".", searchKeyword);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`====================================================`);
console.log(` 対象絵巻: ${matchedImages[0].emakiTitle} (${matchedImages[0].edition || ""})`);
console.log(` 該当画像数: ${matchedImages.length} 件`);
console.log(` 保存先: ${outputDir}`);
console.log(`====================================================`);

function fetchUrl(url) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return resolve(fetchUrl(res.headers.location));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return resolve(null);
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", () => resolve(null));
  });
}

async function run() {
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < matchedImages.length; i++) {
    const item = matchedImages[i];
    const filename = `${item.name}.webp`;
    const filePath = path.join(outputDir, filename);

    if (fs.existsSync(filePath)) {
      console.log(`[${i + 1}/${matchedImages.length}] [SKIP] 存在済み: ${filename}`);
      skipCount++;
      continue;
    }

    const cleanSrc = item.src.replace(/^\//, "");
    const downloadUrl = `${CLOUDINARY_TRANSFORM_BASE}/${cleanSrc}`;

    process.stdout.write(
      `[${i + 1}/${matchedImages.length}] [DOWNLOAD] ${filename} ... `
    );

    const data = await fetchUrl(downloadUrl);

    if (data && data.length > 0) {
      fs.writeFileSync(filePath, data);
      console.log(`OK (${(data.length / 1024).toFixed(1)} KB)`);
      successCount++;
    } else {
      console.log(`FAILED (HTTP != 200)`);
      failCount++;
    }
  }

  console.log(`----------------------------------------------------`);
  console.log(`完了!`);
  console.log(
    `新規取得: ${successCount} 件 / スキップ: ${skipCount} 件 / 失敗: ${failCount} 件`
  );
  console.log(`----------------------------------------------------`);
}

run();
