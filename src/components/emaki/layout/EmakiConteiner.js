import EmakiInfo from "@/components/emaki/metadata/EmakiInfo";
import EmakiNavigation from "@/components/emaki/navigation/EmakiNavigation";
import CarouselButton from "@/components/emaki/viewer/CarouselButton";
import FullScreen from "@/components/emaki/viewer/FullScreen";
import Modal from "@/components/emaki/viewer/Modal";
import ModalDesc from "@/components/emaki/viewer/ModalDesc";
import SwitcherEmaki from "@/components/emaki/viewer/SwitcherEmaki";
import WheelScrollIndicator from "@/components/emaki/viewer/WheelScrollIndicator";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/EmakiConteiner.module.css";
import "lazysizes";
import { useContext, useEffect, useRef, useState } from "react";

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
  } = useContext(AppContext);

  const { backgroundImage, kotobagaki, type, genjieslug } = data;

  const wrapperRef = useRef();
  const articleRef = useRef();
  const scrollNextRef = useRef(null);
  const scrollPrevRef = useRef(null);

  const [autoScrollStopped, setAutoScrollStopped] = useState(false);

  // 教育現場向けUI: スクロール端点の状態管理（操作手段に依存しない）
  const [isAtStart, setIsAtStart] = useState(true); // 開始位置（右端）にいるか
  const [isAtEnd, setIsAtEnd] = useState(false); // 終了位置（左端）にいるか
  const [isAutoScrolling, setIsAutoScrolling] = useState(false); // 自動スクロール中か

  // 教育現場向けUI: 静止UI耐性（Idle UI）- 長時間投影時の視覚的ノイズ軽減
  const [isUIVisible, setIsUIVisible] = useState(true); // UI表示状態
  const idleTimeoutRef = useRef(null); // 無操作タイマー
  const wheelIndicatorTimeoutRef = useRef(null); // WheelScrollIndicator表示期間タイマー

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

  // 教育現場向けUI: WheelScrollIndicator表示期間中はUIを非表示にしない
  useEffect(() => {
    if (autoScrollStopped) {
      // WheelScrollIndicatorが表示される期間（0.5秒遅延 + 2.5秒表示 = 3秒間）
      // この間はUIを表示したまま維持
      setIsUIVisible(true);

      // 既存のタイマーをクリア
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }

      // WheelScrollIndicator消滅後にタイマーを再開
      wheelIndicatorTimeoutRef.current = setTimeout(() => {
        // デバイス幅に応じたタイムアウト時間
        const getIdleTimeout = () => {
          const width = window.innerWidth;
          return width >= 1024 ? 5000 : 3000;
        };

        // タイマー再開
        idleTimeoutRef.current = setTimeout(() => {
          if (!isAutoScrolling) {
            setIsUIVisible(false);
          }
        }, getIdleTimeout());
      }, 3000); // WheelScrollIndicator表示期間
    }

    return () => {
      if (wheelIndicatorTimeoutRef.current) {
        clearTimeout(wheelIndicatorTimeoutRef.current);
        wheelIndicatorTimeoutRef.current = null;
      }
    };
  }, [autoScrollStopped, isAutoScrolling]);

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

      // 開始位置判定: scrollLeft が 0 または正の最大値（RTL環境考慮）
      const atStart = Math.abs(currentScrollX) < SCROLL_MARGIN ||
                      currentScrollX >= maxScrollLeft - SCROLL_MARGIN;

      // 終了位置判定: scrollLeft が負の最大値または 0 付近（RTL環境考慮）
      const atEnd = Math.abs(currentScrollX) >= maxScrollLeft - SCROLL_MARGIN ||
                    (currentScrollX < 0 && Math.abs(currentScrollX) >= maxScrollLeft - SCROLL_MARGIN);

      // 状態更新（変化がある場合のみ）
      if (atStart !== isAtStart) {
        setIsAtStart(atStart);
      }
      if (atEnd !== isAtEnd) {
        setIsAtEnd(atEnd);
      }
    };

    el.addEventListener("scroll", handleScroll);

    return () => el.removeEventListener("scroll", handleScroll);
  }, [isAtStart, isAtEnd]);

  // 教育現場向けUI: 初回表示時のみ、横スクロール可能性を
  // 緩やかな自動スクロールで認知させるナッジ（操作説明なし）
  useEffect(() => {
    const keyName = `visited_${data.id}`;
    const isFirstVisit = !sessionStorage.getItem(keyName);

    if (isFirstVisit) {
      const el = articleRef.current;
      if (!el) return;

      // デバイスタイプに応じたスクロール速度を設定
      // PC: 2.4px/frame, Tablet: 1.6px/frame, Mobile: 1.2px/frame
      const width = window.innerWidth;
      const scrollSpeed = width >= 1024 ? 2.4 : width >= 768 ? 1.6 : 1.2;

      let animationId = null;
      let stopped = false;
      let scrollStarted = false; // 自動スクロールが実際に開始されたかのフラグ

      // CSS scroll-behavior の干渉を防ぐため一時的に無効化
      const originalScrollBehavior = el.style.scrollBehavior;
      el.style.scrollBehavior = "auto";

      // スクロール可能な最小値（左端）
      const minScrollLeft = -(el.scrollWidth - el.clientWidth);

      const stopAutoScroll = () => {
        if (stopped) return;
        stopped = true;

        // WheelScrollIndicator表示のために状態を更新
        // ただし、実際にスクロールが開始されていた場合のみ
        if (scrollStarted) {
          setAutoScrollStopped(true);
        }

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
        if (!stopped) {
          scrollStarted = true; // スクロール開始フラグを立てる

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
          (scrollDirection === -1 && !atStart) ||  // 上回転 かつ 開始位置でない
          (scrollDirection === 1 && !atEnd)        // 下回転 かつ 終了位置でない
        ) {
          // convert vertical scroll into horizontal
          // 縦スクロールを横スクロールに変換
          el.scrollLeft += scrollSpeed * scrollDirection;
        }

        // 教育現場向けUI: 絵巻コンテナ上では常に横スクロールとして扱う
        // 端点でも縦スクロールを防止し、一貫した操作性を提供
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
          borderRadius:
            orientation === "landscape" &&
            scroll &&
            toggleFullscreen === false &&
            "12px",
        }}
      >
        {scroll && <FullScreen />}
        <CarouselButton
          articleRef={articleRef}
          isAtStart={isAtStart}
          isAtEnd={isAtEnd}
          isAutoScrolling={isAutoScrolling}
          isUIVisible={isUIVisible}
        />
        {scroll && (
          <WheelScrollIndicator
            dataId={data.id}
            autoScrollStopped={autoScrollStopped}
          />
        )}
        {scroll && (
          <>
            <EmakiNavigation
              handleToId={handleToId}
              data={data}
              isUIVisible={isUIVisible}
            />
          </>
        )}
        {scroll && toggleFullscreen && <EmakiInfo value={data} />}
        {scroll && isModalOpen && <Modal data={data} />}
        {/* {scroll && isMapModalOpen && <ModalMap data={data} />} */}
        {!genjieslug && scroll && isDescModalOpen && <ModalDesc data={data} />}
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
            borderRadius:
              orientation === "landscape" &&
              scroll &&
              toggleFullscreen === false &&
              "12px",
          }}
          onClick={() => setOepnSidebar(false)}
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
              />
            );
          })}
        </article>
      </div>
    </div>
  );
};

export default EmakiContainer;
