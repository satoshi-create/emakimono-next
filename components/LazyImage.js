import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { AppContext } from "../pages/_app";

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

  const { orientation, toggleFullscreen } =
    useContext(AppContext);

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
          src={src}
          layout="fill"
          objectFit="cover"
          alt={alt}
          sizes="(max-height: 375px) 375px, (max-height: 800px) 800px, 1080px"
          priority={index === 0} // 最初の1枚だけ優先的に読み込み
          loading={index < 2 ? "eager" : "lazy"} // 最初の2枚だけ遅延読み込みを無効化
          placeholder={index < 2 ? "blur" : undefined} // 最初の2枚だけぼかしプレースホルダーを適用
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
          // quality={100} // クオリティを100に変更
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
