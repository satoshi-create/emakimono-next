import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { AppContext } from "../pages/_app";

const LazyImage = ({ src, alt, width, height, srcSp ,config}, index) => {
  const { windowHeight } = useContext(AppContext);

  const baseUrl = "https://res.cloudinary.com/dw2gjxrrf/image/upload";

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
  // const blurImage = `${baseUrl}/w_10,h_10,c_fill,q_auto:low/${src.src}`;

  // 少し大きめの低解像度画像（ぼかしプレースホルダー用）
  const blurImage = `${baseUrl}/w_50,h_50,c_fill,q_auto:low/${publicId}`;

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
      className="imageWrapper"
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
          src={getImages(src, config)}
          layout="fill"
          objectFit="cover"
          alt={alt}
          // sizes="(max-height: 375px) 375px, (max-height: 800px) 800px, 1080px"
          priority={index < 2} // 最初の1枚だけ優先的に読み込み
          placeholder={"blur"} // 最初の2枚だけぼかしプレースホルダーを適用
          // placeholder={index < 2 ? "blur" : undefined} // 最初の2枚だけぼかしプレースホルダーを適用
          blurDataURL={config === "cloudinary" ? blurImage : srcSp}
          quality={100} // クオリティを100に変更
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

export default LazyImage;
