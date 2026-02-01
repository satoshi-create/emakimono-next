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
  isPlayMode, // 再生モード状態
}) => {
  const { windowHeight, orientation, toggleFullscreen } =
    useContext(AppContext);

  const [isSkeletonVisible, setSkeletonVisible] = useState(true);
  const [isImageLoaded, setImageLoaded] = useState(false); // 画像読み込み完了状態（フェード用）

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

  // 絵巻の紙色（淡いベージュ #f5f0e6）を SVG data URL で指定
  // Firefox/Chrome/Edge での白背景フラッシュを防ぐため、外部 URL ではなくインライン画像を使用
  // SVG を使用することで確実に指定した色が表示される
  const PAPER_COLOR_BLUR_DATA_URL =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%23f5f0e6' width='1' height='1'/%3E%3C/svg%3E";

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

  // 注: 以前は Cloudinary の低解像度画像を blurDataURL に使用していたが、
  // Firefox で外部 URL の読み込み遅延により白背景が露出する問題があったため、
  // 上記の PAPER_COLOR_BLUR_DATA_URL（base64 インライン画像）に変更

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
        height: "100%", // 高さを明示的に設定（白背景対策）
        position: "relative",
        backgroundColor: "#f5f0e6", // 絵巻の紙色（白背景対策フォールバック）
      }}
      ref={containerRef}
    >
      {/* スケルトン: 画像がロードされるまで表示、読み込み完了後フェードアウト */}
      {isSkeletonVisible && (
        <div
          className="skeleton"
          style={{
            opacity: isImageLoaded ? 0 : 1,
            transition: "opacity 0.3s ease-out",
          }}
        />
      )}
      <Image
        loader={config === "cloudinary" ? cloudinaryLoader : undefined} // Cloudinaryが有効な場合のみローダー適用
        src={src.src} // Cloudinaryの画像ID
        width={width}
        height={height}
        alt={alt}
        priority={uniqueIndex === 0} // 最初の画像は即時プリロード
        loading={isPlayMode || uniqueIndex < 10 ? "eager" : "lazy"} // 再生モード時は全画像 eager
        lazyBoundary="2000px" // ビューポートの2000px手前から読み込み開始
        layout="responsive"
        placeholder={"blur"} // ぼかしプレースホルダーを適用
        blurDataURL={PAPER_COLOR_BLUR_DATA_URL} // 絵巻の紙色（Firefox 白背景対策）
        onLoadingComplete={() => {
          // 画像読み込み完了 → フェードアウト開始
          setImageLoaded(true);
          // フェードアウト完了後にスケルトンを非表示
          setTimeout(() => setSkeletonVisible(false), 300);
        }}
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
          z-index: 2; /* next/image の上に表示 */
          /* 絵巻の紙色に馴染む静的な淡いベージュ（シマーアニメーションは視覚ノイズになるため削除） */
          background-color: #f5f0e6;
          aspect-ratio: ${width} / ${height};
        }
        /* next/image の内部 span/img 要素にも背景色を適用（白背景対策） */
        .image-wrapper > span,
        .image-wrapper > div {
          background-color: #f5f0e6 !important;
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
