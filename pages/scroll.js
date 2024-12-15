import { useState, useEffect } from "react";
import Image from "next/image";

const LazyImage = ({ src, alt, width, height, srcSp }, index) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    });
    const element = document.getElementById(src);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [src]);

  return (
    <div
      id={src}
      className="imageWrapper"
      style={{
        width: `${(width / height) * 75}vh`,
        // width: `${width}px`,
        position: "relative",
      }}
    >
      {isVisible && (
        <Image
          src={src}
          layout="fill"
          objectFit="cover"
          alt={alt}
          sizes="(max-height: 375px) 375px, (max-height: 800px) 800px, 1080px"
          priority={index < 2} // 最初の2枚は優先的に読み込む
          loading={index < 5 ? "eager" : "lazy"} // 最初の5枚は遅延読み込みを無効化
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
        />
      )}
      <style jsx>{`
        .imageWrapper {
          position: relative; /* Imageの親要素として必要 */
          flex-shrink: 0; /* 子要素が縮小されないようにする */
          height: 100%; /* コンテナの高さに合わせる */
        }
      `}</style>
    </div>
  );
};

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
          width={emaki.width}
          height={emaki.height}
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
  const path = require("path");
  const fs = require("fs");
  const sharp = require("sharp");

  const jsonData = {
    title: "鳥獣人物戯画絵巻",
    emakis: [
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_00-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_00-800.webp",
        src: "/cyoujyuu_yamazaki_kou_00-1080.webp",
        name: "cyoujyuu_yamazaki_kou_00",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_01-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_01-800.webp",
        src: "/cyoujyuu_yamazaki_kou_01-1080.webp",
        name: "cyoujyuu_yamazaki_kou_01",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_02-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_02-800.webp",
        src: "/cyoujyuu_yamazaki_kou_02-1080.webp",
        name: "cyoujyuu_yamazaki_kou_02",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_03-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_03-800.webp",
        src: "/cyoujyuu_yamazaki_kou_03-1080.webp",
        name: "cyoujyuu_yamazaki_kou_03",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_04-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_04-800.webp",
        src: "/cyoujyuu_yamazaki_kou_04-1080.webp",
        name: "cyoujyuu_yamazaki_kou_04",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_05-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_05-800.webp",
        src: "/cyoujyuu_yamazaki_kou_05-1080.webp",
        name: "cyoujyuu_yamazaki_kou_05",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_06-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_06-800.webp",
        src: "/cyoujyuu_yamazaki_kou_06-1080.webp",
        name: "cyoujyuu_yamazaki_kou_06",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_07-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_07-800.webp",
        src: "/cyoujyuu_yamazaki_kou_07-1080.webp",
        name: "cyoujyuu_yamazaki_kou_07",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_08-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_08-800.webp",
        src: "/cyoujyuu_yamazaki_kou_08-1080.webp",
        name: "cyoujyuu_yamazaki_kou_08",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_09-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_09-800.webp",
        src: "/cyoujyuu_yamazaki_kou_09-1080.webp",
        name: "cyoujyuu_yamazaki_kou_09",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_10-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_10-800.webp",
        src: "/cyoujyuu_yamazaki_kou_10-1080.webp",
        name: "cyoujyuu_yamazaki_kou_10",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_11-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_11-800.webp",
        src: "/cyoujyuu_yamazaki_kou_11-1080.webp",
        name: "cyoujyuu_yamazaki_kou_11",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_12-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_12-800.webp",
        src: "/cyoujyuu_yamazaki_kou_12-1080.webp",
        name: "cyoujyuu_yamazaki_kou_12",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_13-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_13-800.webp",
        src: "/cyoujyuu_yamazaki_kou_13-1080.webp",
        name: "cyoujyuu_yamazaki_kou_13",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_14-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_14-800.webp",
        src: "/cyoujyuu_yamazaki_kou_14-1080.webp",
        name: "cyoujyuu_yamazaki_kou_14",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_15-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_15-800.webp",
        src: "/cyoujyuu_yamazaki_kou_15-1080.webp",
        name: "cyoujyuu_yamazaki_kou_15",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_16-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_16-800.webp",
        src: "/cyoujyuu_yamazaki_kou_16-1080.webp",
        name: "cyoujyuu_yamazaki_kou_16",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_17-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_17-800.webp",
        src: "/cyoujyuu_yamazaki_kou_17-1080.webp",
        name: "cyoujyuu_yamazaki_kou_17",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_18-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_18-800.webp",
        src: "/cyoujyuu_yamazaki_kou_18-1080.webp",
        name: "cyoujyuu_yamazaki_kou_18",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_19-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_19-800.webp",
        src: "/cyoujyuu_yamazaki_kou_19-1080.webp",
        name: "cyoujyuu_yamazaki_kou_19",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_20-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_20-800.webp",
        src: "/cyoujyuu_yamazaki_kou_20-1080.webp",
        name: "cyoujyuu_yamazaki_kou_20",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_21-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_21-800.webp",
        src: "/cyoujyuu_yamazaki_kou_21-1080.webp",
        name: "cyoujyuu_yamazaki_kou_21",
      },
      {
        cat: "image",
        srcSp: "/cyoujyuu_yamazaki_kou_22-375.webp",
        srcTb: "/cyoujyuu_yamazaki_kou_22-800.webp",
        src: "/cyoujyuu_yamazaki_kou_22-1080.webp",
        name: "cyoujyuu_yamazaki_kou_22",
      },
    ],
  };

  // emakis配列内の画像幅を取得し、新しいオブジェクトを作成
  const updatedEmakis = await Promise.all(
    jsonData.emakis.map(async (emaki) => {
      const filePath = path.join(process.cwd(), "public", emaki.src);
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return { ...emaki, width: 0 }; // ファイルが見つからない場合、widthを0に設定
      }

      const metadata = await sharp(filePath).metadata(); // sharpで画像情報を取得
      return {
        ...emaki,
        width: metadata.width, // 元のオブジェクトにwidthを追加
        height: metadata.height, // 元のオブジェクトにwidthを追加
      };
    })
  );

  // 更新したemakisを含む新しいJSONデータを作成
  const updatedJsonData = {
    ...jsonData,
    emakis: updatedEmakis,
  };

  return {
    props: {
      images: updatedJsonData, // 新しいJSONデータをクライアントに渡す
    },
  };
};
