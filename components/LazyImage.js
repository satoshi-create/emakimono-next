import { useState, useEffect, useContext, useRef } from "react";
import Image from "next/image";
import { AppContext } from "../pages/_app";
import styles from "../styles/LazyImage.css.module.css";

const LazyImage = ({
  src,
  alt,
  width,
  height,
  srcSp,
  srcTb,
  config,
  isBlurVisible,
  uniqueKey,
  index,
  uniqueIndex,
}) => {
  const [isSkeletonVisible, setSkeletonVisible] = useState(true); // スケルトンの表示状態
  const [isLoaded, setIsLoaded] = useState(false);
  const { orientation, toggleFullscreen } = useContext(AppContext);

  const [windowHeight, setWindowHeight] = useState(null);
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    // 初期値を設定し、リサイズイベントを監視
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const baseUrl =
    "https://res.cloudinary.com/dw2gjxrrf/image/upload/fl_progressive,f_jpg";

  // 高さに基づいて適切な画像ソースを選択
  const getResponsiveSrc = () => {
    if (windowHeight <= 800) {
      return src.srcTb; // タブレット用
    } else {
      return src.src; // デスクトップ用
    }
  };

  // const cloudinaryLoader = ({ src, width, quality }) => {
  //   return `https://res.cloudinary.com/dw2gjxrrf/image/upload/fl_progressive,f_jpg,h_${height},q_${
  //     quality || 75
  //   }/${src}`;
  // };

  const cloudinaryLoader = ({ src, quality }) => {
    const aspectRatio = width / height; // アスペクト比を計算

    // デバイスの高さに応じてCloudinaryの画像サイズを動的に調整
    if (windowHeight <= 800) {
      const calculatedWidth = Math.round(800 * aspectRatio); // 高さから幅を計算
      return `${baseUrl}/w_${calculatedWidth},h_800,q_${
        quality || 75
      },c_fit/${src}`; // スマホ・タブレット用
    } else {
      return `${baseUrl}/w_${width},h_${height},q_${
        quality || 75
      },c_fit/${src}`; // デスクトップ用
    }
  };

  // const getResponsiveSrcCloudinary = (emaki) => {
  //   const aspectRatio = width / height; // アスペクト比を計算

  //   // デバイスの高さに応じてCloudinaryの画像サイズを動的に調整
  //   if (windowHeight <= 375) {
  //     const calculatedWidth = Math.round(375 * aspectRatio); // 高さから幅を計算
  //     return `${baseUrl}/w_${calculatedWidth},h_375,c_fit/${emaki.src}`; // スマートフォン用
  //   } else if (windowHeight <= 800) {
  //     const calculatedWidth = Math.round(800 * aspectRatio); // 高さから幅を計算
  //     return `${baseUrl}/w_${calculatedWidth},h_800,c_fit/${emaki.src}`; // タブレット用
  //   } else {
  //     return `${baseUrl}/w_${width},h_${height},c_fit/${emaki.src}`; // デスクトップ用
  //   }
  // };

  // 低解像度画像（ぼかしプレースホルダー用）
  // const blurImage = `${baseUrl}/w_10,h_10,c_fill,q_auto:low/${src.src}`;

  const aspectRatio = width / height; // アスペクト比を計算
  const calculatedWidth = Math.round(375 * aspectRatio); // 高さから幅を計算

  const blurImage = `${baseUrl}/w_${calculatedWidth},h_375,c_fit/${src.src}`; // スマートフォン用

  // 少し大きめの低解像度画像（ぼかしプレースホルダー用）
  // const blurImage = `${baseUrl}/w_50,h_50,c_fill,q_auto:low/${src.src}`;

  const getImages = (emaki, cfg) => {
    if (cfg === "cloudinary") {
      console.log(getResponsiveSrcCloudinary(emaki));

      console.log(getResponsiveSrcCloudinary(emaki));

      return getResponsiveSrcCloudinary(emaki);
    } else {
      return getResponsiveSrc(emaki);
    }
  };

  const getResponsiveWidth = (full, ori) => {
    if (full && ori === "landscape") {
      return 100;
    } else if (ori === "landscape") {
      return 75;
    } else if (ori === "portrait") {
      return 45;
    }
  };

  return (
    <div
      id={index}
      className={`image-wrapper`}
      style={{
        width: `${
          (width / height) * getResponsiveWidth(toggleFullscreen, orientation)
        }vh`,
        // width: `${width}px`,
        position: "relative",
      }}
    >
      {/* スケルトン: 画像がロードされるまで表示 */}
      {isSkeletonVisible && <div className="skeleton"></div>}
      {isBlurVisible && (
        <Image
          loader={config === "cloudinary" ? cloudinaryLoader : getResponsiveSrc} // Cloudinaryが有効な場合のみローダー適用
          src={src.src}
          width={width}
          height={height}
          alt={alt}
          priority={uniqueIndex === 0} // 最初の画像は即時プリロード
          // loading={"lazy"} // 最初の2枚は即時読み込み
          loading={uniqueIndex < 2 ? "eager" : "lazy"} // 最初の2枚は即時読み込み
          placeholder={"blur"} // 最初の2枚だけぼかしプレースホルダーを適用
          blurDataURL={config === "cloudinary" ? blurImage : srcSp}
          onLoadingComplete={() => setSkeletonVisible(false)} // 読み込み完了時に状態を更新
          className={`image ${isBlurVisible ? "loaded" : "loading"}`} // 状態に応じたクラスを付与
          // className={`image ${isBlurVisible ? "loaded" : "loading"}`} // 状態に応じたクラスを付与
        />
      )}
      )
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
