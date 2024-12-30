require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors()); // フロントエンドとの通信を許可

const PORT = process.env.PORT || 5000;
const CLOUDINARY_API_BASE = `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/resources/image/upload`;

// Cloudinary画像のメタデータを取得するエンドポイント
app.get("/api/image-metadata/:publicId", async (req, res) => {
  const { publicId } = req.params;

  try {
    const response = await axios.get(`${CLOUDINARY_API_BASE}/${publicId}`, {
      auth: {
        username: process.env.CLOUD_API_KEY,
        password: process.env.CLOUD_API_SECRET,
      },
    });

    // 必要な情報を抽出
    const { width, height, secure_url: url } = response.data;
    res.json({ width, height, url });
  } catch (error) {
    console.error("Error fetching image metadata:", error.message);
    res.status(500).json({ error: "Failed to fetch image metadata" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
