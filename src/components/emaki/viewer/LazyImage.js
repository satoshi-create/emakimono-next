import { AppContext } from "@/context/AppContext";
import { trackImageLoaded, trackImageFallback, trackImageLoadSlow } from "@/libs/api/measurementUtils";
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
const FB_DEBUG = false;

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
  config,
  uniqueIndex,
  navIndex, // 現在表示中のシーンインデックス（フルスクリーン時のeager制御用）
  isPlayMode, // 再生モード状態
  emakiId, // 計測用: 絵巻ID
}) => {
  const { orientation, toggleFullscreen } = useContext(AppContext);

  const [isSkeletonVisible, setSkeletonVisible] = useState(true);
  const [isImageLoaded, setImageLoaded] = useState(false); // 画像読み込み完了状態（フェード用）

  const containerRef = useRef(null);

  // 計測用: 読み込み開始時刻
  const loadStartTimeRef = useRef(Date.now());
  const hasTrackedRef = useRef(false); // 重複計測防止

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
  //
  // 重要: eager画像（navIndex±2）は即座にタイマー開始、
  // それ以外のlazy画像はビューポート進入を検出してからタイマー開始
  // （universal_timeout と同じパターン）
  useEffect(() => {
    if (!toggleFullscreen || !isSkeletonVisible) return;
    const el = containerRef.current;
    if (!el) return;

    let fallbackTimer = null;
    let observed = false;

    // フルスクリーン時のeager判定: navIndex±2 または 再生中は先読み8枚
    const isEagerInFullscreen =
      (isPlayMode && uniqueIndex <= navIndex + 8) ||
      Math.abs(uniqueIndex - navIndex) <= 2;

    const startFallbackTimer = () => {
      loadStartTimeRef.current = Date.now();
      const timeout = getAdaptiveTimeout("fullscreen");
      if (FB_DEBUG) console.log(`[FB-DEBUG] fullscreen timer SET: idx=${uniqueIndex}, timeout=${timeout}ms, eager=${isEagerInFullscreen}`);
      fallbackTimer = setTimeout(() => {
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
    };

    if (isEagerInFullscreen) {
      // eager画像: 即座にタイマー開始
      startFallbackTimer();
    } else {
      // lazy画像: IntersectionObserver でビューポート進入を検出してからタイマー開始
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !observed) {
            observed = true;
            startFallbackTimer();
            observer.disconnect();
          }
        },
        { rootMargin: "800px" }
      );
      observer.observe(el);
      return () => {
        observer.disconnect();
        if (fallbackTimer) clearTimeout(fallbackTimer);
      };
    }

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [toggleFullscreen, isSkeletonVisible, emakiId, uniqueIndex, navIndex, isPlayMode]);

  // 全画像共通フォールバック: priority画像・全画面時以外の画像に対するセーフティネット
  // onLoadingComplete が発火しなかった場合（リクエストキャンセル、キャッシュ競合等）に
  // スケルトンが永久に表示され続ける問題を防止
  //
  // 重要: タイマーはマウント時ではなく、画像がビューポート付近に入った（＝ロード開始）時点から開始
  // lazy画像はマウント後もビューポート外にあり、リクエストが始まっていないため
  // マウント時からカウントすると不要なfallbackが大量発生する
  useEffect(() => {
    if (uniqueIndex === 0 || toggleFullscreen) return;
    const el = containerRef.current;
    if (!el) return;

    let fallbackTimer = null;
    let observed = false;

    // eager画像（uniqueIndex < 3）はマウント時にすでにリクエスト開始済みなので即タイマー設定
    // 再生中は先読み8枚のみ eager 扱い（一斉ロードを防ぐ）
    const isEager =
      uniqueIndex < 3 || (isPlayMode && uniqueIndex <= navIndex + 8);

    const startFallbackTimer = () => {
      // ロード開始時刻を「今」にリセット（ビューポート進入 = ロード開始）
      loadStartTimeRef.current = Date.now();
      const timeout = getAdaptiveTimeout("universal");
      if (FB_DEBUG) console.log(`[FB-DEBUG] universal timer SET (viewport enter): idx=${uniqueIndex}, timeout=${timeout}ms`);
      fallbackTimer = setTimeout(() => {
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
    };

    if (isEager) {
      // eager画像: 即座にタイマー開始
      startFallbackTimer();
    } else {
      // lazy画像: IntersectionObserver でビューポート進入を検出してからタイマー開始
      // rootMargin は lazyBoundary (800px) と同じにし、ロード開始タイミングと同期
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !observed) {
            observed = true;
            startFallbackTimer();
            observer.disconnect();
          }
        },
        { rootMargin: "800px" }
      );
      observer.observe(el);
      return () => {
        observer.disconnect();
        if (fallbackTimer) clearTimeout(fallbackTimer);
      };
    }

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [uniqueIndex, toggleFullscreen, isSkeletonVisible, emakiId, isPlayMode]);

  const baseUrl =
    "https://res.cloudinary.com/dw2gjxrrf/image/upload/fl_progressive";

  // 絵巻の紙色（#f5f0e6）。Firefox の白背景フラッシュ対策（外部 blur URL は使わない）
  const PAPER_COLOR_BLUR_DATA_URL =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%23f5f0e6' width='1' height='1'/%3E%3C/svg%3E";

  const cloudinaryLoader = ({ src, width }) => {
    // f_auto/q_auto はスラッシュ区切りの別コンポーネントで指定する（Cloudinary 公式推奨。
    // カンマ区切り f_auto,q_auto は推奨されず、画像によっては最適形式が選ばれない）
    // dpr_auto は付けない: next/image の srcset が devicePixelRatio を考慮して候補を選ぶため、
    // w_×dpr の二重拡大による過大な配信を防ぐ
    return `${baseUrl},w_${width}/f_auto/q_auto/${src}`;
  };

  // CSS custom property を使用してモバイルブラウザの dvh に対応
  // dvh (dynamic viewport height) はモバイルの URL バー表示/非表示に追従
  const getResponsiveHeightVar = (full, ori) => {
    if (full) {
      return "var(--vh-100)"; // 全画面は向きを問わず 100vh（portrait でもヘッダー類を非表示にするため）
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
        // 再生モード時は現在位置から先読み8枚のみ eager（一斉ロードによる帯域逼迫を防ぐ）
        // フルスクリーン時は現在シーン付近（±2枚）のみ eager（同時リクエスト抑制）
        // 全画面切替時に IntersectionObserver が viewport 変化に追従しない問題への対策
        loading={(() => {
          const lookahead = isPlayMode ? 8 : 2;
          const isEager =
            uniqueIndex < 3 ||
            (isPlayMode && uniqueIndex <= navIndex + lookahead) ||
            (toggleFullscreen && Math.abs(uniqueIndex - navIndex) <= 2);
          if (FB_DEBUG && uniqueIndex < 12) {
            console.log(`[FB-DEBUG] loading: idx=${uniqueIndex}, navIndex=${navIndex}, fullscreen=${toggleFullscreen}, playMode=${isPlayMode} → ${isEager ? "eager" : "lazy"}`);
          }
          return isEager ? "eager" : "lazy";
        })()}
        // 自動再生中は先読みを広げてロード開始を早める（表示直前に完了させる）
        // navIndex 固定（再生中はシーン検出の state 更新を止めている）でも、
        // lazyBoundary を拡大することで lazy 画像が十分前にリクエストされる
        lazyBoundary={isPlayMode ? "2400px" : "800px"} // ビューポートの手前から読み込み開始
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
            // 計測: 遅延検出（fallback未到達だが閾値70%超の画像）
            const thresholdType = toggleFullscreen ? "fullscreen" : "universal";
            const threshold = getAdaptiveTimeout(thresholdType);
            const lookahead = isPlayMode ? 8 : 2;
            const isEager =
              uniqueIndex < 3 ||
              (isPlayMode && uniqueIndex <= navIndex + lookahead) ||
              (toggleFullscreen && Math.abs(uniqueIndex - navIndex) <= 2);
            trackImageLoadSlow(emakiId, uniqueIndex, loadTimeMs, threshold, toggleFullscreen, isEager ? "eager" : "lazy");
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
        /* 初期状態：透明（大型絵巻画像への blur はペイントコストが高く、
           自動再生中に複数画像が同時ロード完了するとフレーム落ちの原因になるため
           opacity フェードのみで表現する） */
        .image.loading {
          opacity: 0;
        }

        /* 読み込み完了後：なめらかにフェードイン */
        .image.loaded {
          opacity: 1;
          transition: opacity 0.4s ease;
        }
      `}</style>
    </div>
  );
};

export default LazyImage;
