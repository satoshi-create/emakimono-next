import { AppContext } from "@/context/AppContext";
import { trackImageLoaded, trackImageFallback, trackImageLoadSlow } from "@/libs/api/measurementUtils";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import { PLAYBACK_IMAGE_LOOKAHEAD } from "@/libs/constants/viewerPlayback";
import styles from "@/styles/LazyImage.module.css";
import Image from "next/image";
import { useContext, useEffect, useRef, useState } from "react";

// アダプティブタイムアウト: 直近の画像ロード時間からフォールバック閾値を動的算出
// 教室一斉アクセス等の帯域逼迫時に閾値が自動的に緩和される
const loadTimeSamples = []; // 直近の実測ロード時間（ms）
const MAX_SAMPLES = 8;
const TIMEOUT_MULTIPLIER = 2.5; // 平均ロード時間の2.5倍を閾値とする

// P3-c: 絵巻別タイムアウト倍率 — cloudinary-breakdown.json の avg_kb に基づく
const PER_EMAKI_TIMEOUT = {
  "jigokusoushi-genke": 1.5,   // avg 1719KB / max 2890KB — 重量級
  "kuso-zu-emaki": 1.2,        // avg 838KB
  "eshi-no-soshi": 1.2,        // avg 716KB
  "gakisoushi-kawamoto": 1.2,  // avg 651KB
};

// P1-a: Fast Origin Transfer 逼迫を考慮し max を 1.3〜1.5倍に拡大
const TIMEOUT_BOUNDS = {
  priority:  { min: 1500, max: 8000, fallback: 2500 },
  fullscreen: { min: 2000, max: 10000, fallback: 3500 },
  universal:  { min: 3000, max: 12000, fallback: 5500 },
};

// P1-c: 接続種別による分岐 (navigator.connection?.effectiveType)
const getConnectionMultiplier = () => {
  if (typeof navigator === "undefined") return 1;
  const conn = navigator.connection?.effectiveType;
  if (!conn) return 1;
  if (conn === "slow-2g") return 2.5;
  if (conn === "2g") return 1.8;
  if (conn === "3g") return 1.3;
  return 1; // 4g / unknown
};

// P3-b: localStorage 永続化キー — ページ遷移後もサンプルを維持
const STORAGE_KEY = "emaki_load_time_samples";
try {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      loadTimeSamples.push(...parsed.slice(-MAX_SAMPLES));
    }
  }
} catch (e) { /* Storage 未対応環境は無視 */ }

// デバッグフラグ: 検証完了後に false にするか、本ブロックごと削除
const FB_DEBUG = false;

const recordLoadTime = (ms) => {
  loadTimeSamples.push(ms);
  if (loadTimeSamples.length > MAX_SAMPLES) loadTimeSamples.shift();
  // P3-b: localStorage に永続化
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadTimeSamples));
  } catch (e) { /* Storage 未対応環境は無視 */ }
  if (FB_DEBUG) {
    const avg = loadTimeSamples.reduce((a, b) => a + b, 0) / loadTimeSamples.length;
    console.log(`[FB-DEBUG] recordLoadTime: ${ms}ms | samples(${loadTimeSamples.length}): avg=${Math.round(avg)}ms`);
  }
};

const getAdaptiveTimeout = (type, emakiId) => {
  const bounds = TIMEOUT_BOUNDS[type];
  const connMultiplier = getConnectionMultiplier();
  const emakiMultiplier = PER_EMAKI_TIMEOUT[emakiId] || 1;
  const combinedMultiplier = Math.min(connMultiplier * emakiMultiplier, 3);
  if (loadTimeSamples.length === 0) {
    const fallback = Math.round(bounds.fallback * combinedMultiplier);
    if (FB_DEBUG) console.log(`[FB-DEBUG] getAdaptiveTimeout(${type}): ${fallback}ms (no samples, conn=${connMultiplier}x, emaki=${emakiMultiplier}x)`);
    return fallback;
  }
  const avg = loadTimeSamples.reduce((a, b) => a + b, 0) / loadTimeSamples.length;
  const maxAdjusted = Math.round(bounds.max * combinedMultiplier);
  const timeout = Math.min(maxAdjusted, Math.max(bounds.min, Math.round(avg * TIMEOUT_MULTIPLIER)));
  if (FB_DEBUG) console.log(`[FB-DEBUG] getAdaptiveTimeout(${type}): ${timeout}ms (avg=${Math.round(avg)}ms, conn=${connMultiplier}x, emaki=${emakiMultiplier}x)`);
  return timeout;
};

/** 初回は priority 1枚のみ eager。帯域競合とデコード負荷を抑える */
const isEagerLoad = (uniqueIndex, prefetchIndex, isPlayMode, toggleFullscreen) =>
  uniqueIndex === 0 ||
  (isPlayMode && uniqueIndex <= prefetchIndex + PLAYBACK_IMAGE_LOOKAHEAD) ||
  (toggleFullscreen && Math.abs(uniqueIndex - prefetchIndex) <= 2);

