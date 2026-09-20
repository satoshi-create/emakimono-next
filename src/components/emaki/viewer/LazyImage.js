import { AppContext } from "@/context/AppContext";
import { trackImageLoaded, trackImageFallback, trackImageLoadSlow } from "@/libs/api/measurementUtils";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import {
  MANUAL_IMAGE_LOOKAHEAD,
  PLAYBACK_IMAGE_LOOKAHEAD,
} from "@/libs/constants/viewerPlayback";
import styles from "@/styles/LazyImage.module.css";
import Image from "next/image";
import { useContext, useEffect, useRef, useState } from "react";

// アダプティブタイムアウト: 直近の画像ロード時間からフォールバック閾値を動的算出
// 教室一斉アクセス等の帯域逼迫時に閾値が自動的に緩和される
// セッション内（メモリ）限定。localStorage 永続化は前回セッションの速い/遅いサンプルが
// 混入し（生存バイアス・汚染）、閾値が下限に張り付く原因になるため廃止。
const loadTimeSamples = []; // 直近の実測ロード時間（ms）
const MAX_SAMPLES = 8;
const TIMEOUT_MULTIPLIER = 2.5; // 平均ロード時間の2.5倍を閾値とする
// キャッシュヒット / decode 済みの即時完了はネットワーク指標として無効なので除外
const MIN_MEASURABLE_LOAD_MS = 150;

// P3-c: 絵巻別タイムアウト倍率 — cloudinary-breakdown.json の avg_kb に基づく
// キーは `data.titleen`（emakiId）。scroll_id とは別体系のため混在させない
const PER_EMAKI_TIMEOUT = {
  "Chōjū-jinbutsu-giga_first": 1.3, // 甲巻: 横長・高解像度で1枚あたりの転送量が大きい
  "jigokusoushi_anzyuin": 1.5,      // avg 1719KB / max 2890KB — 重量級
  "kusouzumaki": 1.2,               // avg 838KB
  "eshi-no-soshi_tohaku": 1.2,      // avg 716KB
  "gakisoushi_kawamoto": 1.2,       // avg 651KB
};

