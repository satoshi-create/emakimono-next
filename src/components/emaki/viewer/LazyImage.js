import { AppContext } from "@/pages/_app";
import { trackImageLoaded, trackImageFallback } from "@/libs/api/measurementUtils";
import Image from "next/image";
import { useContext, useEffect, useRef, useState } from "react";

// アダプティブタイムアウト: 直近の画像ロード時間からフォールバック閾値を動的算出
// 教室一斉アクセス等の帯域逼迫時に閾値が自動的に緩和される
const loadTimeSamples = []; // 直近の実測ロード時間（ms）
const MAX_SAMPLES = 8;
const TIMEOUT_MULTIPLIER = 2.5; // 平均ロード時間の2.5倍を閾値とする

// 各フォールバック種別ごとの下限・上限（ms）
const TIMEOUT_BOUNDS = {
  priority:  { min: 1500, max: 6000, fallback: 2000 },
  fullscreen: { min: 2000, max: 8000, fallback: 3000 },
  universal:  { min: 3000, max: 10000, fallback: 5000 },
};

// デバッグフラグ: 検証完了後に false にするか、本ブロックごと削除
const FB_DEBUG = true;

const recordLoadTime = (ms) => {
  loadTimeSamples.push(ms);
  if (loadTimeSamples.length > MAX_SAMPLES) loadTimeSamples.shift();
  if (FB_DEBUG) {
    const avg = loadTimeSamples.reduce((a, b) => a + b, 0) / loadTimeSamples.length;
    console.log(`[FB-DEBUG] recordLoadTime: ${ms}ms | samples(${loadTimeSamples.length}): avg=${Math.round(avg)}ms`);
  }
};

const getAdaptiveTimeout = (type) => {
  const bounds = TIMEOUT_BOUNDS[type];
  if (loadTimeSamples.length === 0) {
    if (FB_DEBUG) console.log(`[FB-DEBUG] getAdaptiveTimeout(${type}): ${bounds.fallback}ms (no samples, using fallback)`);
    return bounds.fallback;
  }
  const avg = loadTimeSamples.reduce((a, b) => a + b, 0) / loadTimeSamples.length;
  const timeout = Math.min(bounds.max, Math.max(bounds.min, Math.round(avg * TIMEOUT_MULTIPLIER)));
  if (FB_DEBUG) console.log(`[FB-DEBUG] getAdaptiveTimeout(${type}): ${timeout}ms (avg=${Math.round(avg)}ms × ${TIMEOUT_MULTIPLIER})`);
  return timeout;
};

