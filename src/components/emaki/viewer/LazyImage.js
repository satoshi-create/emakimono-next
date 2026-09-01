import { AppContext } from "@/context/AppContext";
import { useEmakiViewerPlayback } from "@/context/EmakiViewerPlaybackContext";
import {
  trackImageLoaded,
  trackImageLoadSlow,
} from "@/libs/api/measurementUtils";
import {
  PLAYBACK_IMAGE_LOOKAHEAD,
  PLAYBACK_LAZY_BOUNDARY_NORMAL,
  PLAYBACK_LAZY_BOUNDARY_PLAY,
} from "@/libs/constants/viewerPlayback";
import { recordLoadTime, getAdaptiveTimeout } from "@/libs/emakiImageLoading/adaptiveTimeout";
import { FB_DEBUG } from "@/libs/emakiImageLoading/constants";
import { isEagerForNextImageLoading } from "@/libs/emakiImageLoading/eagerPolicy";
import {
  applyImageLoadVisualComplete,
} from "@/libs/emakiImageLoading/imageLoadVisual";
import { createEmakiCloudinaryLoader } from "@/libs/emakiImageLoading/deliveryUrl";
import {
  buildPlaybackImageUrl,
  isPlaybackImageDecoded,
  waitForPlaybackDecode,
} from "@/libs/emakiImageLoading/playbackPreload";
import useImageLoadFallback from "@/hooks/emaki/useImageLoadFallback";
import Image from "next/image";
import { memo, useContext, useEffect, useRef, useState } from "react";

/** 再生中: preload decode 済み URL を next/image layout=responsive と同構造で表示 */
const PlaybackDirectImage = ({ url, alt, width, height }) => (
  <span
    className="playback-direct-wrap"
    style={{ paddingBottom: `${(height / width) * 100}%` }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={url}
      alt={alt}
      decoding="async"
      className="image loaded playback-direct"
    />
  </span>
);

const PAPER_COLOR_PLACEHOLDER_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%23f5f0e6' width='1' height='1'/%3E%3C/svg%3E";

const runWhenIdle = (fn) => {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(fn, { timeout: 2000 });
  } else {
    setTimeout(fn, 0);
  }
};

