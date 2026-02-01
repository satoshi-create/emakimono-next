import { AppContext } from "@/pages/_app";
import Image from "next/image";
import { useContext, useEffect, useRef, useState } from "react";

const LazyImage = ({
  src,
  alt,
  width,
  height,
  srcSp,
  config,
  uniqueIndex,
}) => {
  const { windowHeight, orientation, toggleFullscreen } =
    useContext(AppContext);

  const [isSkeletonVisible, setSkeletonVisible] = useState(true);

  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.offsetHeight);
      }
    };

    // 初回取得
    updateHeight();

    // ウィンドウリサイズ時にも高さを更新
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const baseUrl =
    "https://res.cloudinary.com/dw2gjxrrf/image/upload/fl_progressive";

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

  const cloudinaryLoader = ({ src, width, quality }) => {
    return `${baseUrl},f_jpg,w_${width},q_${quality || 75}/${src}`;
  };

  const getResponsiveSrcCloudinary = (emaki, containerHeight) => {
    const aspectRatio = width / height; // アスペクト比を計算

    // コンテナの高さに応じてCloudinaryの画像サイズを動的に調整
    if (containerHeight <= 375) {
      const calculatedWidth = Math.round(375 * aspectRatio); // 高さから幅を計算
      return `${baseUrl}/w_${calculatedWidth},h_375,c_fit/${emaki.src}`; // スマートフォン用
    } else if (containerHeight <= 800) {
      const calculatedWidth = Math.round(800 * aspectRatio); // 高さから幅を計算
      return `${baseUrl}/w_${calculatedWidth},h_800,c_fit/${emaki.src}`; // タブレット用
    } else {
      const calculatedWidth = Math.round(containerHeight * aspectRatio); // 高さから幅を計算
      return `${baseUrl}/w_${calculatedWidth},h_${containerHeight},c_fit/${emaki.src}`; // デスクトップ用
    }
  };

  const responsiveSrc = getResponsiveSrcCloudinary(src, containerHeight);

  // 低解像度画像（ぼかしプレースホルダー用）
  const blurImage = `${baseUrl}/w_10,h_10,c_fill,q_auto:low/${src.src}`;

  // 少し大きめの低解像度画像（ぼかしプレースホルダー用）
  // const blurImage = `${baseUrl}/w_50,h_50,c_fill,q_auto:low/${src.src}`;

  const getImages = (emaki, cfg) => {
    if (cfg === "cloudinary") {
      // console.log(getResponsiveSrcCloudinary(emaki));

      return getResponsiveSrcCloudinary(emaki);
    } else {
      return getResponsiveSrc(emaki);
    }
  };

  // CSS custom property を使用してモバイルブラウザの dvh に対応
  // dvh (dynamic viewport height) はモバイルの URL バー表示/非表示に追従
  const getResponsiveHeightVar = (full, ori) => {
    if (full && ori === "landscape") {
      return "var(--vh-100)";
    } else if (ori === "landscape") {
      return "var(--vh-75)";
    } else if (ori === "portrait") {
      return "var(--vh-45)";
    }
    return "var(--vh-75)"; // fallback
  };

  return (
    <div
      className={`image-wrapper`}
      style={{
        width: `calc(${width / height} * ${getResponsiveHeightVar(toggleFullscreen, orientation)})`,
        position: "relative",
      }}
      ref={containerRef}
    >
      {/* スケルトン: 画像がロードされるまで表示 */}
      {isSkeletonVisible && <div className="skeleton"></div>}
      <Image
        loader={config === "cloudinary" ? cloudinaryLoader : undefined} // Cloudinaryが有効な場合のみローダー適用
        src={src.src} // Cloudinaryの画像ID
        width={width}
        height={height}
        alt={alt}
        priority={uniqueIndex === 0} // 最初の画像は即時プリロード
        loading={uniqueIndex < 2 ? "eager" : "lazy"} // 最初の2枚は即時読み込み
        layout="responsive"
        placeholder={"blur"} // ぼかしプレースホルダーを適用
        blurDataURL={config === "cloudinary" ? blurImage : srcSp}
        onLoadingComplete={() => setSkeletonVisible(false)} // 読み込み完了時に状態を更新
        className="image loaded" // Next.js標準の遅延読み込みに依存
      />
      <style jsx global>{`
        .imageWrapper {
          position: relative; /* Imageの親要素として必要 */
          flex-shrink: 0; /* 子要素が縮小されないようにする */
          height: 100%; /* コンテナの高さに合わせる */
          width: ${width}px;
          height: ${height}px;
          overflow: hidden;
        }
        .skeleton {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            #e0e0e0 25%,
            #f0f0f0 50%,
            #e0e0e0 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          aspect-ratio: ${width} / ${height};
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        /* 初期状態：透明＆ぼかし */
        .image.loading {
          filter: blur(5px); /* 初期はぼかしが強い */
          // animation: fadeLoading 1s forwards;
        }

        /* 読み込み完了後：なめらかにフェードイン＆ぼかし解除 */
        .image.loaded {
          animation: fadeLoaded 0.5s ease-in forwards;
        }

        @keyframes fadeLoading {
          0% {
            filter: blur(5px);
          }

          100% {
            filter: blur(3px);
          }
        }

        @keyframes fadeLoaded {
          0% {
            filter: blur(3px);
          }

          100% {
            filter: blur(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LazyImage;
