import Image from "next/image";

const HorizontalScrollGallery = ({ images }) => {
  return (
    <div className="container">
      {images.map(({ src, width, height }, index) => (
        <div
          key={index}
          className="imageWrapper"
          style={{
            width: `${(width / height) * 50}vh`, // 高さに基づいて幅を計算
          }}
        >
          <Image
            src={src}
            layout="fill" // 親要素に基づいて描画
            objectFit="cover" // アスペクト比を維持しつつ親要素を埋める
            alt={`Image ${index + 1}`}
          />
        </div>
      ))}
      <style jsx>{`
        .container {
          display: flex; /* 横並びに配置 */
          overflow-x: auto; /* 横スクロールを有効に */
          height: 50vh; /* コンテナの高さを固定 */
        }
        .imageWrapper {
          position: relative; /* Imageの親要素として必要 */
          flex-shrink: 0; /* 子要素が縮小されないようにする */
          height: 100%; /* コンテナの高さに合わせる */
        }
      `}</style>
    </div>
  );
};

export default HorizontalScrollGallery;

export const getStaticProps = async () => {
  // Node.jsのサーバーサイド専用モジュールをrequireでインポート
  const path = require("path");
  const fs = require("fs");
  const sharp = require("sharp");

  // 画像ディレクトリとファイルリスト
  const imageDir = path.join(process.cwd(), "public");
  const imageFiles = fs.readdirSync(imageDir).filter((file) => {
    return file.endsWith(".jpg") || file.endsWith(".png"); // JPGまたはPNGのみを対象
  });

  // 画像の幅と高さを取得
  const images = await Promise.all(
    imageFiles.map(async (file) => {
      const filePath = path.join(imageDir, file);
      const metadata = await sharp(filePath).metadata(); // sharpで画像情報を取得
      return {
        src: `/${file}`,
        width: metadata.width,
        height: metadata.height,
      };
    })
  );

  return {
    props: {
      images, // クライアントに画像情報を渡す
    },
  };
};
