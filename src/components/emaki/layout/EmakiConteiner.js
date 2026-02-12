import EmakiInfo from "@/components/emaki/metadata/EmakiInfo";
import EmakiNavigation from "@/components/emaki/navigation/EmakiNavigation";
import CarouselButton from "@/components/emaki/viewer/CarouselButton";
import FullScreen from "@/components/emaki/viewer/FullScreen";
import HelpModal from "@/components/emaki/viewer/HelpModal";
import Modal from "@/components/emaki/viewer/Modal";
import ModalDesc from "@/components/emaki/viewer/ModalDesc";
import PositionIndicator from "@/components/emaki/viewer/PositionIndicator";
import SwitcherEmaki from "@/components/emaki/viewer/SwitcherEmaki";
import WheelScrollIndicator from "@/components/emaki/viewer/WheelScrollIndicator";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/EmakiConteiner.module.css";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton, Tooltip, useBreakpointValue } from "@chakra-ui/react";
import { useTranslation } from "next-i18next";
import {
  trackAutoScrollStarted,
  trackAutoScrollInterrupted,
  trackManualScroll,
  getDeviceType,
  trackUIHidden,
  trackUIRevealed,
  resetAllTracking,
  handleSceneChange,
  trackInitialLoadWithHash,
} from "@/libs/api/measurementUtils";

