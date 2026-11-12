import { AppContext } from "@/context/AppContext";
import {
  trackImageFallback,
  trackImageLoaded,
  trackImageLoadSlow,
} from "@/libs/api/measurementUtils";
import {
  EMAKI_IMAGE_MAX_WIDTH,
} from "@/libs/constants/viewerPlayback";
import {
  getManualLookahead,
  isEagerLoad,
} from "@/libs/viewer/imageEagerPolicy";
import {
  IMAGE_LOAD_DEBUG,
  logImageLoadEnd,
  logImageLoadQueue,
  logImageLoadStart,
} from "@/libs/viewer/imageLoadDebug";
import {
  getAdaptiveTimeout,
  recordLoadTime,
} from "@/libs/viewer/imageLoadTimeout";
import {
  isHydratedImageKey,
  registerHydratedImageKey,
} from "@/libs/viewer/imageHydration";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import styles from "@/styles/LazyImage.module.css";
import Image from "next/image";
import { useContext, useEffect, useRef, useState } from "react";

// =============================================================================
// デバッグスイッチ
// 検証完了後は false にすることで、すべてのコンソール出力を一括で停止できます。
// （本コンポーネント固有ログ用。集約ログは imageLoadDebug.js の IMAGE_LOAD_DEBUG）
// =============================================================================
const DEBUG_IMAGE_LOAD = false;

function logDebug(tag, ...args) {
  if (!DEBUG_IMAGE_LOAD) return;
  const time = performance.now().toFixed(1);
  console.log(`%c[${time}ms][${tag}]`, "color: #3b82f6; font-weight: bold;", ...args);
}

const PAPER_COLOR_BLUR_DATA_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%23f5f0e6' width='1' height='1'/%3E%3C/svg%3E";

