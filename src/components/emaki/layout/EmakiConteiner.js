import EmakiInfo from "@/components/emaki/metadata/EmakiInfo";
import EmakiNavigation from "@/components/emaki/navigation/EmakiNavigation";
import CarouselButton from "@/components/emaki/viewer/CarouselButton";
import FullScreen from "@/components/emaki/viewer/FullScreen";
import Modal from "@/components/emaki/viewer/Modal";
import ModalDesc from "@/components/emaki/viewer/ModalDesc";
import SwitcherEmaki from "@/components/emaki/viewer/SwitcherEmaki";
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

  const emakis = data.emakis;

  const { backgroundImage, kotobagaki, type, genjieslug } = data;

  const wrapperRef = useRef();
  const articleRef = useRef();
  const scrollNextRef = useRef(null);
  const scrollPrevRef = useRef(null);

  const [scrollSpeed, setScrollSpeed] = useState(0);
  const [lastScrollX, setLastScrollX] = useState(0);
  const [rootMargin, setRootMargin] = useState("300px");
  const [isBlurVisible, setBlurVisible] = useState(false); // blurDataURL の表示状態

  const sectionRefs = useRef([]);

  useEffect(() => {
    if (scrollSpeed > 50) {
      setRootMargin("1000px");
    }
  }, [scrollSpeed, rootMargin]);

  useEffect(() => {
    if (sectionRefs.current.length !== emakis.length) return; // 全要素が設定されるまで待機

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(
        (entry) => {
          if (entry.isIntersecting) {
            setBlurVisible(true);
            // observer.unobserve(entry.target); // 個別に監視を解除
          }
        },
        { rootMargin: rootMargin, threshold: 0 },
      );
    });

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      sectionRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
      return () => observer.disconnect();
    };
  }, [emakis, rootMargin]);

  useEffect(() => {
    if (!articleRef.current) return;
    const el = articleRef.current;
    const handleScroll = () => {
      const currentScrollX = el.scrollLeft;
      const speed = Math.abs(currentScrollX - lastScrollX); // スクロール速度を計算
      setScrollSpeed(speed);
      setLastScrollX(currentScrollX);
    };

    el.addEventListener("scroll", handleScroll);

    return () => el.removeEventListener("scroll", handleScroll);
  }, [lastScrollX, scrollSpeed]);

  // 教育現場向けUI: 初回表示時のみ、横スクロール可能性を
  // 緩やかな自動スクロールで認知させるナッジ（操作説明なし）
  useEffect(() => {
    console.log("[AutoScroll Debug] useEffect実行");

    const keyName = `visited_${data.id}`;
    const keyValue = true;

    const isFirstVisit = !sessionStorage.getItem(keyName);
    console.log("[AutoScroll Debug] 初回アクセス判定:", isFirstVisit);
    console.log(
      `[AutoScroll Debug] sessionStorage.${keyName}:`,
      sessionStorage.getItem(keyName),
    );

    if (isFirstVisit) {
      // 初回アクセス時: 自動スクロールによる認知ナッジ
      const el = articleRef.current;
      console.log("[AutoScroll Debug] articleRef.current:", el);

      if (!el) {
        console.warn(
          "[AutoScroll Debug] articleRef.currentがnullのため処理中断",
        );
        return;
      }

      console.log("[AutoScroll Debug] 要素情報:", {
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        scrollLeft: el.scrollLeft,
      });

      // 一定速度で左にスクロールし続ける（ユーザー操作があるまで継続）
      const scrollSpeed = 2.7; // px/フレーム（約109px/秒 @ 60fps）
      let animationId = null;
      let stopped = false;

      // CSS scroll-behavior の干渉を防ぐため一時的に無効化
      const originalScrollBehavior = el.style.scrollBehavior;
      el.style.scrollBehavior = "auto";

      // スクロール可能な最小値（左端）
      const minScrollLeft = -(el.scrollWidth - el.clientWidth);

      console.log("[AutoScroll Debug] 自動スクロール開始準備:", {
        scrollSpeed,
        minScrollLeft,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        originalScrollBehavior,
      });

      const stopAutoScroll = () => {
        if (stopped) return;
        stopped = true;
        console.log("[AutoScroll Debug] 自動スクロール停止");
        if (animationId) cancelAnimationFrame(animationId);
        // scroll-behavior を元に戻す
        el.style.scrollBehavior = originalScrollBehavior;
        // イベントリスナー削除
        el.removeEventListener("mousedown", stopAutoScroll);
        el.removeEventListener("wheel", stopAutoScroll);
        el.removeEventListener("touchstart", stopAutoScroll);
        document.removeEventListener("click", stopAutoScroll);
      };

      const autoScroll = () => {
        if (stopped) {
          console.log("[AutoScroll Debug] autoScroll: stopped=true のため中断");
          return;
        }

        const currentScrollLeft = el.scrollLeft;
        const newScrollLeft = currentScrollLeft - scrollSpeed;

        // スクロール可能な範囲の端に到達したら停止
        if (newScrollLeft < minScrollLeft) {
          console.log(
            "[AutoScroll Debug] スクロール範囲の端（左端）に到達、停止",
          );
          stopAutoScroll();
          return;
        }

        console.log("[AutoScroll Debug] autoScroll:", {
          currentScrollLeft,
          newScrollLeft: newScrollLeft.toFixed(2),
          scrollSpeed,
          minScrollLeft,
        });

        el.scrollTo({
          left: newScrollLeft,
          behavior: "auto",
        });

        // 次のフレームを予約（ユーザー操作があるまで継続）
        animationId = requestAnimationFrame(autoScroll);
      };

      // ユーザー操作（ドラッグ／ホイール／タッチ／クリック）で即座に停止
      el.addEventListener("mousedown", stopAutoScroll, { once: true });
      el.addEventListener("wheel", stopAutoScroll, { once: true });
      el.addEventListener("touchstart", stopAutoScroll, { once: true });
      document.addEventListener("click", stopAutoScroll, { once: true });

      // 初期描画後に開始（0.5秒遅延）
      const timerId = setTimeout(() => {
        console.log("[AutoScroll Debug] タイマー発火 - アニメーション開始");
        if (!stopped) {
          // React Strict Mode対策: アニメーション開始時にsessionStorageへ書き込み
          sessionStorage.setItem(keyName, keyValue);
          console.log("[AutoScroll Debug] sessionStorageへ書き込み完了");
          animationId = requestAnimationFrame(autoScroll);
        }
      }, 500);

      return () => {
        console.log("[AutoScroll Debug] クリーンアップ実行");
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
        // convert vertical scroll into horizontal
        // 縦スクロールを横スクロールに変換
        el.scrollLeft += scrollSpeed * scrollDirection;
        let scrollLeft = Math.round(el.scrollLeft);
        // calculate box total vertical scroll
        // ボックス全体の垂直スクロール（水平スクロール）を計算する;
        let maxScrollLeft = Math.round(el.scrollWidth - el.clientWidth);
        // console.log(el.clientWidth);
        // // 818;
        // console.log(el.scrollWidth);
        // // 25202;
        // console.log(maxScrollLeft);
        // // 24384;
        // if element scroll has not finished scrolling
        // prevent window to scroll
        // ウィンドウがスクロールしないようにする;
        if (
          (scrollDirection === -1 && scrollLeft > 0) ||
          (scrollDirection === 1 && scrollLeft < maxScrollLeft)
        )
          e.preventDefault();
        // done!
        return true;
      };
      el.addEventListener("mousewheel", MouseWheelHandler, false);
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
        <CarouselButton articleRef={articleRef} />
        {scroll && (
          <>
            <EmakiNavigation handleToId={handleToId} data={data} />
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
                ref={(el) => (sectionRefs.current[index] = el)}
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
                isBlurVisible={isBlurVisible}
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