// P0改修: フルスクリーン切り替え時のスクロール位置保存用
// モジュールスコープに配置することで、コンポーネント再マウント時も値を保持
const scrollPositionStore = {
  scrollLeft: 0,
  scrollRatio: 0,
  restored: false,      // 復元完了フラグ（複数回の復元によるジャンプ防止）
  isTransitioning: false, // 復元中フラグ（保存の上書きを防止）
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
}) => {
  const {
    isModalOpen,
    setOepnSidebar,
    oepnSidebar,
    orientation,
    handleToId,
    toggleFullscreen,
    isMapModalOpen,
    isDescModalOpen,
    isHelpModalOpen,
    setnavIndex,
    isScrollDetectedUpdateRef,
  } = useContext(AppContext);

  const { backgroundImage, kotobagaki, type, genjieslug } = data;
  const { t } = useTranslation("common");
  const isMobileToggle = useBreakpointValue({ base: true, md: false });

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
  const [isAutoScrolling, setIsAutoScrolling] = useState(false); // 自動スクロール中か（初回ナッジ用）

  // 教育現場向けUI: 再生モード（ユーザー任意の自動スクロール）
  // 初回ナッジ（isAutoScrolling）とは独立した状態として管理
  const [isPlayMode, setIsPlayMode] = useState(false);
  const playModeAnimationRef = useRef(null); // 再生モードのアニメーションID
  // prevDataIdはモジュールスコープに移動済み（絵巻切り替え検出用）

  // 教育現場向けUI: 静止UI耐性（Idle UI）- 長時間投影時の視覚的ノイズ軽減
  const [isUIVisible, setIsUIVisible] = useState(true); // UI表示状態
  const idleTimeoutRef = useRef(null); // 無操作タイマー

  // 教育現場向けUI: 完全非表示トグル（Hキー / トグルボタン）
  // 教師がプロジェクター投影中にUIを明示的に隠し続けるための機能
  // idle timerとは独立して動作し、ユーザー操作によるUI再表示を抑制する
  // ref: イベントハンドラ内の同期ガード用（クロージャ内で最新値を参照）
  // state: JSX描画用（再レンダーを確実にトリガー）
  const isUIForceHiddenRef = useRef(false);
  const [isUIForceHidden, setIsUIForceHidden] = useState(false);
  const [isToggleBtnHovered, setIsToggleBtnHovered] = useState(false);

  // 絵巻ハイパーリンク: シーン検出用の debounce タイマー + throttle
  const sceneDetectionTimerRef = useRef(null);
  const lastSceneDetectionTimeRef = useRef(0); // throttle用タイムスタンプ
  const lastDetectedSceneRef = useRef(navIndex); // 前回検出したシーン（不要な更新を防ぐ）

  // 教育現場向けUI: 静かな現在地インジケータ
  // パフォーマンス: scrollRatio はReact stateではなくDOM直接操作で更新
  // スクロール中のEmakiConteiner再レンダリングを完全に排除
  const indicatorElRef = useRef(null); // PositionIndicatorのDOM要素への参照
  const [isScrolling, setIsScrolling] = useState(false); // スクロール中か
  const isScrollingRef = useRef(false); // setIsScrolling呼び出し最適化用
  const scrollingTimerRef = useRef(null); // スクロール検出タイマー

  // 絵巻ハイパーリンク: スクロール位置から現在表示中のシーンを検出
  // パフォーマンス: 初回のみ getBoundingClientRect でセクション位置を計算・キャッシュし、
  // 以降は scrollLeft の算術演算のみでシーンを特定（DOM読み取り・レイアウト強制ゼロ）
  const sectionsCacheRef = useRef(null);

  const detectCurrentScene = useCallback(() => {
    const el = articleRef.current;
    if (!el) return;

    // 初回: セクション位置をキャッシュ（getBoundingClientRect は1回だけ）
    // items プロパティの存在もチェック（HMRで旧形式キャッシュが残る場合の対策）
    if (!sectionsCacheRef.current?.items) {
      const sections = Array.from(el.querySelectorAll("section[id]"));
      if (sections.length === 0) return;

      const containerRight = el.getBoundingClientRect().right;
      const baseScrollLeft = el.scrollLeft;

      sectionsCacheRef.current = {
        baseScrollLeft,
        items: sections.map((section) => ({
          id: parseInt(section.id, 10),
          // コンテナ右端からのオフセット（スクロール位置に依存しない定数）
          offset: section.getBoundingClientRect().right - containerRight,
        })),
      };
    }

    // 2回目以降: scrollLeft の差分だけでシーンを特定（DOM読み取りなし）
    const cache = sectionsCacheRef.current;
    const scrollDelta = el.scrollLeft - cache.baseScrollLeft;

    let closestId = null;
    let closestDistance = Infinity;

    cache.items.forEach(({ id, offset }) => {
      const distance = Math.abs(offset - scrollDelta);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestId = id;
      }
    });

    if (closestId !== null && !isNaN(closestId) && closestId !== lastDetectedSceneRef.current) {
      // 計測: シーン遷移・滞在（スクロール検出による）
      handleSceneChange(data.id, closestId, "scroll_detect");

      lastDetectedSceneRef.current = closestId;
      // 絵巻ハイパーリンク: スクロール検出による更新であることをマーク
      // scrollDialog の自動スクロールを抑制するため
      if (isScrollDetectedUpdateRef) {
        isScrollDetectedUpdateRef.current = true;
      }
      setnavIndex(closestId);
      // フラグを解除（scrollDialog の処理が完了するまで少し待つ）
      setTimeout(() => {
        if (isScrollDetectedUpdateRef) {
          isScrollDetectedUpdateRef.current = false;
        }
      }, 100);
    }
  }, [setnavIndex, isScrollDetectedUpdateRef, data.id]);


  // 教育現場向けUI: Hキーによる完全非表示トグル
  useEffect(() => {
    const handleForceHideToggle = (e) => {
      if (e.key !== 'h' && e.key !== 'H') return;

      // テキスト入力中は無視
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;

      const next = !isUIForceHiddenRef.current;
      isUIForceHiddenRef.current = next;
      setIsUIForceHidden(next);
      if (next) {
        // 強制非表示: UIを即座に隠し、idle timerを停止
        setIsUIVisible(false);
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }
      } else {
        // 解除: 通常のidle cycleに復帰（UIを一旦表示し、タイマーに委ねる）
        setIsUIVisible(true);
      }
    };
    window.addEventListener('keydown', handleForceHideToggle);
    return () => window.removeEventListener('keydown', handleForceHideToggle);
  }, []);

  // 教育現場向けUI: 静止UI耐性 - ユーザー操作検出とタイマー管理
  // 計測用: タイマー開始時刻を記録
  const idleStartTimeRef = useRef(Date.now());
  const wasUIHiddenRef = useRef(false); // UI非表示状態だったかを記録

  useEffect(() => {
    // デバイス幅に応じた無操作タイムアウト時間
    // PC (1024px以上): 5秒、Tablet/Mobile: 3秒
    const getIdleTimeout = () => {
      const width = window.innerWidth;
      return width >= 1024 ? 5000 : 3000;
    };

    // タイマーのクリア
    const clearIdleTimer = () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
    };

    // タイマーの開始
    const startIdleTimer = () => {
      clearIdleTimer();
      idleStartTimeRef.current = Date.now(); // 計測用: タイマー開始時刻を記録
      const idleTimeout = getIdleTimeout();
      idleTimeoutRef.current = setTimeout(() => {
        // 自動スクロール中は非表示にしない
        if (!isAutoScrolling) {
          // 計測: UI非表示
          trackUIHidden(data.id, idleTimeout);
          wasUIHiddenRef.current = true;
          setIsUIVisible(false);
        }
      }, idleTimeout);
    };

    // ユーザー操作検出時の処理（トリガー種別付き）
    const handleUserActivityWithType = (triggerType) => {
      // 完全非表示トグル中はUI再表示を抑制
      if (isUIForceHiddenRef.current) return;

      // 計測: UI再表示（非表示状態からの復帰時のみ）
      if (wasUIHiddenRef.current) {
        trackUIRevealed(data.id, triggerType);
        wasUIHiddenRef.current = false;
      }
      // UIを即座に表示
      setIsUIVisible(true);
      // タイマーをリセット
      startIdleTimer();
    };

    // 各イベント種別のハンドラー
    const handleMousemove = () => handleUserActivityWithType("mousemove");
    const handleWheel = () => handleUserActivityWithType("wheel");
    const handleTouchstart = () => handleUserActivityWithType("touch");
    const handleClick = () => handleUserActivityWithType("click");
    const handleKeydown = () => handleUserActivityWithType("keydown");

    // 自動スクロール中はタイマーを停止
    if (isAutoScrolling) {
      clearIdleTimer();
    } else {
      // 自動スクロール終了後にタイマー開始
      startIdleTimer();
    }

    // イベントリスナーの登録
    // マウス移動、ホイール、タッチ、クリック、キーボード操作を検出
    window.addEventListener("mousemove", handleMousemove);
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchstart, { passive: true });
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeydown);

    // クリーンアップ
    return () => {
      clearIdleTimer();
      window.removeEventListener("mousemove", handleMousemove);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchstart);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [isAutoScrolling, data.id]); // 依存配列: 自動スクロール状態の変化を監視

  // パフォーマンス: scrollWidth/clientWidth のキャッシュ
  // 自動再生中は値が変化しないため、毎フレームのレイアウト読み取りを回避
  const scrollDimsRef = useRef({ w: 0, c: 0, ts: 0 });

  useEffect(() => {
    if (!articleRef.current) return;
    const el = articleRef.current;
    const handleScroll = () => {
      const currentScrollX = el.scrollLeft;

      // scrollWidth/clientWidth: 1秒間隔でキャッシュ更新
      // 自動再生中はコンテンツサイズが不変のため、毎フレームの読み取りは不要
      const now = Date.now();
      if (now - scrollDimsRef.current.ts > 1000) {
        scrollDimsRef.current = { w: el.scrollWidth, c: el.clientWidth, ts: now };
      }
      const scrollWidth = scrollDimsRef.current.w || el.scrollWidth;
      const clientWidth = scrollDimsRef.current.c || el.clientWidth;

      // 教育現場向けUI: 端点判定（操作手段に依存しない）
      // RTL環境では scrollLeft が負の値になるため、絶対値で判定
      const SCROLL_MARGIN = 5; // ピクセル誤差を許容
      const maxScrollLeft = scrollWidth - clientWidth;

      // P0改修: スクロール位置を常に保存（フルスクリーン切り替え時の復元用）
      // ただし、復元中は保存をスキップ（上書き防止）
      if (maxScrollLeft > 0 && !scrollPositionStore.isTransitioning) {
        scrollPositionStore.scrollLeft = currentScrollX;
        scrollPositionStore.scrollRatio = Math.abs(currentScrollX) / maxScrollLeft;
        scrollPositionStore.restored = false;
      }

      // 教育現場向けUI: 現在地インジケータ用の進行度を計算
      // パフォーマンス: DOM直接操作でReact再レンダリングを完全に回避
      if (maxScrollLeft > 0) {
        const ratio = Math.abs(currentScrollX) / maxScrollLeft;

        // PositionIndicatorのDOM要素を直接更新（React stateを経由しない）
        if (indicatorElRef.current) {
          const isDesktop = window.innerWidth >= 1024;
          const trackW = isDesktop ? 180 : 120;
          const indSize = isDesktop ? 12 : 8;
          const position = (1 - ratio) * (trackW - indSize);
          indicatorElRef.current.style.transform = `translateX(${position}px) translateY(-50%)`;
        }

        // isScrolling: 開始時に1回だけsetStateを呼ぶ（ref で重複呼び出しを防止）
        if (!isScrollingRef.current) {
          isScrollingRef.current = true;
          setIsScrolling(true);
        }
      }

      const isAutoPlay = isAutoScrolling || playModeAnimationRef.current;

      // スクロール停止検出 + debounce: 自動再生中はタイマーチャーンを回避
      // 自動再生中は毎フレーム clearTimeout+setTimeout（120回/秒）が不要
      if (!isAutoPlay) {
        // 手動スクロール: 停止検出タイマー（1.5秒後に isScrolling = false）
        if (scrollingTimerRef.current) {
          clearTimeout(scrollingTimerRef.current);
        }
        scrollingTimerRef.current = setTimeout(() => {
          isScrollingRef.current = false;
          setIsScrolling(false);
        }, 1500);

        // 手動スクロール: debounce で最終シーン検出（150ms後）
        if (sceneDetectionTimerRef.current) {
          clearTimeout(sceneDetectionTimerRef.current);
        }
        sceneDetectionTimerRef.current = setTimeout(() => {
          lastSceneDetectionTimeRef.current = Date.now();
          detectCurrentScene();
        }, 150);
      }

      // 開始位置判定: scrollLeft が 0 または正の最大値（RTL環境考慮）
      const atStart =
        Math.abs(currentScrollX) < SCROLL_MARGIN ||
        currentScrollX >= maxScrollLeft - SCROLL_MARGIN;

      // 終了位置判定: scrollLeft が負の最大値または 0 付近（RTL環境考慮）
      const atEnd =
        Math.abs(currentScrollX) >= maxScrollLeft - SCROLL_MARGIN ||
        (currentScrollX < 0 &&
          Math.abs(currentScrollX) >= maxScrollLeft - SCROLL_MARGIN);

      // 状態更新（変化がある場合のみ）
      if (atStart !== isAtStart) {
        setIsAtStart(atStart);
      }
      if (atEnd !== isAtEnd) {
        setIsAtEnd(atEnd);
      }

      // 絵巻ハイパーリンク: 自動再生中のシーン検出（800ms間隔）
      // スクロールハンドラ内で同期実行（rAFに遅延するとauto-playの
      // scrollToと同一フレーム内で競合しレイアウトスラッシングが悪化するため）
      if (isAutoPlay) {
        if (now - lastSceneDetectionTimeRef.current > 800) {
          lastSceneDetectionTimeRef.current = now;
          detectCurrentScene();
        }
      }
    };

    el.addEventListener("scroll", handleScroll);

    // 計測: マウスドラッグによるスクロール操作
    const handleMousedown = () => {
      if (!isAutoScrolling) {
        trackManualScroll(data.id, "drag");
      }
    };
    el.addEventListener("mousedown", handleMousedown);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      el.removeEventListener("mousedown", handleMousedown);
      // クリーンアップ: シーン検出タイマーもクリア
      if (sceneDetectionTimerRef.current) {
        clearTimeout(sceneDetectionTimerRef.current);
      }
    };
  }, [isAtStart, isAtEnd, detectCurrentScene, isAutoScrolling, data.id]);

  // P0改修: フルスクリーン切り替え時のスクロール位置復元
  // toggleFullscreen state の変化を監視して復元処理を行う
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    // 初回マウント時はスキップ（スクロール位置が保存されていない）
    if (scrollPositionStore.scrollRatio === 0) return;

    // 新しいトグル時に restored フラグをリセット
    // これにより2回目以降のトグルでも復元が実行される
    scrollPositionStore.restored = false;

    // 復元中フラグを立てる（スクロールイベントによる上書きを防止）
    scrollPositionStore.isTransitioning = true;

    // スクロール位置を復元する関数
    const restoreScrollPosition = () => {
      // 既に復元済みならスキップ（複数回の復元によるジャンプ防止）
      if (scrollPositionStore.restored) return;

      const scrollWidth = el.scrollWidth;
      const clientWidth = el.clientWidth;
      const maxScrollLeft = scrollWidth - clientWidth;

      // ビューポートサイズが確定していない場合はスキップ
      if (maxScrollLeft <= 0) return;

      if (scrollPositionStore.scrollRatio > 0) {
        const newScrollLeft = -(scrollPositionStore.scrollRatio * maxScrollLeft);
        el.scrollTo({ left: newScrollLeft, behavior: "auto" });
        scrollPositionStore.restored = true;
      }
    };

    // ブラウザのレイアウト再計算タイミングに対応するため複数回試行
    const timer1 = setTimeout(restoreScrollPosition, 100);
    const timer2 = setTimeout(restoreScrollPosition, 250);
    const timer3 = setTimeout(restoreScrollPosition, 400);

    // 復元完了後にフラグを解除（500ms後）
    const transitionTimer = setTimeout(() => {
      scrollPositionStore.isTransitioning = false;
    }, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(transitionTimer);
    };
  }, [toggleFullscreen]);

  // 教育現場向けUI: 初回表示時のみ、横スクロール可能性を
  // 緩やかな自動スクロールで認知させるナッジ（操作説明なし）
  useEffect(() => {
    const keyName = `visited_${data.id}`;
    const isFirstVisit = !sessionStorage.getItem(keyName);

    // 絵巻ハイパーリンク: hash付きURL（シーン指定リンク）で開いた場合はナッジをスキップ
    // ユーザーが特定シーンを共有した意図を尊重し、該当シーンから閲覧開始
    const hasHashInUrl = typeof window !== "undefined" && window.location.hash;

    // 計測: hash付きURLでの初期表示
    if (hasHashInUrl && isFirstVisit) {
      const hashSceneIndex = parseInt(window.location.hash.replace("#", ""), 10);
      if (!isNaN(hashSceneIndex)) {
        trackInitialLoadWithHash(data.id, hashSceneIndex);
      }
    }

    if (isFirstVisit && !hasHashInUrl) {
      const el = articleRef.current;
      if (!el) return;

      // デバイスタイプに応じたスクロール速度を設定
      // PC: 2.4px/frame, Tablet: 1.6px/frame, Mobile: 1.2px/frame
      const width = window.innerWidth;
      const scrollSpeed = width >= 1024 ? 2.4 : width >= 768 ? 1.6 : 1.2;

      let animationId = null;
      let stopped = false;

      // CSS scroll-behavior の干渉を防ぐため一時的に無効化
      const originalScrollBehavior = el.style.scrollBehavior;
      el.style.scrollBehavior = "auto";

      // スクロール可能な最小値（左端）
      const minScrollLeft = -(el.scrollWidth - el.clientWidth);

      const stopAutoScroll = (interruptMethod = null) => {
        if (stopped) return;
        stopped = true;

        // 計測: 自動スクロール中断（ユーザー操作による場合）
        if (interruptMethod) {
          const scrollWidth = el.scrollWidth;
          const clientWidth = el.clientWidth;
          const maxScrollLeft = scrollWidth - clientWidth;
          const scrollRatio = maxScrollLeft > 0 ? Math.abs(el.scrollLeft) / maxScrollLeft : 0;
          trackAutoScrollInterrupted(data.id, interruptMethod, scrollRatio);
        }

        // 教育現場向けUI: 自動スクロール停止を通知
        // これにより「戻る」ボタンが表示可能になる
        setIsAutoScrolling(false);

        // スクロール停止を通知（自動再生中はタイマーをスキップしているため明示的にリセット）
        isScrollingRef.current = false;
        setIsScrolling(false);

        if (animationId) cancelAnimationFrame(animationId);
        el.style.scrollBehavior = originalScrollBehavior;
        el.removeEventListener("mousedown", handleMousedown);
        el.removeEventListener("wheel", handleWheel);
        el.removeEventListener("touchstart", handleTouchstart);
        document.removeEventListener("click", handleClick);
      };

      // 計測用: 各操作種別のハンドラー
      const handleMousedown = () => stopAutoScroll("mousedown");
      const handleWheel = () => stopAutoScroll("wheel");
      const handleTouchstart = () => stopAutoScroll("touch");
      const handleClick = () => stopAutoScroll("click");

      const autoScroll = () => {
        if (stopped) return;

        const currentScrollLeft = el.scrollLeft;
        const newScrollLeft = currentScrollLeft - scrollSpeed;

        // スクロール範囲の端（左端）に到達したら停止
        if (newScrollLeft < minScrollLeft) {
          stopAutoScroll();
          return;
        }

        el.scrollTo({ left: newScrollLeft, behavior: "auto" });
        animationId = requestAnimationFrame(autoScroll);
      };

      // ユーザー操作（ドラッグ／ホイール／タッチ／クリック）で即座に停止
      el.addEventListener("mousedown", handleMousedown, { once: true });
      el.addEventListener("wheel", handleWheel, { once: true });
      el.addEventListener("touchstart", handleTouchstart, { once: true });
      document.addEventListener("click", handleClick, { once: true });

      // 初期描画後に自動スクロール開始（0.5秒遅延）
      const timerId = setTimeout(() => {
        // 絵巻ハイパーリンク: ナッジ開始直前に再度hashをチェック
        // SSG/hydration完了後にhashが正しく取得できるようになるため
        // useEffect冒頭のチェックだけでは不十分
        const hasHashNow = window.location.hash;
        if (hasHashNow) {
          stopped = true;
          el.style.scrollBehavior = originalScrollBehavior;
          return;
        }

        if (!stopped) {
          // 教育現場向けUI: 自動スクロール開始を通知
          // これにより「戻る」ボタンが非表示になる
          setIsAutoScrolling(true);

          // 計測: 初回自動スクロール開始
          trackAutoScrollStarted(data.id, getDeviceType());

          sessionStorage.setItem(keyName, true);
          animationId = requestAnimationFrame(autoScroll);
        }
      }, 500);

      return () => {
        clearTimeout(timerId);
        stopAutoScroll();
      };
    }
  }, [data.id]);

  // 教育現場向けUI: 再生モード - 停止関数
  // playModeAnimationRef.currentをnullにすることでアニメーションループを終了させる
  const stopPlayMode = () => {
    if (playModeAnimationRef.current) {
      cancelAnimationFrame(playModeAnimationRef.current);
      playModeAnimationRef.current = null;
    }

    setIsPlayMode(false);

    // スクロール停止を通知（自動再生中はタイマーをスキップしているため明示的にリセット）
    isScrollingRef.current = false;
    setIsScrolling(false);

    // UI復帰: 静止UI耐性のタイマーに委ねる
    setIsUIVisible(true);
  };

  // 教育現場向けUI: 再生モード - 開始関数
  const startPlayMode = () => {
    const el = articleRef.current;
    if (!el) return;

    // 既に再生中、または初回ナッジ中は開始しない
    if (playModeAnimationRef.current || isAutoScrolling) return;

    setIsPlayMode(true);

    // デバイスタイプに応じたスクロール速度（初回ナッジと同じ）
    const width = window.innerWidth;
    const scrollSpeed = width >= 1024 ? 2.4 : width >= 768 ? 1.6 : 1.2;

    // CSS scroll-behavior の干渉を防ぐため一時的に無効化
    const originalScrollBehavior = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";

    // スクロール可能な最小値（左端）
    const minScrollLeft = -(el.scrollWidth - el.clientWidth);

    const playScroll = () => {
      // 停止されていたら終了（refがnullなら停止済み）
      if (playModeAnimationRef.current === null) {
        el.style.scrollBehavior = originalScrollBehavior;
        return;
      }

      const currentScrollLeft = el.scrollLeft;
      const newScrollLeft = currentScrollLeft - scrollSpeed;

      // スクロール範囲の端（左端）に到達したら停止
      if (newScrollLeft < minScrollLeft) {
        setIsPlayMode(false);
        setIsUIVisible(true); // UI復帰
        el.style.scrollBehavior = originalScrollBehavior;
        playModeAnimationRef.current = null;
        return;
      }

      el.scrollTo({ left: newScrollLeft, behavior: "auto" });
      playModeAnimationRef.current = requestAnimationFrame(playScroll);
    };

    playModeAnimationRef.current = requestAnimationFrame(playScroll);
  };

  // 教育現場向けUI: 再生モード - クリーンアップ
  useEffect(() => {
    return () => {
      if (playModeAnimationRef.current) {
        cancelAnimationFrame(playModeAnimationRef.current);
        playModeAnimationRef.current = null;
      }
    };
  }, []);

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

      // キャッシュを無効化（新しい絵巻のセクション・サイズを再取得するため）
      sectionsCacheRef.current = null;
      scrollDimsRef.current = { w: 0, c: 0, ts: 0 };

      // 計測: 全計測状態をリセット
      resetAllTracking();
    }

    // 前回のdata.idを更新（初回マウント時も含む）
    prevDataId = data.id;
  }, [data.id]);

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
        trackManualScroll(data.id, "wheel");

        // 教育現場向けUI: 再生モード中はホイール操作で停止
        if (playModeAnimationRef.current) {
          cancelAnimationFrame(playModeAnimationRef.current);
          playModeAnimationRef.current = null;
          setIsPlayMode(false);
          setIsUIVisible(true);
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
  }, [scroll]);

  // 配列を展開し、条件ごとに連番を付与
  const processedEmakis = data.emakis.reduce(
    (acc, item, index) => {
      if (item.cat === "image") {
        acc.imageCounter += 1; // 画像のカウンターをインクリメント
        acc.result.push({
          ...item,
          uniqueIndex: acc.imageCounter - 1, // 独立した連番
        });
      } else if (item.cat === "ekotoba") {
        acc.ekotobaCounter += 1; // エコトバのカウンターをインクリメント
        acc.result.push({
          ...item,
          uniqueIndex: acc.ekotobaCounter - 1, // 独立した連番
        });
      } else {
        acc.result.push({
          ...item,
          uniqueIndex: null, // その他の場合、連番なし
        });
      }
      return acc;
    },
    { result: [], imageCounter: 0, ekotobaCounter: 0 },
  ).result;

  return (
    <div
      className={`${
        orientation === "landscape" && scroll ? styles.land : styles.prt
      }`}
    >
      <div
        className="js-scrollable entry-container"
        style={{
          // 角丸クリップ: 外側ラッパーで一括管理（スクロールバー領域も含めてクリップ）
          borderRadius:
            orientation === "landscape" &&
            scroll &&
            toggleFullscreen === false &&
            "12px",
          overflow:
            orientation === "landscape" &&
            scroll &&
            toggleFullscreen === false &&
            "hidden",
          position: "relative", // 子要素の絶対配置の基準点
        }}
      >
        {scroll && <FullScreen isUIVisible={isUIVisible} />}
        <CarouselButton
          articleRef={articleRef}
          isAtStart={isAtStart}
          isAtEnd={isAtEnd}
          isAutoScrolling={isAutoScrolling}
          isUIVisible={isUIVisible}
        />
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
            />
            {/* 教育現場向けUI: 完全非表示トグルボタン（aside外に独立配置）
                force-hidden時もこのボタンだけ低opacityで残留し、UI復帰手段を確保する
                ActionButtonと同じChakra UI Tooltip + IconButton構成で視覚的統一
                NOTE: opacity制御はsxで一元管理（_hoverのopacity動的変更はEmotion class競合を起こすため） */}
            <Tooltip
              label={isUIForceHidden ? t("viewer.showUI") : t("viewer.hideUI")}
              aria-label={isUIForceHidden ? t("viewer.showUI") : t("viewer.hideUI")}
              hasArrow
              isDisabled={isMobileToggle || (isUIForceHidden && !isToggleBtnHovered)}
              isOpen={isUIForceHidden && !isToggleBtnHovered ? false : undefined}
            >
              <IconButton
                icon={
                  <FontAwesomeIcon
                    icon={isUIForceHidden ? faEyeSlash : faEye}
                    style={{ fontSize: "1.5em" }}
                  />
                }
                onClick={(e) => {
                  e.stopPropagation();
                  const next = !isUIForceHiddenRef.current;
                  isUIForceHiddenRef.current = next;
                  setIsUIForceHidden(next);
                  if (next) {
                    setIsUIVisible(false);
                    if (idleTimeoutRef.current) {
                      clearTimeout(idleTimeoutRef.current);
                      idleTimeoutRef.current = null;
                    }
                  } else {
                    setIsUIVisible(true);
                  }
                }}
                onMouseEnter={() => setIsToggleBtnHovered(true)}
                onMouseLeave={() => setIsToggleBtnHovered(false)}
                aria-label={isUIForceHidden ? t("viewer.showUI") : t("viewer.hideUI")}
                variant="unstyled"
                size={{ base: "sm", md: "md" }}
                color="white"
                transition="all 0.3s linear"
                sx={{
                  paddingInlineStart: "0 !important",
                  paddingInlineEnd: "0 !important",
                  position: "absolute",
                  bottom: !isMobileToggle
                    ? "4%"
                    : "calc(1% + env(safe-area-inset-bottom, 0px))",
                  left: !isMobileToggle
                    ? "1%"
                    : "calc(1% + env(safe-area-inset-left, 0px))",
                  zIndex: 10,
                  // opacity制御: sx内で一元管理（_hoverは使わない）
                  // force-hidden時: 控えめに視認可能（0.45）、hover時に明確化（0.85）
                  // idle非表示時: 他UIと同様に消える
                  // 通常時: 完全表示
                  opacity: isUIForceHidden
                    ? (isToggleBtnHovered ? 0.85 : 0.45)
                    : isUIVisible
                      ? 1
                      : 0,
                  pointerEvents: isUIForceHidden || isUIVisible ? "auto" : "none",
                }}
                _hover={
                  !isMobileToggle
                    ? { transform: "scale(1.4)", color: "#ff8c77" }
                    : { color: "#ff8c77" }
                }
              />
            </Tooltip>
          </>
        )}
        {scroll && toggleFullscreen && (
          <EmakiInfo value={data} isUIVisible={isUIVisible} />
        )}
        {scroll && isModalOpen && <Modal data={data} />}
        {/* {scroll && isMapModalOpen && <ModalMap data={data} />} */}
        {!genjieslug && scroll && isDescModalOpen && <ModalDesc data={data} />}
        {scroll && isHelpModalOpen && <HelpModal />}
        {/* {genjieslug && scroll && isDescModalOpen && (
          <ModalDescGenji data={data} />
        )} */}
        <article
          className={`${styles.container} ${styles.rl} scrollbar`}
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
            setOepnSidebar(false);
          }}
          onTouchStart={() => {
            // 再生モード中はタッチで停止
            if (isPlayMode) {
              stopPlayMode();
            }
            // 計測: 手動スクロール操作（touch）
            // 自動スクロール中でない場合のみ（自動スクロール中断は別で計測）
            if (!isAutoScrolling) {
              trackManualScroll(data.id, "touch");
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
                type={type}
                selectedRef={selectedRef}
                navIndex={navIndex}
                uniqueIndex={item.uniqueIndex} // 新しい連番を渡す
                scroll={scroll}
                isPlayMode={isPlayMode} // 再生モード時は全画像を eager loading
              />
            );
          })}
        </article>
      </div>
    </div>
  );
};

export default EmakiContainer;
