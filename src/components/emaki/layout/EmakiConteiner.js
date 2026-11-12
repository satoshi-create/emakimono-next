/**
 * EmakiConteiner.js
 * 
 * 【責務（Phase 1 責務分離後）】
 * - 絵巻本体の横スクロール描画コンテナ（<article>）の管理
 * - スライス画像の描画窓制御（仮想化）
 * - 自動再生、ズーム＆パン、クイズモーダル、解説バーのホスト
 * - 【分離完了】Discoveryレールとのスクロール同期ロジックは useEmakiRailSync フックへ完全委譲
 */
import {
  EbikiCoordinatePickerHud,
  useEbikiCoordinatePicker,
} from "@/components/emaki/dev/EbikiCoordinatePicker";
import EmakiInfo from "@/components/emaki/metadata/EmakiInfo";
import EmakiNavigation from "@/components/emaki/navigation/EmakiNavigation";
import ActionButton from "@/components/emaki/viewer/ActionButton";
import FullScreen from "@/components/emaki/viewer/FullScreen";
import ZoomLayer from "@/components/emaki/viewer/ZoomLayer";
import {
  clearQuizSession,
  createQuizSession,
  loadQuizSession,
  saveQuizSession,
} from "@/libs/api/quizSessionStore";
import {
  isQuizFabHidden,
  setQuizFabHidden,
} from "@/libs/api/quizFabPrefs";
import { resolveLinkIdByChapter } from "@/utils/resolveQuizJump";
import { getFolkloreItemById } from "@/data/folklore/folkloreIndex";
import SceneCommentaryBar from "@/components/emaki/viewer/SceneCommentaryBar";
import PositionIndicator from "@/components/emaki/viewer/PositionIndicator";
import SwitcherEmaki from "@/components/emaki/viewer/SwitcherEmaki";
import WheelScrollIndicator from "@/components/emaki/viewer/WheelScrollIndicator";
import { AppContext } from "@/context/AppContext";
import { assignUniqueIndex } from "@/utils/emakiItemIndexer";
import {
  shouldMountSceneContent,
} from "@/utils/emakiContentWindow";
import {
  faMagnifyingGlass,
  faMagnifyingGlassMinus,
  faCamera,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { emakiDisplayTitle } from "@/utils/emakiDisplayTitle";
import useEmakiAutoPlay from "@/hooks/emaki/useEmakiAutoPlay";
import useEmakiPalmDrag from "@/hooks/emaki/useEmakiPalmDrag";
import useEmakiZoomPan from "@/hooks/emaki/useEmakiZoomPan";
import useEmakiZoomBridge from "@/hooks/emaki/useEmakiZoomBridge";
import useEmakiScroll from "@/hooks/emaki/useEmakiScroll";
import useScrollPositionRestore from "@/hooks/emaki/useScrollPositionRestore";
import useEmakiRailSync from "@/hooks/emaki/useEmakiRailSync";
import styles from "@/styles/EmakiConteiner.module.css";
import zoomStyles from "@/styles/ZoomLayer.module.css";
import commentaryStyles from "@/styles/SceneCommentaryBar.module.css";
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import {
  trackSessionContext,
  trackManualScroll,
  resetAllTracking,
  trackZoomOpen,
  trackZoomClose,
} from "@/libs/api/measurementUtils";
import { useEmakiPrompts } from "@/hooks/emaki/useEmakiPrompts";
import { isByobuScroll } from "@/utils/isByobuScroll";
import {
  ZOOM_STRIP_MIN_SLICES,
  ZOOM_STRIP_MIN_SLICES_BYOBU,
} from "@/libs/constants/viewerPlayback";
import { scrollPositionStore } from "@/hooks/emaki/scrollPositionStore";
import { runAfterPaint } from "@/utils/runAfterPaint";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import { TbRectangle } from "react-icons/tb";

// 鑑賞者向け通し番号（1始まり）の算出: 詞書ありは段数(activeIndex+1)、詞書なしはスライス通し番号
function getVisitorSceneNumber(emakis, navIndex) {
  if (!Array.isArray(emakis) || emakis.length === 0) return 1;
  const ekotobas = emakis.filter((item) => item.cat === "ekotoba");
  if (ekotobas.length > 0) {
    let segment = 0;
    ekotobas.forEach((item, i) => {
      if (item.linkId <= navIndex) segment = i;
    });
    return segment + 1;
  }
  const n = Number(navIndex);
  return Number.isFinite(n) && n >= 0 ? n + 1 : 1;
}

// ?scene=N 入場時にジャンプすべき linkId の逆引き
function getLinkIdForVisitorScene(emakis, sceneNum) {
  if (!Array.isArray(emakis) || emakis.length === 0) return 0;
  const n = Math.max(1, Math.floor(Number(sceneNum) || 1));
  const ekotobas = emakis.filter((item) => item.cat === "ekotoba");
  if (ekotobas.length > 0) {
    const idx = Math.min(n - 1, ekotobas.length - 1);
    return ekotobas[idx].linkId;
  }
  return n - 1;
}

// 動的インポート（初期チャンク軽量化）
const HelpModal = dynamic(
  () => import("@/components/emaki/viewer/HelpModal"),
  { ssr: false }
);
const QuizFab = dynamic(
  () => import("@/components/emaki/quiz/QuizFab"),
  { ssr: false }
);
const QuizModal = dynamic(
  () => import("@/components/emaki/quiz/QuizModal"),
  { ssr: false }
);
const PolaroidModal = dynamic(
  () => import("@/components/emaki/viewer/PolaroidModal").then((mod) => mod.PolaroidModal || mod.default || mod),
  { ssr: false }
);
const ScrollFeedbackPanel = dynamic(
  () => import("@/components/emaki/viewer/ScrollFeedbackPanel"),
  { ssr: false }
);
const ViewerPullPrompt = dynamic(
  () => import("@/components/emaki/viewer/ViewerPullPrompt"),
  { ssr: false }
);
const ScrollFeedbackEndPrompt = dynamic(
  () => import("@/components/emaki/viewer/ScrollFeedbackEndPrompt"),
  { ssr: false }
);
const EndNudgeCard = dynamic(
  () => import("@/components/emaki/viewer/EndNudgeCard"),
  { ssr: false }
);

// 教育現場向けUI: 絵巻切り替え検出用（モジュールスコープ）
let prevDataId = null;

const EmakiContainer = ({
  data,
  height,
  width,
  scroll,
  overflowX,
  boxshadow,
  selectedRef,
  navIndex,
  editionLinks = [],
  showKusouzuHubLink = false,
  showChojuGigaHubLink = false,
  showHyakkiHubLink = false,
  onUserScrollStart,
  onReachStartBoundary,
  isTheaterMode,
  onToggleTheater,
  theaterSuppressRef,
  railPinFromExpandRef,
  railPinScrollLeftRef,
}) => {
  const {
    setOepnSidebar,
    oepnSidebar,
    orientation,
    handleToId,
    toggleFullscreen,
    handleFullScreen,
    isHelpModalOpen,
    setnavIndex,
    isScrollDetectedUpdateRef,
  } = useContext(AppContext);

  const { backgroundImage } = data;
  const { locale, locales, asPath, defaultLocale, query, push } = useRouter();
  const { t } = useTranslation("common");

  const wrapperRef = useRef();
  const articleRef = useRef();
  const entryContainerRef = useRef(null);
  const enterZoomRef = useRef(null);
  const touchDoubleTapAtRef = useRef(0);
  const scrollNextRef = useRef(null);
  const scrollPrevRef = useRef(null);

  const [showWheelToast, setShowWheelToast] = useState(false);

  // 端点状態管理（useEmakiScroll が更新）
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const isAtStartRef = useRef(true);
  const isAtEndRef = useRef(false);

  const hasNextVolume = editionLinks.length > 0 || showKusouzuHubLink || showChojuGigaHubLink || showHyakkiHubLink;

  // フィードバックパネル開閉のみ親が保持（プロンプト本体は useEmakiPrompts）
  const [isScrollFeedbackOpen, setIsScrollFeedbackOpen] = useState(false);

  const [isMdLandscape, setIsMdLandscape] = useState(false);
  const commentaryFloating = Boolean(toggleFullscreen) || isMdLandscape;

  useLayoutEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => {
      setIsMdLandscape(orientation === "landscape" && mq.matches);
    };
    update();
    mq.addEventListener?.("change", update);
    window.addEventListener("orientationchange", update);
    return () => {
      mq.removeEventListener?.("change", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [orientation]);

  const [viewerTopInset, setViewerTopInset] = useState(null);
  useLayoutEffect(() => {
    if (!commentaryFloating || toggleFullscreen) return undefined;
    const el = entryContainerRef.current;
    if (!el) return undefined;
    const measure = () => {
      if (typeof window === "undefined") return;
      const top = Math.round(el.getBoundingClientRect().top + window.scrollY);
      setViewerTopInset((prev) => (prev === top ? prev : top));
    };
    measure();
    window.addEventListener("resize", measure);
    const timers = [200, 800].map((ms) => setTimeout(measure, ms));
    return () => {
      window.removeEventListener("resize", measure);
      timers.forEach((t) => clearTimeout(t));
    };
  }, [commentaryFloating, toggleFullscreen]);

  const emakiId = data.titleen;
  const [quizModule, setQuizModule] = useState(null);
  const [quizSession, setQuizSession] = useState(null);
  const [quizUi, setQuizUi] = useState("closed");
  const [quizFabHidden, setQuizFabHiddenState] = useState(false);
  const quizHydratedRef = useRef(false);
  const pendingJumpAppliedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    import("@/data/quiz").then((mod) => {
      if (!cancelled) setQuizModule(mod);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const entryQuiz = quizModule
    ? quizModule.getQuizForTitleen(data.titleen)
    : null;

  const lastDetectedSceneRef = useRef(navIndex);
  const detectCurrentSceneRef = useRef(null);
  const indicatorElRef = useRef(null);

  const contentWindowMountedRef = useRef(new Set());
  const contentWindowEmakiRef = useRef(data.id);

  const [isScrolling, setIsScrolling] = useState(false);
  const isScrollingRef = useRef(false);
  const [idlePaused, setIdlePaused] = useState(false);

  // 自動スクロール・UI可視性制御
  const {
    isAutoScrolling,
    isPlayMode,
    startPlayMode,
    stopPlayMode,
    playModeAnimationRef,
    setIsPlayMode,
    isUIVisible,
    showUI,
    resetIdleTimer,
  } = useEmakiAutoPlay({
    articleRef,
    dataId: data.id,
    emakiId,
    navIndex,
    setnavIndex,
    lastDetectedSceneRef,
    isAtStartRef,
    isAtEndRef,
    setIsAtStart,
    setIsAtEnd,
    isScrollingRef,
    setIsScrolling,
    idlePaused,
    detectCurrentSceneRef,
    scrollPositionStore,
  });

  const sessionQuiz =
    quizModule && quizSession
      ? quizModule.getQuizById(quizSession.quizId)
      : null;
  const activeQuiz = entryQuiz || sessionQuiz;
  const isSessionForCurrentScroll =
    quizSession &&
    (!quizSession.hostTitleen || quizSession.hostTitleen === data?.titleen);
  const forceQuizFabForResume = Boolean(
    isSessionForCurrentScroll && !quizSession?.done
  );
  const canShowQuizChrome = Boolean(
    scroll &&
      activeQuiz &&
      (entryQuiz ||
        (isSessionForCurrentScroll && !quizSession?.done) ||
        quizUi === "minimized") &&
      (!quizFabHidden || forceQuizFabForResume)
  );
  const fabMode =
    isSessionForCurrentScroll && !quizSession?.done ? "resume" : "start";

  useEffect(() => {
    if (!quizModule || quizHydratedRef.current) return;
    return runAfterPaint(() => {
      if (quizHydratedRef.current) return;
      quizHydratedRef.current = true;
      setQuizFabHiddenState(isQuizFabHidden());
      const stored = loadQuizSession({ hostTitleen: data?.titleen });
      if (!stored) {
        setQuizSession(null);
        return;
      }
      if (!quizModule.getQuizById(stored.quizId)) return;
      setQuizSession(stored);

      const isExplicitQuizQuery =
        query.quiz === "1" || query.quiz === "true";
      if (!isExplicitQuizQuery && !stored.done) {
        setQuizUi("minimized");
      }
    });
  }, [quizModule, data?.titleen, query.quiz]);

  useEffect(() => {
    const onShowFab = () => {
      setQuizFabHidden(false);
      setQuizFabHiddenState(false);
    };
    window.addEventListener("emaki-quiz-show-fab", onShowFab);
    return () => window.removeEventListener("emaki-quiz-show-fab", onShowFab);
  }, []);

  useEffect(() => {
    if (!scroll || !quizSession?.pendingJump || pendingJumpAppliedRef.current) {
      return;
    }
    const pj = quizSession.pendingJump;
    if (pj.titleen !== data.titleen) return;
    pendingJumpAppliedRef.current = true;
    const linkId =
      typeof pj.linkId === "number"
        ? pj.linkId
        : resolveLinkIdByChapter(data.emakis, pj.chapter);
    const cleared = { ...quizSession, pendingJump: null };
    saveQuizSession(cleared);
    setQuizSession(cleared);
    setQuizUi("minimized");
    if (typeof linkId === "number") {
      stopPlayMode();
      requestAnimationFrame(() => handleToId(linkId));
    }
  }, [
    scroll,
    data.titleen,
    data.emakis,
    quizSession,
    stopPlayMode,
    handleToId,
  ]);

  const openQuizUi = useCallback(() => {
    if (!quizModule) return;
    if (!activeQuiz) return;
    if (
      quizSession &&
      !quizSession.done &&
      quizSession.quizId === activeQuiz.id &&
      (!quizSession.hostTitleen || quizSession.hostTitleen === data?.titleen)
    ) {
      setQuizUi("open");
      return;
    }
    if (!entryQuiz) return;
    const nextSession = createQuizSession(entryQuiz, data?.titleen);
    saveQuizSession(nextSession);
    setQuizSession(nextSession);
    setQuizUi("open");
  }, [quizModule, quizSession, entryQuiz, activeQuiz, data?.titleen]);

  const closeQuizUi = useCallback(() => {
    setQuizUi("minimized");
  }, []);

  const abandonQuizUi = useCallback(() => {
    clearQuizSession();
    setQuizSession(null);
    setQuizUi("closed");
    pendingJumpAppliedRef.current = false;
  }, []);

  const handleQuizSessionChange = useCallback((next) => {
    saveQuizSession(next);
    setQuizSession(next);
  }, []);

  const handleQuizJumpLocal = useCallback(
    (linkId) => {
      stopPlayMode();
      setQuizUi("minimized");
      handleToId(linkId);
    },
    [stopPlayMode, handleToId]
  );

  const handleQuizJumpScroll = useCallback(
    (titleen) => {
      stopPlayMode();
      setQuizUi("minimized");
      pendingJumpAppliedRef.current = false;
      push(`/${titleen}`);
    },
    [stopPlayMode, push]
  );

  const quizOpenedFromQueryRef = useRef(false);
  useEffect(() => {
    if (!scroll || !activeQuiz || quizOpenedFromQueryRef.current) return;
    if (query.quiz === "true" || query.quiz === "1") {
      quizOpenedFromQueryRef.current = true;
      openQuizUi();
    }
  }, [scroll, activeQuiz, query.quiz, openQuizUi]);

  // 物理スクロール制御フック
  const {
    scrollDimsRef,
    liveSceneIndex,
    contentWindowCenter,
    contentWindowCenterRef,
  } = useEmakiScroll({
    articleRef,
    dataId: data.id,
    emakiId,
    emakis: data.emakis,
    isByobu: isByobuScroll(data),
    navIndex,
    setnavIndex,
    isScrollDetectedUpdateRef,
    isAutoScrolling,
    playModeAnimationRef,
    palmActiveRef,
    lastDetectedSceneRef,
    isAtStartRef,
    isAtEndRef,
    setIsAtStart,
    setIsAtEnd,
    isScrollingRef,
    setIsScrolling,
    indicatorElRef,
    toggleFullscreen,
    scrollPositionStore,
    detectCurrentSceneRef,
  });

  const pendingInitialHashRef = useRef(0);
  const [hashFollowEnabled, setHashFollowEnabled] = useState(false);

  useEffect(() => {
    if (!scroll) return;
    setHashFollowEnabled(false);
    const ebikiRaw = query?.ebiki;
    if (ebikiRaw) {
      const id = String(Array.isArray(ebikiRaw) ? ebikiRaw[0] : ebikiRaw).trim();
      const found = id ? getFolkloreItemById(id) : null;
      pendingInitialHashRef.current =
        typeof found?.link_id === "number" ? found.link_id : 0;
      return;
    }
    const hash =
      Number(String(window.location.hash || "").replace("#", "")) || 0;
    const hasQueryScene = Boolean(query?.scene);
    pendingInitialHashRef.current = hash;
    if (hash <= 0 && !hasQueryScene) setHashFollowEnabled(true);
  }, [scroll, data.id, query?.ebiki]);

  useEffect(() => {
    if (typeof window === "undefined" || !scroll) return;
    const pending = pendingInitialHashRef.current;
    if (!hashFollowEnabled) {
      if (pending > 0) {
        const url = new URL(window.location.href);
        url.searchParams.set("scene", String(pending));
        url.hash = "";
        window.history.replaceState(null, "", url.pathname + url.search);
      }
      return;
    }
    if (pending > 0 && liveSceneIndex !== pending && liveSceneIndex === 0) {
      return;
    }
    pendingInitialHashRef.current = 0;
    const currentEmakis = data?.emakis || [];
    const url = new URL(window.location.href);
    const currentSceneNum = getVisitorSceneNumber(currentEmakis, liveSceneIndex);
    url.searchParams.set("scene", String(currentSceneNum));
    url.hash = "";
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [liveSceneIndex, scroll, hashFollowEnabled, data?.emakis]);

  useEffect(() => {
    if (!scroll || hashFollowEnabled) return;
    const el = articleRef?.current;
    if (!el) return;
    let lastLeft = el.scrollLeft;
    const onScroll = () => {
      const left = el.scrollLeft;
      if (
        !scrollPositionStore.isProgrammaticScroll &&
        Math.abs(left - lastLeft) > 1
      ) {
        pendingInitialHashRef.current = 0;
        setHashFollowEnabled(true);
      }
      lastLeft = left;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
    };
  }, [scroll, data.id, articleRef, hashFollowEnabled]);

  const didApplyEntryHashRef = useRef(false);
  useEffect(() => {
    if (!scroll || didApplyEntryHashRef.current) return;
    didApplyEntryHashRef.current = true;
    if (query?.ebiki) return;
    const queryScene = query?.scene;
    let targetIndex = null;

    if (queryScene !== undefined && queryScene !== null) {
      const parsed = Number(queryScene);
      if (!Number.isNaN(parsed) && parsed >= 1) {
        targetIndex = getLinkIdForVisitorScene(data?.emakis || [], parsed);
      }
    }

    if (targetIndex === null) {
      const hashflag = Number(
        String(
          typeof window !== "undefined" ? window.location.hash || "" : ""
        ).replace("#", "")
      );
      if (!Number.isNaN(hashflag) && hashflag > 0) {
        targetIndex = hashflag;
      }
    }

    if (targetIndex === null || targetIndex === undefined) return;
    const pin = () => window.scrollTo({ top: 0, behavior: "instant" });
    if (navIndex === targetIndex) {
      pin();
      return;
    }
    handleToId(targetIndex, {
      realign: true,
      scrollBehavior: "auto",
      align: "right",
      offsetPercent: -50,
    });
    pin();
    const timers = [50, 200, 500, 1000].map((ms) => setTimeout(pin, ms));
    return () => timers.forEach(clearTimeout);
  }, [scroll, data.id, handleToId, navIndex, query?.ebiki]);

  const shareTitle =
    locale === "en"
      ? emakiDisplayTitle(data, locale)
      : `${data.title ?? ""}${data.edition ? ` ${data.edition}` : ""}`.trim();

  // ---------------------------------------------------------------------------
  // 中盤・巻末プルプロンプト（状態 / sessionStorage / 表示条件 → useEmakiPrompts）
  // UI は scroll フラグと isScrollFeedbackOpen のみ EmakiConteiner が配線する。
  // ---------------------------------------------------------------------------
  const {
    getScrollRatio,
    scrollFeedbackSubmitted,
    showSharePullPrompt,
    showMidFeedbackPrompt,
    showScrollFeedbackEndPrompt,
    handleScrollFeedbackSubmitted,
    handleSharePromptCopy,
    dismissSharePrompt,
    dismissMidFeedbackPrompt,
    handleMidFeedbackPrimary,
    dismissEndPrompt,
  } = useEmakiPrompts({
    emakiId,
    scroll,
    articleRef,
    isAtEnd,
    isUIVisible,
    isScrollFeedbackOpen,
    setIsScrollFeedbackOpen,
    locale,
    asPath,
    locales,
    defaultLocale,
    liveSceneIndex,
  });

  const { isPalmMode, suppressClickUntilRef, palmActiveRef } =
    useEmakiPalmDrag(articleRef);

  // 【責務分離】Discoveryレールとのスクロール同期ロジックを抽出したフックへ委譲
  const {
    handlePointerDown: handleRailPointerDown,
    handleTouchStart: handleRailTouchStart,
    handleTouchEnd: handleRailTouchEnd,
    handleWheel: handleRailWheel,
  } = useEmakiRailSync({
    articleRef,
    isAtStart,
    isAtStartRef,
    isAtEnd,
    isAtEndRef,
    isAutoScrolling,
    isPlayMode,
    onUserScrollStart,
    onReachStartBoundary,
    theaterSuppressRef,
    railPinFromExpandRef,
    railPinScrollLeftRef,
  });

  const handleViewerDoubleTap = useCallback(() => {
    touchDoubleTapAtRef.current = Date.now();
    handleFullScreen("landscape");
  }, [handleFullScreen]);

  const zoomStartTimeRef = useRef(null);
  const zoomMaxScaleRef = useRef(1);

  const handleZoomOpenWithTrack = useCallback(
    (source = "unknown") => {
      stopPlayMode();
      if (zoomStartTimeRef.current != null) return;
      zoomStartTimeRef.current = Date.now();
      zoomMaxScaleRef.current = 1;
      trackZoomOpen(emakiId, source);
    },
    [stopPlayMode, emakiId]
  );

  const handleZoomCloseWithTrack = useCallback(() => {
    if (zoomStartTimeRef.current) {
      const durationSec = (Date.now() - zoomStartTimeRef.current) / 1000;
      trackZoomClose(emakiId, durationSec, zoomMaxScaleRef.current);
      zoomStartTimeRef.current = null;
    }
  }, [emakiId]);

  const {
    isZoomed,
    scale: zoomScale,
    panX,
    panY,
    zoomRef,
    stageRef: zoomStageRef,
    stripRef: zoomStripRef,
    openZoom,
    resetZoom: originalResetZoom,
    zoomIn,
    zoomOut,
    toggleZoom: originalToggleZoom,
    handlers: zoomHandlers,
  } = useEmakiZoomPan({
    onOpen: () => handleZoomOpenWithTrack("unknown"),
    onDoubleTap: handleViewerDoubleTap,
    containerRef: entryContainerRef,
    requestZoomRef: enterZoomRef,
    maxScale:
      typeof data?.maxScale === "number"
        ? data.maxScale
        : typeof data?.maxZoom === "number"
        ? data.maxZoom / 100
        : typeof data?.titleen === "string" && data.titleen.startsWith("rakuchu_rakugai")
        ? 12
        : isByobuScroll(data)
        ? 8
        : undefined,
  });

  useEffect(() => {
    if (isZoomed && zoomScale > zoomMaxScaleRef.current) {
      zoomMaxScaleRef.current = zoomScale;
    }
  }, [isZoomed, zoomScale]);

  useEffect(() => {
    if (!isZoomed) {
      handleZoomCloseWithTrack();
    }
  }, [isZoomed, handleZoomCloseWithTrack]);

  const {
    enabled: ebikiPickerEnabled,
    onPick: onEbikiPick,
    hudData: ebikiPickerHud,
    clearHud: clearEbikiPickerHud,
  } = useEbikiCoordinatePicker({ handleToId, isZoomed });

  const wasPalmActiveRef = useRef(false);
  useEffect(() => {
    if (isPalmMode) {
      wasPalmActiveRef.current = true;
      return undefined;
    }
    if (!wasPalmActiveRef.current) return undefined;
    wasPalmActiveRef.current = false;
    const t = setTimeout(() => {
      if (typeof detectCurrentSceneRef.current === "function") {
        detectCurrentSceneRef.current();
      }
    }, 120);
    return () => clearTimeout(t);
  }, [isPalmMode]);

  const showEndNudge = isAtEnd && hasNextVolume;

  useScrollPositionRestore({
    articleRef,
    dataId: data.id,
    toggleFullscreen,
    orientation,
    scrollPositionStore,
    navIndex,
    handleToId,
    detectCurrentSceneRef,
  });

  useEffect(() => {
    scrollDimsRef.current = { w: 0, c: 0, ts: 0 };
    const t = setTimeout(() => {
      if (typeof detectCurrentSceneRef.current === "function") {
        detectCurrentSceneRef.current();
      }
    }, 150);
    return () => clearTimeout(t);
  }, [toggleFullscreen, orientation]);

  useEffect(() => {
    if (prevDataId !== null && prevDataId !== data.id) {
      if (playModeAnimationRef.current) {
        cancelAnimationFrame(playModeAnimationRef.current);
        playModeAnimationRef.current = null;
      }
      setIsPlayMode(false);

      scrollPositionStore.scrollLeft = 0;
      scrollPositionStore.scrollRatio = 0;
      scrollPositionStore.restored = false;
      scrollPositionStore.isTransitioning = false;
      scrollPositionStore.emakiId = null;

      const el = articleRef.current;
      if (el) {
        scrollPositionStore.isTransitioning = true;
        el.scrollTo({ left: 0, behavior: "auto" });
        isAtStartRef.current = true;
        isAtEndRef.current = false;
        setIsAtStart(true);
        setIsAtEnd(false);
        lastDetectedSceneRef.current = 0;
        setTimeout(() => {
          scrollPositionStore.isTransitioning = false;
        }, 100);
      }

      scrollDimsRef.current = { w: 0, c: 0, ts: 0 };
      resetAllTracking();
    }

    prevDataId = data.id;

    return runAfterPaint(() => {
      const imageCount = (data.emakis || []).filter(
        (scene) => scene.cat === "image"
      ).length;
      trackSessionContext(emakiId, imageCount);
    });
  }, [data.id, data.emakis, emakiId, backgroundImage]);

  useEffect(() => {
    if (scroll) {
      let scrollSpeed = 30;
      const el = articleRef.current;
      const MouseWheelHandler = (e) => {
        if (e.ctrlKey || e.metaKey) return;
        if (!e.deltaY) return;

        const toastKey = "wheel_toast_shown";
        if (!sessionStorage.getItem(toastKey)) {
          sessionStorage.setItem(toastKey, "true");
          setShowWheelToast(true);
        }

        trackManualScroll(emakiId, "wheel");

        if (playModeAnimationRef.current) {
          cancelAnimationFrame(playModeAnimationRef.current);
          playModeAnimationRef.current = null;
          setIsPlayMode(false);
          showUI();
          e.preventDefault();
          return;
        }

        let scrollDirection = e.deltaY > 0 ? 1 : -1;
        let scrollLeft = el.scrollLeft;
        let scrollWidth = el.scrollWidth;
        let clientWidth = el.clientWidth;
        let maxScrollLeft = scrollWidth - clientWidth;
        const SCROLL_MARGIN = 5;

        const atStart = Math.abs(scrollLeft) < SCROLL_MARGIN ||
                        scrollLeft >= maxScrollLeft - SCROLL_MARGIN;

        const atEnd = Math.abs(scrollLeft) >= maxScrollLeft - SCROLL_MARGIN ||
                      (scrollLeft < 0 && Math.abs(scrollLeft) >= maxScrollLeft - SCROLL_MARGIN);

        if (
          (scrollDirection === -1 && !atEnd) ||
          (scrollDirection === 1 && !atStart)
        ) {
          el.scrollLeft += scrollSpeed * scrollDirection;
        }

        e.preventDefault();
        return true;
      };

      el.addEventListener("wheel", MouseWheelHandler, { passive: false });
      return () => {
        el.removeEventListener("wheel", MouseWheelHandler, { passive: false });
      };
    }
  }, [scroll, emakiId]);

  const processedEmakis = useMemo(
    () => assignUniqueIndex(data.emakis || []),
    [data.emakis]
  );

  const {
    zoomSlices,
    zoomCenterIndex,
    enterZoomAtPoint,
    handleCaptureFromZoom,
    handleOpenPolaroidModal,
    handleClosePolaroidModal,
    resetZoom,
    toggleZoom,
    isPolaroidModalOpen,
    polaroidSceneIndex,
    polaroidInitialZoom,
    polaroidInitialPan,
    polaroidModalKey,
  } = useEmakiZoomBridge({
    data,
    processedEmakis,
    articleRef,
    entryContainerRef,
    contentWindowCenterRef,
    liveSceneIndex,
    isZoomed,
    zoomScale,
    panX,
    panY,
    openZoom,
    resetZoom: originalResetZoom,
    toggleZoom: originalToggleZoom,
    enterZoomRef,
    onZoomOpenTrack: handleZoomOpenWithTrack,
    onZoomCloseTrack: handleZoomCloseWithTrack,
  });

  const hasCommentaryData = Boolean(scroll);
  const sceneIndexForPrefetch =
    isPlayMode || isAutoScrolling ? liveSceneIndex : navIndex;

  if (contentWindowEmakiRef.current !== data.id) {
    contentWindowEmakiRef.current = data.id;
    contentWindowMountedRef.current = new Set();
  }

  const windowCenter = Number.isFinite(contentWindowCenter)
    ? contentWindowCenter
    : Number.isFinite(sceneIndexForPrefetch)
      ? sceneIndexForPrefetch
      : 0;
  const windowIsPlaying = isPlayMode || isAutoScrolling;
  const pendingHashCenter =
    typeof window !== "undefined"
      ? Number(String(window.location.hash || "").replace("#", "")) || 0
      : 0;

  const isByobu = isByobuScroll(data);
  const mountWindowOpts = { isPlayMode: windowIsPlaying, isByobu };
  const nextContentMounted = new Set();
  for (let i = 0; i < processedEmakis.length; i += 1) {
    const wasMounted = contentWindowMountedRef.current.has(i);
    const nearCenter = shouldMountSceneContent(
      i,
      windowCenter,
      wasMounted,
      mountWindowOpts
    );
    const nearHash =
      pendingHashCenter > 0 &&
      shouldMountSceneContent(i, pendingHashCenter, false, {
        isPlayMode: false,
        isByobu,
      });
    if (nearCenter || nearHash) {
      nextContentMounted.add(i);
    }
  }
  contentWindowMountedRef.current = nextContentMounted;

  return (
      <div
        className={`${
          orientation === "landscape" && scroll ? styles.land : styles.prt
        }`}
      >
        <div
          ref={entryContainerRef}
          data-commentary-float={commentaryFloating ? "true" : undefined}
          className={`js-scrollable entry-container ${
            hasCommentaryData ? commentaryStyles.hasCommentaryBar : ""
          }`}
          style={{
            borderRadius:
              orientation === "landscape" &&
              scroll &&
              toggleFullscreen === false &&
              "12px",
            overflow:
              orientation === "landscape" &&
              scroll &&
              !toggleFullscreen &&
              "hidden",
            width: toggleFullscreen ? "100%" : undefined,
            height: toggleFullscreen ? "100%" : undefined,
            position: "relative",
            touchAction: "pan-x pan-y",
            ...(viewerTopInset != null
              ? { "--emaki-top-inset": `${viewerTopInset}px` }
              : null),
          }}
        >
        {scroll && <FullScreen isUIVisible={isUIVisible} isBarFloating={commentaryFloating} />}
        {scroll && (
          <WheelScrollIndicator
            showToast={showWheelToast}
            onToastComplete={() => setShowWheelToast(false)}
          />
        )}
        {scroll && (
          <PositionIndicator
            indicatorElRef={indicatorElRef}
            isScrolling={isScrolling}
            isUIVisible={isUIVisible}
          />
        )}
        {scroll && onToggleTheater && (
          <div className={zoomStyles.theaterAnchor}>
            <ActionButton
              icon={<TbRectangle style={{ fontSize: "1.5em" }} aria-hidden />}
              description={
                isTheaterMode
                  ? t("discovery.railExpand")
                  : t("discovery.railCollapse")
              }
              onClick={onToggleTheater}
              variant="fullscreen"
              isOn={isTheaterMode}
              isFullscreen={toggleFullscreen}
              isBarFloating={commentaryFloating || isZoomed}
              isUIVisible={isUIVisible}
            />
          </div>
        )}
        {scroll && (
          <>
            <div className={zoomStyles.toggleAnchor}>
              <ActionButton
                icon={
                  <FontAwesomeIcon
                    icon={isZoomed ? faMagnifyingGlassMinus : faMagnifyingGlass}
                    style={{ fontSize: "1.5em" }}
                  />
                }
                description={
                  isZoomed
                    ? t("viewer.zoomToggleOut")
                    : t("viewer.zoomToggleIn")
                }
                onClick={() => {
                  const rect = entryContainerRef.current?.getBoundingClientRect();
                  toggleZoom(
                    rect ? rect.left + rect.width / 2 : null,
                    rect ? rect.top + rect.height / 2 : null
                  );
                }}
                variant="fullscreen"
                isOn={isZoomed}
                isFullscreen={toggleFullscreen}
                isBarFloating={commentaryFloating || isZoomed}
                isUIVisible={isUIVisible}
              />
            </div>
          </>
        )}
        {scroll && (
          <>
            <EmakiNavigation
              handleToId={handleToId}
              data={data}
              isUIVisible={isUIVisible}
              isPlayMode={isPlayMode}
              isAutoScrolling={isAutoScrolling}
              onStartPlayMode={startPlayMode}
              onStopPlayMode={stopPlayMode}
            />
          </>
        )}
        {scroll && toggleFullscreen && (
          <EmakiInfo value={data} isUIVisible={isUIVisible} />
        )}
        {scroll && isHelpModalOpen && <HelpModal />}
        {scroll && isPolaroidModalOpen && (
          <PolaroidModal
            scenes={processedEmakis ?? []}
            emakiTitle={data?.title}
            initialIndex={polaroidSceneIndex}
            initialZoom={polaroidInitialZoom}
            initialPan={polaroidInitialPan}
            isOpen={isPolaroidModalOpen}
            key={polaroidModalKey}
            onClose={handleClosePolaroidModal}
            title={data?.title}
            titleen={data?.titleen}
          />
        )}
        {canShowQuizChrome && (
          <QuizFab
            onOpen={openQuizUi}
            isUIVisible={isUIVisible}
            mode={fabMode}
            variant="float"
          />
        )}
        {scroll && activeQuiz && quizSession && quizUi === "open" && (
          <QuizModal
            quiz={activeQuiz}
            emakiId={emakiId}
            emakis={data.emakis}
            session={quizSession}
            onSessionChange={handleQuizSessionChange}
            onClose={closeQuizUi}
            onAbandon={abandonQuizUi}
            onMinimizeAndJumpLocal={handleQuizJumpLocal}
            onMinimizeAndJumpScroll={handleQuizJumpScroll}
          />
        )}
        {scroll && isScrollFeedbackOpen && (
          <ScrollFeedbackPanel
            emakiId={emakiId}
            sceneIndex={navIndex}
            getScrollRatio={getScrollRatio}
            locale={locale}
            onClose={() => setIsScrollFeedbackOpen(false)}
            onSubmitted={handleScrollFeedbackSubmitted}
          />
        )}
        {scroll && showSharePullPrompt && (
          <ViewerPullPrompt
            mode="share"
            isVisible
            onPrimary={handleSharePromptCopy}
            onDismiss={dismissSharePrompt}
          />
        )}
        {scroll && showMidFeedbackPrompt && (
          <ViewerPullPrompt
            mode="mid_feedback"
            isVisible
            onPrimary={handleMidFeedbackPrimary}
            onDismiss={dismissMidFeedbackPrompt}
          />
        )}
        {scroll && showScrollFeedbackEndPrompt && (
          <ScrollFeedbackEndPrompt
            isVisible
            onOpenFeedback={() => setIsScrollFeedbackOpen(true)}
            onDismiss={dismissEndPrompt}
            emakiId={emakiId}
            shareTitle={shareTitle}
            navIndex={liveSceneIndex}
            showFeedback={!scrollFeedbackSubmitted}
          />
        )}

        {/* 絵巻横スクロールコンテナ本体 */}
        <article
          className={`${styles.container} ${styles.rl} scrollbar ${
            isPalmMode ? styles.palmMode : ""
          }`}
          style={{
            "--screen-height": height,
            "--screen-width": width,
            "--overflow-x": overflowX,
            "--box-shadow": boxshadow,
          }}
          /* 【分離完了】ポインター・タッチ・ホイールイベントを useEmakiRailSync のハンドラへ直接バインド */
          onPointerDown={handleRailPointerDown}
          onClick={() => {
            if (isPlayMode) {
              stopPlayMode();
              return;
            }
            if (Date.now() < suppressClickUntilRef.current) return;
            setOepnSidebar(false);
          }}
          onDoubleClick={(e) => {
            if (e.target.closest("button, a, [role='button']")) return;
            if (Date.now() < suppressClickUntilRef.current) return;
            if (Date.now() - touchDoubleTapAtRef.current < 600) return;
            handleFullScreen("landscape");
          }}
          onTouchStart={(e) => {
            handleRailTouchStart(e);
            if (isPlayMode) {
              stopPlayMode();
            }
            if (!isAutoScrolling) {
              trackManualScroll(emakiId, "touch");
            }
          }}
          onTouchEnd={(e) => {
            handleRailTouchEnd(e);
          }}
          onWheel={handleRailWheel}
          ref={articleRef}
        >
          {processedEmakis.map((item, index) => {
            const { cat, src } = item;
            return (
              <SwitcherEmaki
                key={index}
                cat={cat}
                data={data}
                item={item}
                index={index}
                src={src}
                backgroundImage={backgroundImage}
                selectedRef={selectedRef}
                navIndex={navIndex}
                sceneIndex={windowCenter}
                uniqueIndex={item.uniqueIndex}
                scroll={scroll}
                isPlayMode={windowIsPlaying}
                floatLandscape={commentaryFloating && !toggleFullscreen}
                mountContent={nextContentMounted.has(index)}
                ebikiPickerEnabled={ebikiPickerEnabled}
                onEbikiPick={onEbikiPick}
              />
            );
          })}
          {hasNextVolume && showEndNudge && (
            <EndNudgeCard
              editionLinks={editionLinks}
              showKusouzuHubLink={showKusouzuHubLink}
              showChojuGigaHubLink={showChojuGigaHubLink}
              showHyakkiHubLink={showHyakkiHubLink}
              showEndNudge
            />
          )}
        </article>
        <ZoomLayer
          isZoomed={isZoomed}
          onCapture={handleCaptureFromZoom}
          scale={zoomScale}
          panX={panX}
          panY={panY}
          zoomRef={zoomRef}
          stageRef={zoomStageRef}
          stripRef={zoomStripRef}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          resetZoom={resetZoom}
          handlers={zoomHandlers}
          slices={zoomSlices}
          centerKey={zoomCenterIndex}
        />
        {ebikiPickerEnabled && (
          <EbikiCoordinatePickerHud
            hudData={ebikiPickerHud}
            onClose={clearEbikiPickerHud}
          />
        )}
        {hasCommentaryData && !ebikiPickerEnabled && (
          <SceneCommentaryBar
            data={data}
            navIndex={liveSceneIndex}
            isFullscreen={toggleFullscreen}
            commentaryFloating={commentaryFloating}
            openPolaroidModal={handleOpenPolaroidModal}
            entryContainerRef={entryContainerRef}
            isPlayMode={isPlayMode}
            onIdlePauseChange={setIdlePaused}
            onIdleActivity={resetIdleTimer}
            quizFab={
              canShowQuizChrome ? (
                <QuizFab
                  onOpen={openQuizUi}
                  isUIVisible={isUIVisible}
                  mode={fabMode}
                  variant="bar"
                />
              ) : null
            }
          />
        )}
        </div>
      </div>
  );
};

export default EmakiContainer;