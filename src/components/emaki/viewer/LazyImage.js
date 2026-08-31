import { AppContext } from "@/context/AppContext";
import {
  trackImageLoaded,
  trackImageLoadSlow,
} from "@/libs/api/measurementUtils";
import { recordLoadTime, getAdaptiveTimeout } from "@/libs/emakiImageLoading/adaptiveTimeout";
import {
  FB_DEBUG,
  SKELETON_FADE_OUT_MS,
} from "@/libs/emakiImageLoading/constants";
import { isEagerForNextImageLoading } from "@/libs/emakiImageLoading/eagerPolicy";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import useImageLoadFallback from "@/hooks/emaki/useImageLoadFallback";
import Image from "next/image";
import { memo, useContext, useRef, useState } from "react";

const LazyImage = ({
  src,
  alt,
  width,
  height,
  config,
  uniqueIndex,
  navIndex, // 現在表示中のシーンインデックス（フルスクリーン時のeager制御用）
  sceneIndex, // 先読み用（未指定時は navIndex）
  isPlayMode, // 再生モード状態
  emakiId, // 計測用: 絵巻ID
}) => {
  const { orientation, toggleFullscreen } = useContext(AppContext);
  const prefetchIndex = sceneIndex ?? navIndex;

  const [isSkeletonVisible, setSkeletonVisible] = useState(true);
  const [isImageLoaded, setImageLoaded] = useState(false);

  const containerRef = useRef(null);
  const loadStartTimeRef = useRef(Date.now());
  const hasTrackedRef = useRef(false);

  const eagerContext = {
    uniqueIndex,
    prefetchIndex,
    isPlayMode,
    toggleFullscreen,
  };
  const isEager = isEagerForNextImageLoading(eagerContext);

  useImageLoadFallback({
    containerRef,
    uniqueIndex,
    prefetchIndex,
    isPlayMode,
    toggleFullscreen,
    isSkeletonVisible,
    emakiId,
    loadStartTimeRef,
    hasTrackedRef,
    setImageLoaded,
    setSkeletonVisible,
  });

  const PAPER_COLOR_BLUR_DATA_URL =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%23f5f0e6' width='1' height='1'/%3E%3C/svg%3E";

  const cloudinaryLoader = ({ src, width: w }) =>
    buildCloudinaryUrl(src, [`w_${w}`, "f_auto", "q_auto:eco"]);

  const getResponsiveHeightVar = (full, ori) => {
    if (full) return "var(--vh-100)";
    if (ori === "landscape") return "var(--vh-75)";
    if (ori === "portrait") return "var(--vh-45)";
    return "var(--vh-75)";
  };

  const ratioStr = (width / height).toFixed(4);
  const imageSizes = toggleFullscreen
    ? `calc(${ratioStr} * 100vh)`
    : `(orientation: portrait) calc(${ratioStr} * 45vh), calc(${ratioStr} * 75vh)`;

  return (
    <div
      className={`image-wrapper`}
      style={{
        width: `calc(${width / height} * ${getResponsiveHeightVar(toggleFullscreen, orientation)})`,
        height: "100%",
        position: "relative",
        backgroundColor: "#f5f0e6",
      }}
      ref={containerRef}
    >
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
        loader={config === "cloudinary" ? cloudinaryLoader : undefined}
        src={src.src}
        width={width}
        height={height}
        alt={alt}
        priority={uniqueIndex === 0}
        loading={isEager ? "eager" : "lazy"}
        lazyBoundary={isPlayMode ? "2400px" : "800px"}
        layout="responsive"
        sizes={imageSizes}
        placeholder="blur"
        blurDataURL={PAPER_COLOR_BLUR_DATA_URL}
        onLoadingComplete={() => {
          const loadTimeMs = Date.now() - loadStartTimeRef.current;
          if (FB_DEBUG) {
            console.log(
              `[FB-DEBUG] ✓ onLoadingComplete: idx=${uniqueIndex}, loadTime=${loadTimeMs}ms`
            );
          }
          recordLoadTime(loadTimeMs);
          if (!hasTrackedRef.current && emakiId) {
            trackImageLoaded(emakiId, uniqueIndex, loadTimeMs, "normal");
            const thresholdType = toggleFullscreen ? "fullscreen" : "universal";
            const threshold = getAdaptiveTimeout(thresholdType, emakiId);
            trackImageLoadSlow(
              emakiId,
              uniqueIndex,
              loadTimeMs,
              threshold,
              toggleFullscreen,
              isEager ? "eager" : "lazy"
            );
            hasTrackedRef.current = true;
          }
          setImageLoaded(true);
          setTimeout(() => setSkeletonVisible(false), SKELETON_FADE_OUT_MS);
        }}
        className="image loaded"
      />
      <style jsx global>{`
        .imageWrapper {
          position: relative;
          flex-shrink: 0;
          height: 100%;
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
          z-index: 2;
          background-color: #f5f0e6;
          aspect-ratio: ${width} / ${height};
        }
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
        .image.loading {
          opacity: 0;
        }
        .image.loaded {
          opacity: 1;
          transition: opacity 0.4s ease;
        }
      `}</style>
    </div>
  );
};

const areLazyImagePropsEqual = (prev, next) =>
  prev.uniqueIndex === next.uniqueIndex &&
  prev.navIndex === next.navIndex &&
  prev.sceneIndex === next.sceneIndex &&
  prev.isPlayMode === next.isPlayMode &&
  prev.emakiId === next.emakiId &&
  prev.src === next.src;

export default memo(LazyImage, areLazyImagePropsEqual);
