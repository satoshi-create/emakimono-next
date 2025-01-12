require("dotenv").config({ path: ".env.local" });
const express = require("express");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

// Cloudinary設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 5000;

// JSONファイルのパス
const jsonFilePath = path.resolve(
  __dirname,
  "../../libs/image-metadata-cache/image-metadata-cache.json"
);

// Cloudinaryからメタデータを取得する関数
async function fetchImageDimensions(publicId) {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: "image",
    });
    return {
      width: result.width,
      height: result.height,
      url: result.secure_url,
    };
  } catch (error) {
    console.error(`Error fetching dimensions for ${publicId}:`, error.message);

     // 詳細エラーをログに出力
    if (error.response && error.response.data) {
      console.error("Cloudinary API Error Details:", error.response.data);
    }

    return null;
  }
}

// URLからpublic_idを抽出
function extractPublicId(cloudinaryPath) {
  const match = cloudinaryPath.match(/v\d+\/(.+)\.[a-z]+$/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}
// ネストされた配列を再帰的に処理する関数
async function updateNestedArray(data) {
  return Promise.all(
    data.map(async (item) => {
      if (!item.emakis) {
        return item; // emakisがない場合そのまま返す
      }

      const updatedEmakis = await Promise.all(
        item.emakis.map(async (emaki) => {
          if (emaki.config === "cloudinary") {
            const publicId = extractPublicId(emaki.src);
            // console.log("Public ID:", publicId);

            const dimensions = await fetchImageDimensions(publicId);
            if (dimensions) {
              console.log("Fetched dimensions:", dimensions);
              return {
                ...emaki,
                srcWidth: dimensions.width,
                srcHeight: dimensions.height
              };
            } else {
              return emaki; // スキップして元のデータを返す
            }
          }
          return emaki; // 更新されていない場合はそのまま返す
        })
      );

      const updatedItem = {
        ...item,
        emakis: updatedEmakis,
      };

      // console.log("Updated item:", updatedItem); // 中間結果の確認
      return updatedItem;
    })
  );
}

// JSONデータを更新するエンドポイント
app.put("/update-json", async (req, res) => {
  try {
    // JSONデータを読み込み
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

    // データを更新
    const updatedData = await updateNestedArray(jsonData);

    // 更新されたデータをJSONファイルに書き込み
    fs.writeFileSync(
      jsonFilePath,
      JSON.stringify(updatedData, null, 2),
      "utf-8"
    );

    console.log(
      `Updated JSON data:`
      // JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"))
    );

    res.status(200).json({
      message: "JSON data updated successfully",
    });
  } catch (error) {
    console.error("Error updating JSON data:", error);
    res.status(500).json({ message: "Failed to update JSON data" });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


// node pages/api/updatejson.js
