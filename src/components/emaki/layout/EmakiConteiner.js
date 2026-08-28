/**
 * Emaki viewer shell: horizontal scroll, auto-play, hash navigation, analytics.
 *
 * Consumes AppContext (_app.js). Renders portrait/landscape via child layouts.
 * Data: image-metadata-cache.json per slug. Do not split without a plan.
 */
import EmakiInfo from "@/components/emaki/metadata/EmakiInfo";
import EmakiNavigation from "@/components/emaki/navigation/EmakiNavigation";
import EndNudgeCard from "@/components/emaki/viewer/EndNudgeCard";
import FullScreen from "@/components/emaki/viewer/FullScreen";
import HelpModal from "@/components/emaki/viewer/HelpModal";
import ScrollFeedbackEndPrompt from "@/components/emaki/viewer/ScrollFeedbackEndPrompt";
import ScrollFeedbackPanel from "@/components/emaki/viewer/ScrollFeedbackPanel";
import ViewerPullPrompt from "@/components/emaki/viewer/ViewerPullPrompt";
import SceneCommentaryBar from "@/components/emaki/viewer/SceneCommentaryBar";
import PositionIndicator from "@/components/emaki/viewer/PositionIndicator";
import SwitcherEmaki from "@/components/emaki/viewer/SwitcherEmaki";
import WheelScrollIndicator from "@/components/emaki/viewer/WheelScrollIndicator";
import { AppContext } from "@/context/AppContext";
import { SceneLikeCountsProvider } from "@/context/SceneLikeCountsContext";
import { assignUniqueIndex } from "@/utils/emakiItemIndexer";
import { emakiDisplayTitle } from "@/utils/emakiDisplayTitle";
import useEmakiAutoPlay from "@/hooks/emaki/useEmakiAutoPlay";
import useEmakiPalmDrag from "@/hooks/emaki/useEmakiPalmDrag";
import useEmakiScroll from "@/hooks/emaki/useEmakiScroll";
import useScrollPositionRestore from "@/hooks/emaki/useScrollPositionRestore";
import styles from "@/styles/EmakiConteiner.module.css";
import commentaryStyles from "@/styles/SceneCommentaryBar.module.css";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  trackSessionContext,
  trackManualScroll,
  resetAllTracking,
} from "@/libs/api/measurementUtils";
import {
  hasSubmittedScrollFeedback,
} from "@/libs/api/scrollFeedbackSession";
import {
  hasDismissedPullPrompt,
  markPullPromptDismissed,
} from "@/libs/api/viewerPullSession";
import * as gtag from "@/libs/api/gtag";
import {
  buildShareUrl,
} from "@/utils/buildShareUrl";
// P0改修: フルスクリーン切り替え時のスクロール位置保存用
// モジュールスコープに配置することで、コンポーネント再マウント時も値を保持
const scrollPositionStore = {
  scrollLeft: 0,
  scrollRatio: 0,
  restored: false,      // 復元完了フラグ（複数回の復元によるジャンプ防止）
  isTransitioning: false, // 復元中フラグ（保存の上書きを防止）
  emakiId: null,        // 保存時の絵巻ID（別絵巻への誤復元防止）
};

/** 絵巻ページ遷移時に _app.js から呼び出す */
export const resetScrollPositionStore = () => {
  scrollPositionStore.scrollLeft = 0;
  scrollPositionStore.scrollRatio = 0;
  scrollPositionStore.restored = false;
  scrollPositionStore.isTransitioning = false;
  scrollPositionStore.emakiId = null;
};