const LazyImage = ({
  src,
  alt,
  width,
  height,
  config,
  uniqueIndex,
  navIndex, // 現在表示中のシーンインデックス（フルスクリーン時のeager制御用）
  sceneIndex, // 手動スクロール時の先読み用（再生中は prefetchSceneIndexRef）
  emakiId, // 計測用: 絵巻ID
}) => {
  const { orientation, toggleFullscreen } = useContext(AppContext);
  const {
    isPlayModeRef,
    prefetchSceneIndexRef,
    playbackSyncTick,
    subscribePlaybackEager,
  } = useEmakiViewerPlayback();
  const isPlayMode = isPlayModeRef.current;
  const prefetchIndex = isPlayMode
    ? prefetchSceneIndexRef.current
    : sceneIndex ?? navIndex;

  const [isSkeletonVisible, setSkeletonVisible] = useState(true);
  const [isImageLoaded, setImageLoaded] = useState(false);

  const containerRef = useRef(null);
  const loadStartTimeRef = useRef(Date.now());
  const hasTrackedRef = useRef(false);
  const playbackVisualAppliedRef = useRef(false);

  const isEager = isEagerForNextImageLoading({
    uniqueIndex,
    prefetchIndex,
    isPlayMode,
    toggleFullscreen,
  });

  // 先読み index 更新時: 自分の eager 境界が変わった場合のみ局部再描画する。
  // subscribePlaybackEager 登録 → notifyPlaybackEagerSubscribers から (old, new) を受ける
  const [playbackScanTick, setPlaybackScanTick] = useState(0);

  useEffect(() => {
    if (!subscribePlaybackEager) return undefined;
    return subscribePlaybackEager((oldIndex, newIndex) => {
      // uniqueIndex が「移動後の eager 窓」に入る・外れる瞬間を捉える
      const nowInWindow =
        uniqueIndex >= newIndex &&
        uniqueIndex <= newIndex + PLAYBACK_IMAGE_LOOKAHEAD;
      const wasInWindow =
        uniqueIndex >= oldIndex &&
        uniqueIndex <= oldIndex + PLAYBACK_IMAGE_LOOKAHEAD;
      if (nowInWindow !== wasInWindow) {
        setPlaybackScanTick((t) => t + 1);
      }
    });
  }, [subscribePlaybackEager, uniqueIndex]);

  useImageLoadFallback({
    containerRef,
    uniqueIndex,
    prefetchSceneIndexRef,
    isPlayModeRef,
    toggleFullscreen,
    isSkeletonVisible,
    emakiId,
    loadStartTimeRef,
    hasTrackedRef,
    setImageLoaded,
    setSkeletonVisible,
  });

  // 再生停止時: 再生中にロード済みだった画像のスケルトン state を同期
  useEffect(() => {
    if (!isSkeletonVisible) return;
    const img = containerRef.current?.querySelector("img");
    if (!img?.complete || img.naturalWidth === 0) return;
    setImageLoaded(true);
    setSkeletonVisible(false);
  }, [playbackSyncTick, isSkeletonVisible]);

  const cloudinaryLoader =
    config === "cloudinary" ? createEmakiCloudinaryLoader() : undefined;
  const useBlurPlaceholder = uniqueIndex === 0;

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

  const shouldUsePlaybackImg = isPlayMode && config === "cloudinary";
  const playbackShowImg = shouldUsePlaybackImg && isEager;
  const playbackUrl = playbackShowImg
    ? buildPlaybackImageUrl(
        { src: src.src, srcWidth: width, srcHeight: height },
        { toggleFullscreen, orientation }
      )
    : null;

  const [playbackDecodeReady, setPlaybackDecodeReady] = useState(() =>
    playbackUrl ? isPlaybackImageDecoded(playbackUrl) : false
  );

  useEffect(() => {
    if (!playbackUrl) {
      setPlaybackDecodeReady(false);
      return undefined;
    }
    if (isPlaybackImageDecoded(playbackUrl)) {
      setPlaybackDecodeReady(true);
      return undefined;
    }
    setPlaybackDecodeReady(false);
    let cancelled = false;
    waitForPlaybackDecode(playbackUrl).then(() => {
      if (!cancelled) setPlaybackDecodeReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [playbackUrl, playbackSyncTick, playbackScanTick]);

  useEffect(() => {
    playbackVisualAppliedRef.current = false;
  }, [playbackUrl]);

  const showPlaybackDirect =
    playbackShowImg && playbackUrl && playbackDecodeReady;

  useEffect(() => {
    if (!showPlaybackDirect || playbackVisualAppliedRef.current) return;
    playbackVisualAppliedRef.current = true;

    const loadTimeMs = Date.now() - loadStartTimeRef.current;
    if (FB_DEBUG) {
      console.log(
        `[FB-DEBUG] ✓ playback decode: idx=${uniqueIndex}, loadTime=${loadTimeMs}ms`
      );
    }
    recordLoadTime(loadTimeMs);
    runWhenIdle(() => {
      if (!hasTrackedRef.current && emakiId) {
        trackImageLoaded(emakiId, uniqueIndex, loadTimeMs, "playback");
        hasTrackedRef.current = true;
      }
    });
    applyImageLoadVisualComplete({
      isPlayModeRef,
      isSkeletonVisible,
      setImageLoaded,
      setSkeletonVisible,
    });
  }, [showPlaybackDirect, uniqueIndex, emakiId, isPlayModeRef, isSkeletonVisible]);

  const handleNextImageComplete = () => {
    const loadTimeMs = Date.now() - loadStartTimeRef.current;
    if (FB_DEBUG) {
      console.log(
        `[FB-DEBUG] ✓ onLoadingComplete: idx=${uniqueIndex}, loadTime=${loadTimeMs}ms`
      );
    }
    recordLoadTime(loadTimeMs);
    runWhenIdle(() => {
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
    });
    applyImageLoadVisualComplete({
      isPlayModeRef,
      isSkeletonVisible,
      setImageLoaded,
      setSkeletonVisible,
    });
  };

  return (
    <div
      className={`image-wrapper`}
      style={{
        width: `calc(${width / height} * ${getResponsiveHeightVar(toggleFullscreen, orientation)})`,
        height: "100%",
        position: "relative",
        backgroundColor: "#f5f0e6",
        contain: "layout paint",
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
      {showPlaybackDirect ? (
        <PlaybackDirectImage
          url={playbackUrl}
          alt={alt}
          width={width}
          height={height}
        />
      ) : shouldUsePlaybackImg ? (
        null
      ) : (
        <Image
          loader={cloudinaryLoader}
          src={src.src}
          width={width}
          height={height}
          alt={alt}
          priority={uniqueIndex === 0}
          loading={isEager ? "eager" : "lazy"}
          lazyBoundary={
            isPlayMode ? PLAYBACK_LAZY_BOUNDARY_PLAY : PLAYBACK_LAZY_BOUNDARY_NORMAL
          }
          layout="responsive"
          sizes={imageSizes}
          placeholder={useBlurPlaceholder ? "blur" : "empty"}
          blurDataURL={
            useBlurPlaceholder ? PAPER_COLOR_PLACEHOLDER_URL : undefined
          }
          onLoadingComplete={handleNextImageComplete}
          className="image loaded"
        />
      )}
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
        :global(article[data-playback-active]) .skeleton {
          opacity: 0;
          visibility: hidden;
          transition: none;
        }
        :global(article[data-playback-active]) .image.loaded {
          opacity: 1;
          transition: none;
        }
        /* next/image layout=responsive と同じ span + absolute img */
        .image-wrapper :global(span.playback-direct-wrap) {
          display: block !important;
          overflow: hidden;
          position: relative;
          width: 100%;
          box-sizing: border-box;
          margin: 0;
        }
        .image-wrapper :global(img.playback-direct) {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          display: block;
          border: none;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};

const areLazyImagePropsEqual = (prev, next) =>
  prev.uniqueIndex === next.uniqueIndex &&
  prev.navIndex === next.navIndex &&
  prev.sceneIndex === next.sceneIndex &&
  prev.emakiId === next.emakiId &&
  prev.src === next.src;

export default memo(LazyImage, areLazyImagePropsEqual);
