import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { AppContext } from "../pages/_app";
import styles from "../styles/LazyImage.css.module.css";

const LazyImage = ({ src, alt, width, height, srcSp, config }, index) => {
  const [isLoaded, setIsLoaded] = useState(false);

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

  console.log(src.src);

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // IntersectionObserverのコールバック関数を設定。
    // 1つのエントリ (entry) を観察し、要素がビューポートに入ったか確認します。
    const observer = new IntersectionObserver(([entry]) => {
      // entry.isIntersecting: 要素がビューポート内に入っている場合は true
      if (entry.isIntersecting) {
        setIsVisible(true); // 要素が見えたら状態を更新して isVisible を true に設定
        observer.disconnect(); // 一度見えたら監視を停止
      }
    });

    // `src`（画像の識別子）に基づいて対象のDOM要素を取得
    const element = document.getElementById(src);

    // 要素が存在する場合のみ IntersectionObserver で監視を開始
    if (element) observer.observe(element);

    // コンポーネントがアンマウントされた時にクリーンアップ処理を実行
    // IntersectionObserver を停止してリソースを解放
    return () => observer.disconnect();
  }, [src]); // `src`が変更されるたびに useEffect が再実行される

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
    >
      {isVisible && (
        <Image
          loader={cloudinaryLoader}
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
          onLoadingComplete={() => setIsLoaded(true)} // 読み込み完了時に状態を更新
          className={`image ${isLoaded ? "loaded" : "loading"}`} // 状態に応じたクラスを付与
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

        /* 初期状態：透明＆ぼかし */
        .image.loading {
          filter: blur(10px); /* 初期はぼかしが強い */
          animation: fadeloading 1s forwards;
        }

        /* 読み込み完了後：なめらかにフェードイン＆ぼかし解除 */
        .image.loaded {
          animation: fadeLoaded 1s forwards;
        }

        @keyframes fadeLoading {
          0% {
            filter: blur(10px);
          }

          100% {
            filter: blur(5px);
          }
        }

        @keyframes fadeLoaded {
          0% {
            filter: blur(5px);
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