// 下限・フォールバック値を引き上げ、デスクトップの帯域競合時に誤発火しないようにする
const TIMEOUT_BOUNDS = {
  priority:  { min: 3000, max: 12000, fallback: 5000 },
  fullscreen: { min: 4000, max: 15000, fallback: 6000 },
  universal:  { min: 5000, max: 18000, fallback: 8000 },
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

// デバッグフラグ: 検証完了後に false にするか、本ブロックごと削除
const FB_DEBUG = false;

// 一度 onLoadingComplete した画像キー。描画窓 remount 時の blur/skeleton 再発を抑止
const hydratedImageKeys = new Set();

const recordLoadTime = (ms) => {
  // 即時完了（キャッシュ/decode）はサンプルから除外し、閾値の下限張り付きを防ぐ
  if (!Number.isFinite(ms) || ms < MIN_MEASURABLE_LOAD_MS) return;
  loadTimeSamples.push(ms);
  if (loadTimeSamples.length > MAX_SAMPLES) loadTimeSamples.shift();
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

/**
 * マウント済みシーンは視線より先にネット開始する。
 * 描画窓が枚数を制限するので、前方 eager を厚くして二重 lazy ゲートを避ける。
 */
const isEagerLoad = (uniqueIndex, prefetchIndex, isPlayMode, toggleFullscreen) => {
  if (uniqueIndex === 0) return true;
  const center = Number.isFinite(prefetchIndex) ? prefetchIndex : 0;
  const delta = uniqueIndex - center;
  if (toggleFullscreen && Math.abs(delta) <= 2) return true;
  if (isPlayMode) {
    return delta >= -2 && delta <= PLAYBACK_IMAGE_LOOKAHEAD;
  }
  // 手動: 後方1・前方 MANUAL_IMAGE_LOOKAHEAD
  return delta >= -1 && delta <= MANUAL_IMAGE_LOOKAHEAD;
};

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
  isByobu, // 屏風（typeen === "byobu"）: sizes の過小評価を防ぐ
}) => {
  const { toggleFullscreen } = useContext(AppContext);
  const prefetchIndex = sceneIndex ?? navIndex;

  const hydrateKey =
    emakiId != null && uniqueIndex != null
      ? `${emakiId}:${uniqueIndex}`
      : src?.src || null;
  const alreadyHydrated = Boolean(
    hydrateKey && hydratedImageKeys.has(hydrateKey)
  );

  const [isSkeletonVisible, setSkeletonVisible] = useState(!alreadyHydrated);
  const [isImageLoaded, setImageLoaded] = useState(alreadyHydrated);

  const containerRef = useRef(null);

  // 計測用: 読み込み開始時刻
  const loadStartTimeRef = useRef(Date.now());
  const hasTrackedRef = useRef(false); // 重複計測防止

  // フォールバック計時（タイムアウト型は priority / fullscreen / universal の3種）
  //
  // 重要: eager 画像でもマウント時には計時を開始しない。描画窓内の eager は画面外に
  // あることが多く、リクエスト開始前からカウントすると誤発火（image_load_fallback 多発）になる。
  // rootMargin: "200px" の進入圏内に入った時点（≒実ロード開始）から計時を始める。
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
      // ロード開始時刻を「今」にリセット（ビューポート進入 = ロード開始）
      loadStartTimeRef.current = Date.now();
      const timeout = getAdaptiveTimeout(timeoutType, emakiId);
      if (FB_DEBUG) console.log(`[FB-DEBUG] ${timeoutType} timer SET (viewport enter): idx=${uniqueIndex}, timeout=${timeout}ms`);
      fallbackTimer = setTimeout(() => {
        // プレースホルダーは外さない（実画像到着前の空白化＝即離脱の原因）。
        // ここでは計測のみ行い、スケルトンは onLoadingComplete / onError まで維持する。
        if (FB_DEBUG) console.log(`[FB-DEBUG] ⚠ FALLBACK FIRED: ${fallbackReason} | idx=${uniqueIndex}, timeout=${timeout}ms`);
        if (!hasTrackedRef.current && emakiId) {
          trackImageFallback(emakiId, uniqueIndex, fallbackReason);
          hasTrackedRef.current = true;
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

  // 絵巻の紙色（#f5f0e6）。Firefox の白背景フラッシュ対策（外部 blur URL は使わない）
  const PAPER_COLOR_BLUR_DATA_URL =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%23f5f0e6' width='1' height='1'/%3E%3C/svg%3E";

  const cloudinaryLoader = ({ src, width, quality }) => {
    // 変換はスラッシュ区切りのみ（カンマは srcset を分割し相対パス 404 になる）
    // dpr_auto は付けない: next/image の srcset が devicePixelRatio を考慮して候補を選ぶため、
    // w_×dpr の二重拡大による過大な配信を防ぐ
    // c_limit: 要求幅が原寸を超えても拡大しない（無駄な原寸超え配信の抑止）
    return buildCloudinaryUrl(src, [
      "c_limit",
      `w_${width}`,
      "f_auto",
      quality ? `q_${quality}` : "q_auto:good",
    ]);
  };

  // sizes 属性: ブラウザの srcSet 選択を実際の表示幅に一致させる
  // sizes 未指定時のデフォルト "100vw" では、横スクロール内の各画像の実幅と乖離し、
  // 不要なリクエストキャンセル（HAR: status 0）や二重フェッチの原因となる
  // media query を使用して SSR/クライアント間の hydration mismatch を防止
  const ratioStr = (width / height).toFixed(4);
  // 屏風（舟木本 等）は ratio ≈ 0.365 と極端に細く、SP（375〜420px）では
  // calc(ratio * 45vh) が約 130px となり、極小候補（w_256 / w_384）が選ばれて
  // 拡大時にモザイク状にぼける。屏風のみ下限幅を設けて高解像度側へ寄せる
  // （通常絵巻は従来式のまま＝配信量・レイアウトのリグレッションなし）。
  const portraitSizes = isByobu
    ? `max(calc(${ratioStr} * 45vh), 320px)`
    : `calc(${ratioStr} * 45vh)`;
  const landscapeSizes = isByobu
    ? `max(calc(${ratioStr} * 75vh), 480px)`
    : `calc(${ratioStr} * 75vh)`;
  const imageSizes = toggleFullscreen
    ? `calc(${ratioStr} * 100vh)`
    : `(orientation: portrait) ${portraitSizes}, ${landscapeSizes}`;

  // 幅は親 section（buildSceneShellStyle）が担う。ここは 100% 充填のみ（差し替え時の幅揺れ防止）
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
        lazyBoundary={isPlayMode ? "2400px" : "1600px"}
        layout="responsive"
        sizes={imageSizes}
        quality={toggleFullscreen ? 92 : 85}
        placeholder={alreadyHydrated ? "empty" : "blur"}
        blurDataURL={alreadyHydrated ? undefined : PAPER_COLOR_BLUR_DATA_URL}
        onLoadingComplete={() => {
          const loadTimeMs = Math.max(0, Date.now() - loadStartTimeRef.current);
          if (FB_DEBUG) console.log(`[FB-DEBUG] ✓ onLoadingComplete: idx=${uniqueIndex}, loadTime=${loadTimeMs}ms`);
          if (hydrateKey) hydratedImageKeys.add(hydrateKey);
          // emakiId 未指定（詞書オーバーレイ等）のロード時間はネットワーク指標として
          // 混ぜない。150ms 未満（キャッシュ/decode 済み）も recordLoadTime 側で除外される
          if (emakiId) recordLoadTime(loadTimeMs);
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
          // skeleton は紙色のまま短く外す（長いフェードで「読み込み」を意識させない）
          setSkeletonVisible(false);
        }}
        onError={() => {
          // 取得失敗のみ計測。スケルトンは維持し、空白化・レイアウト崩れを避ける
          if (FB_DEBUG) console.log(`[FB-DEBUG] ✗ onError: idx=${uniqueIndex}`);
          if (!hasTrackedRef.current && emakiId) {
            trackImageFallback(emakiId, uniqueIndex, "load_error");
            hasTrackedRef.current = true;
          }
        }}
        className={styles.imageReady}
      />
    </div>
  );
};

export default LazyImage;
