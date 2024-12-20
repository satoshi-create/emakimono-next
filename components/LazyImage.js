import { useState, useEffect, useContext} from "react";
import Image from "next/image";
import { AppContext } from "../pages/_app";
import styles from "../styles/LazyImage.css.module.css";

const LazyImage = ({ src, alt, width, height, srcSp, config }, index) => {
  const [isSkeletonVisible, setSkeletonVisible] = useState(true); // スケルトンの表示状態
  const [isBlurVisible, setBlurVisible] = useState(false); // blurDataURL の表示状態

  // const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [ref, setRef] = useState(null);
  const { windowHeight } = useContext(AppContext);

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
    return `https://res.cloudinary.com/dw2gjxrrf/image/upload/fl_progressive,f_jpg,w_${width},q_${
      quality || 75
    }/${src}`;
  };

  const getResponsiveSrcCloudinary = (emaki) => {
    const aspectRatio = width / height; // アスペクト比を計算

    // デバイスの高さに応じてCloudinaryの画像サイズを動的に調整
    if (windowHeight <= 375) {
      const calculatedWidth = Math.round(375 * aspectRatio); // 高さから幅を計算
      return `${baseUrl}/w_${calculatedWidth},h_375,c_fit/${emaki.src}`; // スマートフォン用
    } else if (windowHeight <= 800) {
      const calculatedWidth = Math.round(800 * aspectRatio); // 高さから幅を計算
      return `${baseUrl}/w_${calculatedWidth},h_800,c_fit/${emaki.src}`; // タブレット用
    } else {
      return `${baseUrl}/w_${width},h_${height},c_fit/${emaki.src}`; // デスクトップ用
    }
  };

  // 低解像度画像（ぼかしプレースホルダー用）
  const blurImage = `${baseUrl}/w_10,h_10,c_fill,q_auto:low/${src.src}`;

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

 useEffect(() => {
    // refが設定されていない場合は何もしない
    if (!ref) return;

    // IntersectionObserverを作成
    const observer = new IntersectionObserver(
      ([entry]) => {
        // 要素がビューポートに入った場合
        if (entry.isIntersecting) {
          setBlurVisible(true); // isVisibleをtrueに更新
          console.log(true);

          observer.disconnect(); // 一度表示したら監視を停止
        }
      },
      { rootMargin: "300px" } // ビューポートの200px手前で読み込みをトリガー
    );

    // refで指定された要素を監視対象として設定
    observer.observe(ref);

    // クリーンアップ関数: コンポーネントのアンマウント時に監視を停止
    return () => observer.disconnect();
  }, [ref]); // refが変更されるたびにuseEffectが再実行される

  const { orientation, toggleFullscreen } = useContext(AppContext);

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
      id={src}
      className={`image-wrapper`}
      style={{
        width: `${
          (width / height) * getResponsiveWidth(toggleFullscreen, orientation)
        }vh`,
        // width: `${width}px`,
        position: "relative",
      }}
      // IntersectionObserverで監視する対象のdiv
      ref={setRef}
    >
      {/* スケルトン: 画像がロードされるまで表示 */}
      {isSkeletonVisible && <div className="skeleton"></div>}
      {isBlurVisible && (
        <Image
          loader={config === "cloudinary" ? cloudinaryLoader : undefined} // Cloudinaryが有効な場合のみローダー適用
          src={src.src} // Cloudinaryの画像ID
          width={width}
          height={height}
          alt={alt}
          // priority={index < 2} // 最初の1枚だけ優先的に読み込み
          priority={index === 0} // 最初の画像は即時プリロード
          loading={index < 2 ? "eager" : "lazy"} // 最初の2枚は即時読み込み
          // placeholder={index > 2 ? "blur" : undefined} // 最初の2枚だけぼかしプレースホルダーを適用
          placeholder={"blur"}
          blurDataURL={config === "cloudinary" ? blurImage : srcSp}
          onLoadingComplete={() => setSkeletonVisible(false)} // 読み込み完了時に状態を更新
          className={`image ${isBlurVisible ? "loaded" : "loading"}`} // 状態に応じたクラスを付与
        />
      )}
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
          animation: fadeLoaded .5s ease-in forwards;
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
