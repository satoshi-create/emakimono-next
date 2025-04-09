import CarouselButton from "@/components/emaki/CarouselButton";
import EmakiInfo from "@/components/emaki/EmakiInfo";
import EmakiNavigation from "@/components/emaki/EmakiNavigation";
import FullScreen from "@/components/emaki/FullScreen";
import Modal from "@/components/emaki/Modal";
import ModalDesc from "@/components/emaki/ModalDesc";
import SwitcherEmaki from "@/components/emaki/SwitcherEmaki";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/EmakiConteiner.module.css";
import "lazysizes";
import { useRouter } from "next/router";
import { useContext, useEffect, useRef, useState } from "react";
import ScrollHint from "scroll-hint";

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

  const { locale } = useRouter();

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
        { rootMargin: rootMargin, threshold: 0 }
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

  useEffect(() => {
    const keyName = "visited";
    const keyValue = true;

    if (!sessionStorage.getItem(keyName)) {
      //sessionStorageにキーと値を追加
      sessionStorage.setItem(keyName, keyValue);

      //初回アクセス時の処理
      new ScrollHint(".js-scrollable", {
        offset: -10,
        remainingTime: 8000,
        scrollableLeftClass: true,
        scrollHintIconAppendClass: "scroll-hint-icon-white",
        i18n: {
          scrollable: `${
            locale === "ja"
              ? `${
                  type !== "西洋絵画"
                    ? "左スクロールできます"
                    : "右スクロールできます"
                }`
              : `${
                  type !== "西洋絵画" ? "scrollable left" : "scrollable right"
                }`
          }`,
        },
      });
    } else {
      //ここに通常アクセス時の処理
    }
  }, []);

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
    { result: [], imageCounter: 0, ekotobaCounter: 0 }
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
          className={`${styles.container} ${
            type === "西洋絵画" ? styles.lr : styles.rl
          } scrollbar`}
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