const LazyImage = ({
  src,
  alt,
  width,
  height,
  config,
  uniqueIndex,
  navIndex,
  sceneIndex,
  isPlayMode,
  emakiId,
  isByobu,
}) => {
  const { toggleFullscreen } = useContext(AppContext);
  const prefetchIndex = sceneIndex ?? navIndex;

  // ---------------------------------------------------------------------------
  // [フロー 1] マウント・ハイドレーション済み判定
  // emakiId がある場合は emakiId:uniqueIndex。欠落時は src でキー化する。
  // ---------------------------------------------------------------------------
  const hydrateKey =
    emakiId != null && uniqueIndex != null
      ? `${emakiId}:${uniqueIndex}`
      : src?.src || null;
  const alreadyHydrated = isHydratedImageKey(hydrateKey);

  // ---------------------------------------------------------------------------
  // 1. 状態管理（State）
  // ---------------------------------------------------------------------------
  const [isSkeletonVisible, setSkeletonVisible] = useState(!alreadyHydrated);
  const [isImageLoaded, setImageLoaded] = useState(alreadyHydrated);
  const [retryCount, setRetryCount] = useState(0);

  // ---------------------------------------------------------------------------
  // 2. 参照管理（Refs）- 再レンダリングをトリガーしない値の保持
  // ---------------------------------------------------------------------------
  const containerRef = useRef(null);
  const retryTimerRef = useRef(null);
  const isImageLoadedRef = useRef(alreadyHydrated);
  const loadStartTimeRef = useRef(null);
  const hasTrackedRef = useRef(false);
  const loadStartLoggedRef = useRef(false);

  const imageUrl = src?.src ?? null;
  const manualLookahead = getManualLookahead(emakiId);

  useEffect(() => {
    isImageLoadedRef.current = isImageLoaded;
  }, [isImageLoaded]);

  useEffect(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setRetryCount(0);
  }, [imageUrl, uniqueIndex]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // [計算関数] 計測起点の一本化（二重呼び出しは loadStartLoggedRef で防止）
  // ---------------------------------------------------------------------------
  const resetLoadStartTime = () => {
    loadStartTimeRef.current = Date.now();
  };

  const markLoadStart = () => {
    if (loadStartLoggedRef.current) return;
    loadStartLoggedRef.current = true;
    resetLoadStartTime();
    if (emakiId) {
      logImageLoadStart(emakiId, uniqueIndex, imageUrl, hydrateKey);
    }
    logDebug("LazyImage:LoadStart", {
      uniqueIndex,
      emakiId: emakiId ?? null,
      hydrateKey,
    });
  };

  const evaluateIsEager = () =>
    isEagerLoad(
      uniqueIndex,
      prefetchIndex,
      isPlayMode,
      toggleFullscreen,
      manualLookahead
    );

  // ---------------------------------------------------------------------------
  // [フロー 2] 先読み（isEagerLoad）成立時の計測開始トリガー
  // eager / priority 時は実ネットワーク開始に合わせて計測起点を置き、IO 待ちを loadTime に含めない。
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isSkeletonVisible) return;
    if (!evaluateIsEager()) return;
    markLoadStart();
  }, [
    uniqueIndex,
    prefetchIndex,
    isPlayMode,
    toggleFullscreen,
    manualLookahead,
    isSkeletonVisible,
  ]);

  useEffect(() => {
    if (!IMAGE_LOAD_DEBUG || !emakiId) return;
    if (evaluateIsEager() && isSkeletonVisible) {
      logImageLoadQueue();
    }
  }, [
    emakiId,
    uniqueIndex,
    prefetchIndex,
    isPlayMode,
    toggleFullscreen,
    manualLookahead,
    isSkeletonVisible,
  ]);

  // ---------------------------------------------------------------------------
  // [フロー 3] IntersectionObserver 進入とフォールバックタイマー制御
  // IO 進入時に未完了なら markLoadStart（eager 未計測の lazy 経路）。完了済みはスキップ。
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isSkeletonVisible) return;
    const el = containerRef.current;
    if (!el) return;

    const timeoutType =
      uniqueIndex === 0
        ? "priority"
        : toggleFullscreen
        ? "fullscreen"
        : "universal";
    const fallbackReason = `${timeoutType}_timeout`;

    let fallbackTimer = null;

    const startFallbackTimer = () => {
      if (isImageLoadedRef.current) return;
      markLoadStart();
      const timeout = getAdaptiveTimeout(timeoutType, emakiId);
      fallbackTimer = setTimeout(() => {
        if (!hasTrackedRef.current && emakiId) {
          trackImageFallback(emakiId, uniqueIndex, fallbackReason);
          hasTrackedRef.current = true;
        }
        if (emakiId) {
          const start = loadStartTimeRef.current ?? Date.now();
          const loadTimeMs = Math.max(0, Date.now() - start);
          logImageLoadEnd({
            emakiId,
            imageIndex: uniqueIndex,
            url: imageUrl,
            loadTimeMs,
            status: "fallback",
            fallbackReason,
            queueKey: hydrateKey,
            releaseInFlight: false,
          });
        }
      }, timeout);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          startFallbackTimer();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [isSkeletonVisible, uniqueIndex, toggleFullscreen, emakiId]);

  // ---------------------------------------------------------------------------
  // [計算関数] Cloudinary loader と responsive sizes
  // ---------------------------------------------------------------------------
  const cloudinaryLoader = ({ src: loaderSrc, width: loaderWidth, quality }) => {
    const requestWidth = isByobu
      ? loaderWidth
      : Math.min(loaderWidth, EMAKI_IMAGE_MAX_WIDTH);
    return buildCloudinaryUrl(loaderSrc, [
      "c_limit",
      `w_${requestWidth}`,
      "f_auto",
      isByobu && quality ? `q_${quality}` : "q_auto:eco",
    ]);
  };

  const ratioStr = (width / height).toFixed(4);
  const portraitSizes = isByobu
    ? `max(calc(${ratioStr} * 45vh), 320px)`
    : `calc(${ratioStr} * 45vh)`;
  const landscapeSizes = isByobu
    ? `max(calc(${ratioStr} * 75vh), 480px)`
    : `calc(${ratioStr} * 75vh)`;
  const imageSizes = toggleFullscreen
    ? isByobu
      ? `calc(${ratioStr} * 100vh)`
      : `(orientation: portrait) ${portraitSizes}, ${landscapeSizes}`
    : `(orientation: portrait) ${portraitSizes}, ${landscapeSizes}`;

  const isEager = evaluateIsEager();

  return (
    <div
      className={styles.wrapper}
      style={{
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        minWidth: 0,
      }}
      ref={containerRef}
    >
      {isSkeletonVisible && !isImageLoaded && (
        <div
          className={styles.skeleton}
          style={{
            aspectRatio: `${width} / ${height}`,
          }}
        />
      )}
      <Image
        key={`${hydrateKey ?? imageUrl}:${retryCount}`}
        loader={config === "cloudinary" ? cloudinaryLoader : undefined}
        src={src.src}
        width={width}
        height={height}
        alt={alt}
        priority={uniqueIndex === 0}
        loading={isEager ? "eager" : "lazy"}
        lazyBoundary={isPlayMode ? "2400px" : "1600px"}
        layout="responsive"
        sizes={imageSizes}
        quality={toggleFullscreen ? 92 : 85}
        placeholder={alreadyHydrated ? "empty" : "blur"}
        blurDataURL={alreadyHydrated ? undefined : PAPER_COLOR_BLUR_DATA_URL}
        onLoadStart={() => {
          resetLoadStartTime();
          logDebug("ImageLoad:NativeStart", { uniqueIndex });
        }}
        onLoadingComplete={() => {
          // -------------------------------------------------------------------
          // [フロー 4] 画像ロード完了（onLoadingComplete）— 計測・GA4（emakiId ありのみ）
          // -------------------------------------------------------------------
          const start = loadStartTimeRef.current ?? Date.now();
          const loadTimeMs = Math.max(0, Date.now() - start);
          if (hydrateKey) registerHydratedImageKey(hydrateKey);
          if (emakiId) recordLoadTime(loadTimeMs);
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
          if (emakiId) {
            const thresholdType =
              uniqueIndex === 0
                ? "priority"
                : toggleFullscreen
                ? "fullscreen"
                : "universal";
            const threshold = getAdaptiveTimeout(thresholdType, emakiId);
            const debugStatus =
              loadTimeMs >= threshold * 0.7 ? "slow" : "success";
            logImageLoadEnd({
              emakiId,
              imageIndex: uniqueIndex,
              url: imageUrl,
              loadTimeMs,
              status: debugStatus,
              queueKey: hydrateKey,
            });
          }
          setImageLoaded(true);
          setSkeletonVisible(false);
        }}
        onError={() => {
          // -------------------------------------------------------------------
          // [フロー 4] エラー（onError）— 1回自動リトライ後のみフォールバック計測
          // -------------------------------------------------------------------
          if (retryCount < 1) {
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            resetLoadStartTime();
            retryTimerRef.current = setTimeout(() => {
              retryTimerRef.current = null;
              setRetryCount((prev) => prev + 1);
            }, 500);
            return;
          }
          if (!hasTrackedRef.current && emakiId) {
            trackImageFallback(emakiId, uniqueIndex, "load_error");
            hasTrackedRef.current = true;
          }
          if (emakiId) {
            const start = loadStartTimeRef.current ?? Date.now();
            const loadTimeMs = Math.max(0, Date.now() - start);
            logImageLoadEnd({
              emakiId,
              imageIndex: uniqueIndex,
              url: imageUrl,
              loadTimeMs,
              status: "fallback",
              fallbackReason: "load_error",
              queueKey: hydrateKey,
            });
          }
        }}
        className={styles.imageReady}
      />
    </div>
  );
};

export default LazyImage;
