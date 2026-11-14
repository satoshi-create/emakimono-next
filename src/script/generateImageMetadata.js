const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// ---------------------------------------------------------------------------
// 1. 境界定義・定数（YAML自動アップロード契約）
// local-data/pipeline/*.json（dataEmakis 等）を結合し、フロント正本
// src/data/scroll-metadata/scroll-metadata.json を全件再生成する。
// 通常の scroll 同期は sync_all.py の upsert_cache_entry（1巻差し替え）。
// --regenerate-cache 実行時のみ本スクリプトを subprocess 起動する。
// ---------------------------------------------------------------------------

// JSONデータをrequireで読み込む（パイプライン入力。ローカル保持のため git/cursor 非管理）
const dataByoubus = require("../../local-data/pipeline/dataByoubus.json");
const dataEmakis = require("../../local-data/pipeline/dataEmakis.json");
const dataSeiyoukaiga = require("../../local-data/pipeline/dataSeiyoukaiga.json");
const dataSuibokuga = require("../../local-data/pipeline/dataSuibokuga.json");
const dataUkiyoes = require("../../local-data/pipeline/dataUkiyoes.json");
const dataKotenBungaku = require("../../local-data/pipeline/dataKotenBungaku.json");
const dataSenmenga = require("../../local-data/pipeline/dataSenmenga.json");

// データを結合
const data = dataEmakis.concat(
  dataByoubus,
  dataSeiyoukaiga,
  dataSuibokuga,
  dataUkiyoes,
  dataKotenBungaku,
  dataSenmenga
);

// node script/generateImageMetadata.js

(async () => {
  // ---------------------------------------------------------------------------
  // 2. データ読み込み・寸法補完・キャッシュ書き込み
  // Cloudinary/R2 画像は srcWidth/srcHeight をパイプライン側で保持。ローカル public 画像のみ sharp 計測。
  // ---------------------------------------------------------------------------

  const cacheDir = path.join(process.cwd(), "src/data/scroll-metadata");
  const scrollsDir = path.join(cacheDir, "scrolls");

  if (!fs.existsSync(scrollsDir)) {
    fs.mkdirSync(scrollsDir, { recursive: true });
  }

  // JSONデータを処理
  const updatedJsonData = await Promise.all(
    data.map(async (item) => {
      // 各emakis配列を処理
      const updatedEmakis = await Promise.all(
        item.emakis.map(async (emaki) => {
          if (
            (emaki.cat === "image" && emaki.config !== "cloudinary") ||
            (emaki.cat === "ekotoba" && emaki.src)
          ) {
            const filePath = path.join(process.cwd(), "public", emaki.src);

            if (!fs.existsSync(filePath)) {
              console.warn(`File not found: ${filePath}`);
              return { ...emaki, srcWidth: 0, srcHeight: 0 }; // ファイルがない場合のデフォルト値
            }

            try {
              const metadata = await sharp(filePath).metadata();
              return {
                ...emaki,
                srcWidth: metadata.width,
                srcHeight: metadata.height,
              };
            } catch (error) {
              console.error(`Error processing file ${filePath}:`, error);
              return { ...emaki, srcWidth: 0, srcHeight: 0 }; // エラー時のデフォルト値
            }
          }

          // catが'image'でない場合はそのまま返す
          return emaki;
        })
      );

      return {
        ...item,
        emakis: updatedEmakis,
      };
    })
  );

  const order = [];
  for (const item of updatedJsonData) {
    const titleen = item?.titleen;
    if (!titleen) {
      console.warn("Skipping cache item without titleen");
      continue;
    }
    order.push(titleen);
    const scrollPath = path.join(scrollsDir, `${titleen}.json`);
    fs.writeFileSync(scrollPath, `${JSON.stringify(item, null, 2)}\n`);
  }

  const orderPath = path.join(scrollsDir, "_order.json");
  fs.writeFileSync(orderPath, `${JSON.stringify(order, null, 2)}\n`);
})();