// 教育現場向けUI: 絵巻切り替え検出用
// モジュールスコープに配置することで、コンポーネント再マウント時も前回値を保持
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

  const { backgroundImage, kotobagaki, sceneText, type } = data;
  const { locale, locales, asPath, defaultLocale } = useRouter();

  const wrapperRef = useRef();
  const articleRef = useRef();
  const scrollNextRef = useRef(null);
  const scrollPrevRef = useRef(null);

  // P0改修: scrollPositionStore はモジュールスコープに移動済み
  // （コンポーネント再マウント時も値を保持するため）

  // 教育現場向けUI: ホイール操作時のトースト表示
  const [showWheelToast, setShowWheelToast] = useState(false);

  // 教育現場向けUI: スクロール端点の状態管理（操作手段に依存しない）
  const [isAtStart, setIsAtStart] = useState(true); // 開始位置（右端）にいるか
  const [isAtEnd, setIsAtEnd] = useState(false); // 終了位置（左端）にいるか
  const isAtStartRef = useRef(true); // scroll ハンドラ再登録回避用
  const isAtEndRef = useRef(false);

  // 教育現場向けUI: 巻末ナッジ（次巻が存在する場合のみ）
  // 巻末到達中に他の巻へのカードを表示し、「続きがある」ことを伝える
  const hasNextVolume = editionLinks.length > 0 || showKusouzuHubLink || showChojuGigaHubLink;

  // prevDataIdはモジュールスコープに移動済み（絵巻切り替え検出用）

  // 解説バー追従用のローカル state。
  // 自動再生中は navIndex（グローバル）を止めて数十枚の next/image の再レンダーを避ける一方、
  // SceneCommentaryBar の段タイトルはこの値で追従させる（画像ツリーへ波及させず軽量に更新）。
  // 通常時は navIndex と同期する（下記の同期 effect）。
  const [liveSceneIndex, setLiveSceneIndex] = useState(navIndex);

  const [isScrollFeedbackOpen, setIsScrollFeedbackOpen] = useState(false);
  const [scrollFeedbackSubmitted, setScrollFeedbackSubmitted] = useState(false);
  const [endPromptDismissed, setEndPromptDismissed] = useState(false);
  const [sharePromptDismissed, setSharePromptDismissed] = useState(false);
  const [midFeedbackDismissed, setMidFeedbackDismissed] = useState(false);
  const [scrollRatioBucket, setScrollRatioBucket] = useState(0);

  const emakiId = data.titleen;

  // 絵巻ハイパーリンク: 前回検出したシーン（不要な更新を防ぐ）
  const lastDetectedSceneRef = useRef(navIndex);

  // 教育現場向けUI: 静かな現在地インジケータ（PositionIndicator の DOM要素への参照）
  const indicatorElRef = useRef(null);

  const [isScrolling, setIsScrolling] = useState(false); // スクロール中か
  const isScrollingRef = useRef(false); // setIsScrolling呼び出し最適化用

  // 教育現場向けUI: 静止UI耐性 + 自動スクロール制御（初回ナッジ/再生モード）
  // useEmakiAutoPlay が useEmakiIdleUI を内部合成する（両者の循環依存を解消）
  const {
    isAutoScrolling,
    isPlayMode,
    startPlayMode,
    stopPlayMode,
    playModeAnimationRef,
    setIsPlayMode,
    isUIVisible,
    showUI,
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
  });

  // スクロール処理 + 現在シーン検出（useEmakiScroll が sectionsCacheRef / scrollDimsRef を管理）
  const { sectionsCacheRef, scrollDimsRef } = useEmakiScroll({
    articleRef,
    dataId: data.id,
    emakiId,
    navIndex,
    setnavIndex,
    setLiveSceneIndex,
    isScrollDetectedUpdateRef,
    isAutoScrolling,
    playModeAnimationRef,
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
  });

  useEffect(() => {
    if (emakiId) {
      setScrollFeedbackSubmitted(hasSubmittedScrollFeedback(emakiId));
      setSharePromptDismissed(hasDismissedPullPrompt(emakiId, "share"));
      setMidFeedbackDismissed(hasDismissedPullPrompt(emakiId, "mid_feedback"));
      setScrollRatioBucket(0);
    }
  }, [emakiId]);

  useEffect(() => {
    if (!isAtEnd) {
      setEndPromptDismissed(false);
    }
  }, [isAtEnd]);

  const getScrollRatio = useCallback(() => {
    const el = articleRef.current;
    if (!el) return null;
    const maxScroll = el.scrollWidth - el.clientWidth;
    // レイアウト未完了時は誤って 100% と判定しない
    if (maxScroll <= 0) return null;
    // RTL 横スクロールでは scrollLeft が負になる
    return Math.round((Math.abs(el.scrollLeft) / maxScroll) * 1000) / 1000;
  }, []);

  // 中間プロンプト用: スクロール停止〜400ms で進捗バケット更新（1.5s の isScrolling とは独立）
  useEffect(() => {
    if (!scroll) return;
    const el = articleRef.current;
    if (!el) return;

    let timer = null;
    const updateBucket = () => {
      const r = getScrollRatio();
      if (r == null) return;
      if (r >= 0.55) setScrollRatioBucket((b) => Math.max(b, 0.55));
      else if (r >= 0.3) setScrollRatioBucket((b) => Math.max(b, 0.3));
    };
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(updateBucket, 400);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    // シーンジャンプ直後など
    updateBucket();

    return () => {
      if (timer) clearTimeout(timer);
      el.removeEventListener("scroll", onScroll);
    };
  }, [scroll, getScrollRatio, emakiId, navIndex]);

  const handleScrollFeedbackSubmitted = useCallback(() => {
    setScrollFeedbackSubmitted(true);
    setEndPromptDismissed(true);
    setMidFeedbackDismissed(true);
  }, []);

  const shareTitle =
    locale === "en"
      ? emakiDisplayTitle(data, locale)
      : `${data.title ?? ""}${data.edition ? ` ${data.edition}` : ""}`.trim();

  const handleSharePromptCopy = useCallback(async () => {
    const url = buildShareUrl({
      locale,
      asPath,
      locales,
      defaultLocale,
      navIndex,
    });
    try {
      await navigator.clipboard.writeText(url);
      gtag.event("sns_share_click", {
        platform: "copy",
        emaki_id: emakiId || "",
        scene_index: navIndex ?? 0,
        source: "mid_prompt",
      });
    } catch (err) {
      console.error("Share prompt copy failed:", err);
    }
    markPullPromptDismissed(emakiId, "share");
    setSharePromptDismissed(true);
  }, [locale, asPath, locales, defaultLocale, navIndex, emakiId]);

  const dismissSharePrompt = useCallback(() => {
    markPullPromptDismissed(emakiId, "share");
    setSharePromptDismissed(true);
  }, [emakiId]);

  const dismissMidFeedbackPrompt = useCallback(() => {
    markPullPromptDismissed(emakiId, "mid_feedback");
    setMidFeedbackDismissed(true);
  }, [emakiId]);

  const showSharePullPrompt =
    scroll &&
    !isAtEnd &&
    !sharePromptDismissed &&
    !isScrollFeedbackOpen &&
    scrollRatioBucket >= 0.3 &&
    isUIVisible;

  const showMidFeedbackPrompt =
    scroll &&
    !isAtEnd &&
    !scrollFeedbackSubmitted &&
    !midFeedbackDismissed &&
    !isScrollFeedbackOpen &&
    !showSharePullPrompt &&
    scrollRatioBucket >= 0.55 &&
    isUIVisible;

  // 巻末: フィードバック未回答でもいいね・共有は出す（回答済みなら feedback ボタンのみ隠す）
  const showScrollFeedbackEndPrompt =
    scroll &&
    isAtEnd &&
    !endPromptDismissed &&
    !isScrollFeedbackOpen &&
    isUIVisible &&
    !showSharePullPrompt &&
    !showMidFeedbackPrompt;

  // 手のひらモード（PC限定）: マウス押下で表示 + ドラッグで絵巻を移動
  // - 押した瞬間に手のひらアイコン・grabカーソルを表示
  // - 押したままドラッグで横スクロール（紙を掴んで動かす感覚）
  // - 離すと終了。スマホ（タッチ）では従来どおりスワイプ操作のため無効
  const { isPalmMode, suppressClickUntilRef } = useEmakiPalmDrag(articleRef);

  // 絵巻ハイパーリンク: スクロール位置から現在表示中のシーンを検出
  // （useEmakiScroll 内の detectCurrentScene が sectionsCacheRef を管理）

  // 解説バー追従値: navIndex が外部（handleToId / hash / 停止時同期）で変化した場合も
  // liveSceneIndex へ同期する。再生中は detectCurrentScene が liveSceneIndex を上書きし
  // 続けるため、この effect は navIndex が変わらない限り再実行されない（競合なし）。
  useEffect(() => {
    setLiveSceneIndex(navIndex);
  }, [navIndex]);

  // 教育現場向けUI: 巻末ナッジ
  // isAtEnd 中は他巻カードを表示、離れると非表示
  const showEndNudge = isAtEnd && hasNextVolume;

  // P0改修: フルスクリーン切り替え時のスクロール位置復元
  // toggleFullscreen state の変化を監視して復元処理を行う
  useScrollPositionRestore({
    articleRef,
    dataId: data.id,
    toggleFullscreen,
    orientation,
    scrollPositionStore,
  });

  // 全画面切替や向き切替でビューポートサイズが変わるためシーン検出キャッシュを無効化
  useEffect(() => {
    sectionsCacheRef.current = null;
    scrollDimsRef.current = { w: 0, c: 0, ts: 0 };
  }, [toggleFullscreen, orientation]);

  // 教育現場向けUI: 絵巻切り替え時のリセット処理
  // Chrome系でキャッシュが残る問題への対応
  // フルスクリーン切り替え（再マウント）時はリセットしない
  useEffect(() => {
    // 実際に絵巻が切り替わった場合のみリセット
    // prevDataIdはモジュールスコープなので再マウントでも値が保持される
    if (prevDataId !== null && prevDataId !== data.id) {
      // 再生モードを停止
      if (playModeAnimationRef.current) {
        cancelAnimationFrame(playModeAnimationRef.current);
        playModeAnimationRef.current = null;
      }
      setIsPlayMode(false);

      // スクロール位置ストアをリセット（フルスクリーン復元用）
      scrollPositionStore.scrollLeft = 0;
      scrollPositionStore.scrollRatio = 0;
      scrollPositionStore.restored = false;
      scrollPositionStore.isTransitioning = false;
      scrollPositionStore.emakiId = null;

      // DOM 横スクロールを先頭（右端）へリセット
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

      // キャッシュを無効化（新しい絵巻のセクション・サイズを再取得するため）
      sectionsCacheRef.current = null;
      scrollDimsRef.current = { w: 0, c: 0, ts: 0 };

      // 計測: 全計測状態をリセット
      resetAllTracking();
    }

    // 前回のdata.idを更新（初回マウント時も含む）
    prevDataId = data.id;

    // 計測: セッション環境コンテキスト（1セッション1回のみ送信される）
    trackSessionContext(emakiId, backgroundImage?.length || 0);
  }, [data.id, emakiId, backgroundImage]);

  useEffect(() => {
    const ref = articleRef.current;
    const coordinate = ref.getBoundingClientRect();
  }, [articleRef]);

  useEffect(() => {
    if (scroll) {
      let scrollSpeed = 30;
      const el = articleRef.current;
      const MouseWheelHandler = (e) => {
        // block if e.deltaY==0
        // 垂直方向のスクロールがゼロならばリターン
        if (!e.deltaY) return;

        // 教育現場向けUI: 初回ホイール操作時にトースト表示
        // セッション内で1回のみ表示（sessionStorageで管理）
        const toastKey = "wheel_toast_shown";
        if (!sessionStorage.getItem(toastKey)) {
          sessionStorage.setItem(toastKey, "true");
          setShowWheelToast(true);
        }

        // 計測: 手動スクロール操作（wheel）
        trackManualScroll(emakiId, "wheel");

        // 教育現場向けUI: 再生モード中はホイール操作で停止
        if (playModeAnimationRef.current) {
          cancelAnimationFrame(playModeAnimationRef.current);
          playModeAnimationRef.current = null;
          setIsPlayMode(false);
          showUI();
          e.preventDefault();
          return;
        }

        // Set scrollDirection (-1 = up // 1 = down)
        let scrollDirection = e.deltaY > 0 ? 1 : -1;

        // RTL環境考慮: scrollLeft と端点判定
        let scrollLeft = el.scrollLeft;
        let scrollWidth = el.scrollWidth;
        let clientWidth = el.clientWidth;
        let maxScrollLeft = scrollWidth - clientWidth;

        // 教育現場向けUI: 端点判定（handleScroll と同じロジック）
        // RTL環境では scrollLeft が負の値になるため、絶対値で判定
        const SCROLL_MARGIN = 5; // ピクセル誤差を許容

        // 開始位置判定: scrollLeft が 0 または正の最大値（RTL環境考慮）
        const atStart = Math.abs(scrollLeft) < SCROLL_MARGIN ||
                        scrollLeft >= maxScrollLeft - SCROLL_MARGIN;

        // 終了位置判定: scrollLeft が負の最大値または 0 付近（RTL環境考慮）
        const atEnd = Math.abs(scrollLeft) >= maxScrollLeft - SCROLL_MARGIN ||
                      (scrollLeft < 0 && Math.abs(scrollLeft) >= maxScrollLeft - SCROLL_MARGIN);

        // スクロール実行（端点でなければ）
        if (
          (scrollDirection === -1 && !atEnd) ||   // 上回転（左進行） かつ 終了位置でない
          (scrollDirection === 1 && !atStart)     // 下回転（右進行） かつ 開始位置でない
        ) {
          // convert vertical scroll into horizontal
          // 縦スクロールを横スクロールに変換
          el.scrollLeft += scrollSpeed * scrollDirection;
        }

        // 教育現場向けUI: 絵巻コンテナ上では横スクロールとして扱う
        e.preventDefault();
        return true;
      };

      // クロスブラウザ対応: 標準の wheel イベントを使用（Firefox対応）
      el.addEventListener("wheel", MouseWheelHandler, false);

      // クリーンアップ処理
      return () => {
        el.removeEventListener("wheel", MouseWheelHandler, false);
      };
    }
  }, [scroll, emakiId]);

  // 手のひらモード時: 画像のネイティブドラッグを抑止する。
  // パン effect 内の dragstart preventDefault で常時抑止しているため、
  // ここでの draggable 属性切替は不要（押下→再描画の競合も回避される）

  // 配列を展開し、条件ごとに連番を付与（emakiItemIndexer に切り出し済み）
  const processedEmakis = assignUniqueIndex(data.emakis);

  // ボトムコメントバー: 詞書画像かシーンテキストを持つ絵巻のみ表示
  const showCommentaryBar = Boolean(scroll && (kotobagaki || sceneText));

  return (
    <SceneLikeCountsProvider emakiId={emakiId}>
      <div
        className={`${
          orientation === "landscape" && scroll ? styles.land : styles.prt
        }`}
      >
        <div
          className={`js-scrollable entry-container ${
            showCommentaryBar ? commentaryStyles.hasCommentaryBar : ""
          }`}
          style={{
            // 角丸クリップ: 通常表示時のみ（全画面時は overflow で UI はみ出しを防止）
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
            position: "relative", // 子要素の絶対配置の基準点
            // ボトムコメントバーは block 要素として article の直後に配置する
            // （entry-container を flex にすると article が min-content 幅に
            //  伸びて横スクロールが壊れるため flex は使わない）
          }}
        >
        {scroll && <FullScreen isUIVisible={isUIVisible} />}
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
              onOpenScrollFeedback={() => setIsScrollFeedbackOpen(true)}
              showScrollFeedbackButton={!scrollFeedbackSubmitted}
            />
          </>
        )}
        {scroll && toggleFullscreen && (
          <EmakiInfo value={data} isUIVisible={isUIVisible} />
        )}
        {scroll && isHelpModalOpen && <HelpModal />}
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
        {scroll && (
          <ViewerPullPrompt
            mode="share"
            isVisible={showSharePullPrompt}
            onPrimary={handleSharePromptCopy}
            onDismiss={dismissSharePrompt}
          />
        )}
        {scroll && (
          <ViewerPullPrompt
            mode="mid_feedback"
            isVisible={showMidFeedbackPrompt}
            onPrimary={() => {
              markPullPromptDismissed(emakiId, "mid_feedback");
              setMidFeedbackDismissed(true);
              setIsScrollFeedbackOpen(true);
            }}
            onDismiss={dismissMidFeedbackPrompt}
          />
        )}
        {scroll && (
          <ScrollFeedbackEndPrompt
            isVisible={showScrollFeedbackEndPrompt}
            onOpenFeedback={() => setIsScrollFeedbackOpen(true)}
            onDismiss={() => setEndPromptDismissed(true)}
            emakiId={emakiId}
            shareTitle={shareTitle}
            navIndex={navIndex}
            showFeedback={!scrollFeedbackSubmitted}
          />
        )}
        <article
          className={`${styles.container} ${styles.rl} scrollbar ${
            isPalmMode ? styles.palmMode : ""
          }`}
          style={{
            "--screen-height": height,
            "--screen-width": width,
            "--overflow-x": overflowX,
            "--box-shadow": boxshadow,
            // 角丸は外側ラッパー(entry-container)で管理するため、ここでは設定しない
          }}
          onClick={() => {
            // 再生モード中はクリックで停止
            if (isPlayMode) {
              stopPlayMode();
              return;
            }
            // 手のひらモードのドラッグ直後のclickは抑止（sidebarが閉じないように）
            if (Date.now() < suppressClickUntilRef.current) return;
            setOepnSidebar(false);
          }}
          onDoubleClick={(e) => {
            // PC: ダブルクリックで全画面入/切（ボタン・リンク上は無視）
            if (e.target.closest("button, a, [role='button']")) return;
            if (Date.now() < suppressClickUntilRef.current) return;
            handleFullScreen("landscape");
          }}
          onTouchStart={() => {
            // 再生モード中はタッチで停止
            if (isPlayMode) {
              stopPlayMode();
            }
            // 計測: 手動スクロール操作（touch）
            // 自動スクロール中でない場合のみ（自動スクロール中断は別で計測）
            if (!isAutoScrolling) {
              trackManualScroll(emakiId, "touch");
            }
          }}
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
                kotobagaki={kotobagaki}
                sceneText={sceneText}
                type={type}
                selectedRef={selectedRef}
                navIndex={navIndex}
                uniqueIndex={item.uniqueIndex} // 新しい連番を渡す
                scroll={scroll}
                isPlayMode={isPlayMode} // 再生モード時は全画像を eager loading
              />
            );
          })}
          {/* 教育現場向けUI: 巻末ナッジ
              次巻が存在する場合に巻末到達中にカードを表示
              row-reverse内の最終子要素 = 左端に配置
              position:sticky で左端ビューポートに固定 */}
          {hasNextVolume && (
            <EndNudgeCard
              editionLinks={editionLinks}
              showKusouzuHubLink={showKusouzuHubLink}
              showChojuGigaHubLink={showChojuGigaHubLink}
              showEndNudge={showEndNudge}
            />
          )}
        </article>
        {showCommentaryBar && (
          <SceneCommentaryBar
            data={data}
            navIndex={isPlayMode || isAutoScrolling ? liveSceneIndex : navIndex}
            isFullscreen={toggleFullscreen}
          />
        )}
        </div>
      </div>
    </SceneLikeCountsProvider>
  );
};

export default EmakiContainer;
