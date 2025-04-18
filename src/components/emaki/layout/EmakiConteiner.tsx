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
import { useRouter } from "next/router";
import { useContext, useEffect, useRef, useState, RefObject } from "react";
import ScrollHint from "scroll-hint";
import type { EmakiImageMetadata } from '@/types/metadata'; // Adjust path if needed

// Define Props Interface
interface EmakiContainerProps {
  data: EmakiImageMetadata;
  height: string;
  width?: string; // Optional
  scroll: boolean;
  overflowX?: string; // Optional
  boxshadow?: string; // Optional
  selectedRef?: RefObject<any>; // Use specific element type if known, else 'any' or 'HTMLElement'
  navIndex?: number;
  articleRef: RefObject<HTMLElement>; // Use HTMLElement or a more specific type
}

const EmakiContainer = ({
  data,
  height,
  width,
  scroll,
  overflowX,
  boxshadow,
  selectedRef,
  navIndex,
  articleRef,
}: EmakiContainerProps) => {
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

  const wrapperRef = useRef<HTMLDivElement>(null);
  // articleRef is now passed as a prop, no need to redefine it here
  // const articleRef = useRef<HTMLElement>(null);
  const scrollNextRef = useRef<HTMLButtonElement>(null); // Assuming ActionButton forwards ref to a button
  const scrollPrevRef = useRef<HTMLButtonElement>(null);

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

    // console.log("Setting up IntersectionObserver for", sectionRefs.current.length, "elements");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // console.log("Setting up IntersectionObserver for", sectionRefs.current.length, "elements");
            setBlurVisible(true);
            // Consider unobserving only if you want the effect once per element
            // observer.unobserve(entry.target); // 個別に監視を解除
          }
        },
        { rootMargin: rootMargin, threshold: 0 } // Use threshold 0 for any visibility
      );
    });

    const currentRefs = sectionRefs.current.filter(ref => ref !== null) as HTMLElement[];
    currentRefs.forEach((ref) => {
      observer.observe(ref);
    });

    return () => {
      // console.log("Cleaning up IntersectionObserver");
      currentRefs.forEach((ref) => {
        if (ref) { // Check if ref still exists before unobserving
             try {
                 observer.unobserve(ref);
             } catch (e) {
                 console.warn("Error unobserving element:", e);
             }
         }
      });
       observer.disconnect(); // Disconnect observer on component unmount
    };
     // Add rootMargin to dependencies if you want the observer to re-setup when it changes
  }, [emakis.length, rootMargin]);


  useEffect(() => {
    if (!articleRef.current) return;
    const el = articleRef.current;
    const handleScroll = () => {
      const currentScrollX = el.scrollLeft;
      const speed = Math.abs(currentScrollX - lastScrollX); // スクロール速度を計算
      setScrollSpeed(speed);
      setLastScrollX(currentScrollX);
    };

    el.addEventListener("scroll", handleScroll); // Use passive listener

    return () => el.removeEventListener("scroll", handleScroll); // Check if el still exists on cleanup
  }, [lastScrollX, scrollSpeed]);// Depend on articleRef.current existence implicitly via the effect re-run

  useEffect(() => {
    // ScrollHint initialization
    const keyName = "visited";
    const keyValue = true;
    let scrollHintInstance: ScrollHint | null = null;

    if (!sessionStorage.getItem(keyName)) {
      //sessionStorageにキーと値を追加
      sessionStorage.setItem(keyName, String(keyValue));

      //初回アクセス時の処理
      // Ensure the target element exists before initializing
      const targetElement = document.querySelector(".js-scrollable");
      if (targetElement) {
        scrollHintInstance = new ScrollHint(".js-scrollable", {
          offset: -10,
          remainingTime: "8000",
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
      }
      else {
        console.warn("ScrollHint target .js-scrollable not found.");
      }
    } else {
      //ここに通常アクセス時の処理
    }
  }, [locale, type]);

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
          } as React.CSSProperties}
          onClick={() => setOepnSidebar(false)}
          ref={articleRef}
        >
          {processedEmakis.map((item, index) => {
            const { cat, src } = item;
            return (
              <SwitcherEmaki
                key={index}
                ref={(el) => {
                  sectionRefs.current[index] = el;
                }}
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
