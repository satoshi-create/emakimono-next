import { useEffect, useState } from "react";
import LazyImage from "../emaki/viewer/LazyImage";

const HorizontalScrollGallery = ({ images }) => {
  const [windowHeight, setWindowHeight] = useState(0);
  const emakis = images.emakis;
  console.log(emakis);

  // ウィンドウの高さを取得
  useEffect(() => {
    const updateHeight = () => {
      setWindowHeight(window.innerHeight);
    };

    updateHeight(); // 初期高さを設定
    window.addEventListener("resize", updateHeight); // ウィンドウリサイズ時に高さを更新

    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // 高さに基づいて適切な画像ソースを選択
  const getResponsiveSrc = (emaki) => {
    if (windowHeight <= 375) {
      return emaki.srcSp; // スマートフォン用
    } else if (windowHeight <= 800) {
      return emaki.srcTb; // タブレット用
    } else {
      return emaki.src; // デスクトップ用
    }
  };

  return (
    <article className="article">
      {emakis.map((emaki, index) => (
        <LazyImage
          key={index}
          src={getResponsiveSrc(emaki)}
          alt={emaki.name}
          width={emaki.srcWidth}
          height={emaki.srcHeight}
          index={index}
          srcSp={emaki.srcSp}
        />
      ))}
      <style jsx>{`
        .article {
          display: flex; /* 横並びに配置 */
          overflow-x: auto; /* 横スクロールを有効に */
          height: 75vh; /* コンテナの高さを固定 */
          flex-direction: row-reverse;
          overflow-y: hidden;
        }
      `}</style>
    </article>
  );
};

export default HorizontalScrollGallery;

export const getStaticProps = async () => {
  const fs = require("fs");
  const path = require("path");

  const cacheDir = path.join(process.cwd(), "libs/image-metadata-cache");
  const cacheFilePath = path.join(cacheDir, "image-metadata-cache.json");

  // キャッシュファイルが存在しない場合のエラー処理
  if (!fs.existsSync(cacheFilePath)) {
    throw new Error(
      "Image metadata cache not found. Run the generateImageMetadata script."
    );
  }

  // キャッシュファイルを読み込む
  const metadataCache = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));

  // titleが「鳥獣人物戯画」にマッチするJSONオブジェクトをフィルタリング
  const filteredImages = metadataCache
    .filter((item) => item.title === "奈与竹物語絵巻") // titleでマッチするオブジェクトを取得
    .find((item) => item);

  console.log(filteredImages);

  return {
    props: {
      images: filteredImages, // クライアントサイドに渡すデータ
    },
  };
};
