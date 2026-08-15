const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

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
  // 保存先ディレクトリを指定
  const cacheDir = path.join(process.cwd(), "src/data/image-metadata-cache");

  // 保存先ファイルパスを指定
  const cacheFilePath = path.join(cacheDir, "image-metadata-cache.json");

  // 保存先ディレクトリが存在しない場合は作成
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
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

  // 更新されたデータをキャッシュファイルとして保存
  fs.writeFileSync(cacheFilePath, JSON.stringify(updatedJsonData, null, 2));
  // console.log(`Image metadata cache saved to ${cacheFilePath}`);
})();
