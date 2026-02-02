import EmakiInfo from "@/components/emaki/metadata/EmakiInfo";
import EmakiNavigation from "@/components/emaki/navigation/EmakiNavigation";
import CarouselButton from "@/components/emaki/viewer/CarouselButton";
import FullScreen from "@/components/emaki/viewer/FullScreen";
import HelpModal from "@/components/emaki/viewer/HelpModal";
import Modal from "@/components/emaki/viewer/Modal";
import ModalDesc from "@/components/emaki/viewer/ModalDesc";
import SwitcherEmaki from "@/components/emaki/viewer/SwitcherEmaki";
import WheelScrollIndicator from "@/components/emaki/viewer/WheelScrollIndicator";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/EmakiConteiner.module.css";
import "lazysizes";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

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

  // 絵巻ハイパーリンク: シーン検出用の debounce タイマー
  const sceneDetectionTimerRef = useRef(null);
  const lastDetectedSceneRef = useRef(navIndex); // 前回検出したシーン（不要な更新を防ぐ）

  // 絵巻ハイパーリンク: スクロール位置から現在表示中のシーンを検出
  const detectCurrentScene = useCallback(() => {
    const el = articleRef.current;
    if (!el) return;

    const sections = el.querySelectorAll("section[id]");
    if (sections.length === 0) return;

    const containerRect = el.getBoundingClientRect();
    // RTL環境: 右端を基準として検出（絵巻は右から左へ読む）
    const referenceX = containerRect.right;

    let closestSection = null;
    let closestDistance = Infinity;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      // sectionの右端とコンテナ右端との距離
      const distance = Math.abs(rect.right - referenceX);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestSection = section;
      }
    });

    if (closestSection) {
      const sceneIndex = parseInt(closestSection.id, 10);
      // 有効な数値で、前回と異なる場合のみ更新
      if (!isNaN(sceneIndex) && sceneIndex !== lastDetectedSceneRef.current) {
        lastDetectedSceneRef.current = sceneIndex;
        // 絵巻ハイパーリンク: スクロール検出による更新であることをマーク
        // scrollDialog の自動スクロールを抑制するため
        if (isScrollDetectedUpdateRef) {
          isScrollDetectedUpdateRef.current = true;
        }
        setnavIndex(sceneIndex);
        // フラグを解除（scrollDialog の処理が完了するまで少し待つ）
        setTimeout(() => {
          if (isScrollDetectedUpdateRef) {
            isScrollDetectedUpdateRef.current = false;
          }
        }, 100);
      }
    }
  }, [setnavIndex, isScrollDetectedUpdateRef]);


  // 教育現場向けUI: 静止UI耐性 - ユーザー操作検出とタイマー管理
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
      idleTimeoutRef.current = setTimeout(() => {
        // 自動スクロール中は非表示にしない
        if (!isAutoScrolling) {
          setIsUIVisible(false);
        }
      }, getIdleTimeout());
    };

    // ユーザー操作検出時の処理
    const handleUserActivity = () => {
      // UIを即座に表示
      setIsUIVisible(true);
      // タイマーをリセット
      startIdleTimer();
    };

    // 自動スクロール中はタイマーを停止
    if (isAutoScrolling) {
      clearIdleTimer();
    } else {
      // 自動スクロール終了後にタイマー開始
      startIdleTimer();
    }

    // イベントリスナーの登録
    // マウス移動、ホイール、タッチ、クリック、キーボード操作を検出
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("wheel", handleUserActivity, { passive: true });
    window.addEventListener("touchstart", handleUserActivity, { passive: true });
    window.addEventListener("click", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);

    // クリーンアップ
    return () => {
      clearIdleTimer();
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("wheel", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
    };
  }, [isAutoScrolling]); // 依存配列: 自動スクロール状態の変化を監視

  useEffect(() => {
    if (!articleRef.current) return;
    const el = articleRef.current;
    const handleScroll = () => {
      const currentScrollX = el.scrollLeft;
      const scrollWidth = el.scrollWidth;
      const clientWidth = el.clientWidth;

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

      // 絵巻ハイパーリンク: スクロール時のシーン検出（debounce: 150ms）
      // 頻繁なURL更新を防ぎ、スクロールが落ち着いた後に検出
      if (sceneDetectionTimerRef.current) {
        clearTimeout(sceneDetectionTimerRef.current);
      }
      sceneDetectionTimerRef.current = setTimeout(() => {
        detectCurrentScene();
      }, 150);
    };

    el.addEventListener("scroll", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      // クリーンアップ: シーン検出タイマーもクリア
      if (sceneDetectionTimerRef.current) {
        clearTimeout(sceneDetectionTimerRef.current);
      }
    };
  }, [isAtStart, isAtEnd, detectCurrentScene]);

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

      const stopAutoScroll = () => {
        if (stopped) return;
        stopped = true;

        // 教育現場向けUI: 自動スクロール停止を通知
        // これにより「戻る」ボタンが表示可能になる
        setIsAutoScrolling(false);

        if (animationId) cancelAnimationFrame(animationId);
        el.style.scrollBehavior = originalScrollBehavior;
        el.removeEventListener("mousedown", stopAutoScroll);
        el.removeEventListener("wheel", stopAutoScroll);
        el.removeEventListener("touchstart", stopAutoScroll);
        document.removeEventListener("click", stopAutoScroll);
      };

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
      el.addEventListener("mousedown", stopAutoScroll, { once: true });
      el.addEventListener("wheel", stopAutoScroll, { once: true });
      el.addEventListener("touchstart", stopAutoScroll, { once: true });
      document.addEventListener("click", stopAutoScroll, { once: true });

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