const LazyImage = ({
  src,
  alt,
  width,
  height,
  srcSp,
  config,
  uniqueIndex,
  navIndex, // 現在表示中のシーンインデックス（フルスクリーン時のeager制御用）
  isPlayMode, // 再生モード状態
  emakiId, // 計測用: 絵巻ID
}) => {
  const { windowHeight, orientation, toggleFullscreen } =
    useContext(AppContext);

  const [isSkeletonVisible, setSkeletonVisible] = useState(true);
  const [isImageLoaded, setImageLoaded] = useState(false); // 画像読み込み完了状態（フェード用）

  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // 計測用: 読み込み開始時刻
  const loadStartTimeRef = useRef(Date.now());
  const hasTrackedRef = useRef(false); // 重複計測防止

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

  // priority 画像（最初の画像）のフォールバック処理
  // 再マウント時にキャッシュされた画像で onLoadingComplete が呼ばれない場合の対策
  useEffect(() => {
    if (uniqueIndex === 0) {
      const timeout = getAdaptiveTimeout("priority");
      if (FB_DEBUG) console.log(`[FB-DEBUG] priority timer SET: idx=${uniqueIndex}, timeout=${timeout}ms`);
      const fallbackTimer = setTimeout(() => {
        if (isSkeletonVisible) {
          if (FB_DEBUG) console.log(`[FB-DEBUG] ⚠ FALLBACK FIRED: priority_timeout | idx=${uniqueIndex}, timeout=${timeout}ms`);
          // 計測: フォールバック発火（priority画像タイムアウト）
          if (!hasTrackedRef.current && emakiId) {
            trackImageFallback(emakiId, uniqueIndex, "priority_timeout");
            hasTrackedRef.current = true;
          }
          setImageLoaded(true);
          setTimeout(() => setSkeletonVisible(false), 300);
        }
      }, timeout);
      return () => clearTimeout(fallbackTimer);
    }
  }, [uniqueIndex, isSkeletonVisible, emakiId]);

  // 全画面切替時のフォールバック処理
  // next/image の IntersectionObserver が viewport 変化に追従しない問題への対策
  // 全画面切替後、一定時間経過してもスケルトンが表示されている場合は強制的に非表示
  useEffect(() => {
    if (toggleFullscreen && isSkeletonVisible) {
      const timeout = getAdaptiveTimeout("fullscreen");
      if (FB_DEBUG) console.log(`[FB-DEBUG] fullscreen timer SET: idx=${uniqueIndex}, timeout=${timeout}ms`);
      const fallbackTimer = setTimeout(() => {
        if (isSkeletonVisible) {
          if (FB_DEBUG) console.log(`[FB-DEBUG] ⚠ FALLBACK FIRED: fullscreen_timeout | idx=${uniqueIndex}, timeout=${timeout}ms`);
          // 計測: フォールバック発火（フルスクリーン時タイムアウト）
          if (!hasTrackedRef.current && emakiId) {
            trackImageFallback(emakiId, uniqueIndex, "fullscreen_timeout");
            hasTrackedRef.current = true;
          }
          setImageLoaded(true);
          setTimeout(() => setSkeletonVisible(false), 300);
        }
      }, timeout);
      return () => clearTimeout(fallbackTimer);
    }
  }, [toggleFullscreen, isSkeletonVisible, emakiId, uniqueIndex]);

  // 全画像共通フォールバック: priority画像・全画面時以外の画像に対するセーフティネット
  // onLoadingComplete が発火しなかった場合（リクエストキャンセル、キャッシュ競合等）に
  // スケルトンが永久に表示され続ける問題を防止
  useEffect(() => {
    if (uniqueIndex === 0 || toggleFullscreen) return;

    const timeout = getAdaptiveTimeout("universal");
    if (FB_DEBUG) console.log(`[FB-DEBUG] universal timer SET: idx=${uniqueIndex}, timeout=${timeout}ms`);
    const fallbackTimer = setTimeout(() => {
      if (isSkeletonVisible) {
        if (FB_DEBUG) console.log(`[FB-DEBUG] ⚠ FALLBACK FIRED: universal_timeout | idx=${uniqueIndex}, timeout=${timeout}ms`);
        if (!hasTrackedRef.current && emakiId) {
          trackImageFallback(emakiId, uniqueIndex, "universal_timeout");
          hasTrackedRef.current = true;
        }
        setImageLoaded(true);
        setTimeout(() => setSkeletonVisible(false), 300);
      }
    }, timeout);
    return () => clearTimeout(fallbackTimer);
  }, [uniqueIndex, toggleFullscreen, isSkeletonVisible, emakiId]);

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

  // sizes 属性: ブラウザの srcSet 選択を実際の表示幅に一致させる
  // sizes 未指定時のデフォルト "100vw" では、横スクロール内の各画像の実幅と乖離し、
  // 不要なリクエストキャンセル（HAR: status 0）や二重フェッチの原因となる
  // media query を使用して SSR/クライアント間の hydration mismatch を防止
  const ratioStr = (width / height).toFixed(4);
  const imageSizes = toggleFullscreen
    ? `calc(${ratioStr} * 100vh)`
    : `(orientation: portrait) calc(${ratioStr} * 45vh), calc(${ratioStr} * 75vh)`;

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
        // 再生モード時・最初の3枚は eager loading
        // フルスクリーン時は現在シーン付近（±2枚）のみ eager（同時リクエスト抑制）
        // 全画面切替時に IntersectionObserver が viewport 変化に追従しない問題への対策
        loading={(() => {
          const isEager =
            isPlayMode ||
            uniqueIndex < 3 ||
            (toggleFullscreen && Math.abs(uniqueIndex - navIndex) <= 2);
          if (FB_DEBUG && uniqueIndex < 12) {
            console.log(`[FB-DEBUG] loading: idx=${uniqueIndex}, navIndex=${navIndex}, fullscreen=${toggleFullscreen}, playMode=${isPlayMode} → ${isEager ? "eager" : "lazy"}`);
          }
          return isEager ? "eager" : "lazy";
        })()}
        lazyBoundary="800px" // ビューポートの800px手前から読み込み開始
        layout="responsive"
        sizes={imageSizes}
        placeholder={"blur"} // ぼかしプレースホルダーを適用
        blurDataURL={PAPER_COLOR_BLUR_DATA_URL} // 絵巻の紙色（Firefox 白背景対策）
        onLoadingComplete={() => {
          // 計測: 正常読み込み完了
          const loadTimeMs = Date.now() - loadStartTimeRef.current;
          if (FB_DEBUG) console.log(`[FB-DEBUG] ✓ onLoadingComplete: idx=${uniqueIndex}, loadTime=${loadTimeMs}ms`);
          // アダプティブタイムアウト: 実測ロード時間を記録（次回以降の閾値算出に使用）
          recordLoadTime(loadTimeMs);
          if (!hasTrackedRef.current && emakiId) {
            trackImageLoaded(emakiId, uniqueIndex, loadTimeMs, "normal");
            hasTrackedRef.current = true;
          }
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
