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

export default LazyImage;