const LazyImage = ({
  src,
  alt,
  width,
  height,
  config,
  uniqueIndex,
  navIndex, // 現在表示中のシーンインデックス（フルスクリーン時のeager制御用）
  sceneIndex, // 先読み用（再生中は liveSceneIndex。未指定時は navIndex）
  isPlayMode, // 再生モード状態
  emakiId, // 計測用: 絵巻ID
}) => {
  const { orientation, toggleFullscreen } = useContext(AppContext);
  const prefetchIndex = sceneIndex ?? navIndex;

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
      const timeout = getAdaptiveTimeout("priority", emakiId);
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
      (isPlayMode &&
        uniqueIndex <= prefetchIndex + PLAYBACK_IMAGE_LOOKAHEAD) ||
      Math.abs(uniqueIndex - prefetchIndex) <= 2;

    const startFallbackTimer = () => {
      loadStartTimeRef.current = Date.now();
      const timeout = getAdaptiveTimeout("fullscreen", emakiId);
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
  }, [toggleFullscreen, isSkeletonVisible, emakiId, uniqueIndex, prefetchIndex, isPlayMode]);

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

    // eager画像はマウント時にすでにリクエスト開始済みなので即タイマー設定
    const isEager = isEagerLoad(uniqueIndex, prefetchIndex, isPlayMode, false);

    const startFallbackTimer = () => {
      // ロード開始時刻を「今」にリセット（ビューポート進入 = ロード開始）
      loadStartTimeRef.current = Date.now();
      const timeout = getAdaptiveTimeout("universal", emakiId);
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
  }, [uniqueIndex, toggleFullscreen, isSkeletonVisible, emakiId, isPlayMode, prefetchIndex]);

  // 絵巻の紙色（#f5f0e6）。Firefox の白背景フラッシュ対策（外部 blur URL は使わない）
  const PAPER_COLOR_BLUR_DATA_URL =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%23f5f0e6' width='1' height='1'/%3E%3C/svg%3E";

  const cloudinaryLoader = ({ src, width }) => {
    // 変換はスラッシュ区切りのみ（カンマは srcset を分割し相対パス 404 になる）
    // dpr_auto は付けない: next/image の srcset が devicePixelRatio を考慮して候補を選ぶため、
    // w_×dpr の二重拡大による過大な配信を防ぐ
    return buildCloudinaryUrl(src, [`w_${width}`, "f_auto", "q_auto:eco"]);
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
      className={styles.wrapper}
      style={{
        width: `calc(${width / height} * ${getResponsiveHeightVar(toggleFullscreen, orientation)})`,
        height: "100%",
        aspectRatio: `${width} / ${height}`,
      }}
      ref={containerRef}
    >
      {isSkeletonVisible && (
        <div
          className={styles.skeleton}
          style={{
            opacity: isImageLoaded ? 0 : 1,
            transition: "opacity 0.3s ease-out",
            aspectRatio: `${width} / ${height}`,
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
        // 初回は 1枚のみ eager。再生/フルスクリーン時のみ先読みを広げる
        loading={(() => {
          const isEager = isEagerLoad(
            uniqueIndex,
            prefetchIndex,
            isPlayMode,
            toggleFullscreen
          );
          if (FB_DEBUG && uniqueIndex < 12) {
            console.log(`[FB-DEBUG] loading: idx=${uniqueIndex}, prefetchIndex=${prefetchIndex}, fullscreen=${toggleFullscreen}, playMode=${isPlayMode} → ${isEager ? "eager" : "lazy"}`);
          }
          return isEager ? "eager" : "lazy";
        })()}
        lazyBoundary={isPlayMode ? "2400px" : "800px"}
        layout="responsive"
        sizes={imageSizes}
        placeholder={"blur"}
        blurDataURL={PAPER_COLOR_BLUR_DATA_URL}
        onLoadingComplete={() => {
          const loadTimeMs = Date.now() - loadStartTimeRef.current;
          if (FB_DEBUG) console.log(`[FB-DEBUG] ✓ onLoadingComplete: idx=${uniqueIndex}, loadTime=${loadTimeMs}ms`);
          recordLoadTime(loadTimeMs);
          if (!hasTrackedRef.current && emakiId) {
            trackImageLoaded(emakiId, uniqueIndex, loadTimeMs, "normal");
            const thresholdType = toggleFullscreen ? "fullscreen" : "universal";
            const threshold = getAdaptiveTimeout(thresholdType, emakiId);
            const isEager = isEagerLoad(
              uniqueIndex,
              prefetchIndex,
              isPlayMode,
              toggleFullscreen
            );
            trackImageLoadSlow(emakiId, uniqueIndex, loadTimeMs, threshold, toggleFullscreen, isEager ? "eager" : "lazy");
            hasTrackedRef.current = true;
          }
          setImageLoaded(true);
          setTimeout(() => setSkeletonVisible(false), 300);
        }}
        className={isImageLoaded ? styles.imageLoaded : styles.imageLoading}
      />
    </div>
  );
};

export default LazyImage;
