import React, { useRef, useEffect, useContext, useState } from "react";
import "lazysizes";
import EmakiImage from "./EmakiImage";
import Ekotoba from "./Ekotoba";
import styles from "../styles/EmakiConteiner.module.css";
import { AppContext } from "../pages/_app";
import { useRouter } from "next/router";
import FullScreen from "../components/FullScreen";
import Link from "next/link";
import Sidebar from "./Sidebar";
import EmakiInfo from "../components/EmakiInfo";
import EmakiNavigation from "../components/EmakiNavigation";
import Modal from "./Modal";
import KotenText from "./KotenText";
import OverlayEkotoba from "./OverlayEkotoba";
import ModalMap from "./ModalMap";
import ModalDesc from "./ModalDesc";
import ModalDescGenji from "./ModalDescGenji";

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

  const { backgroundImage, kotobagaki, type,genjieslug } = data;

  const [toggle, setToggle] = useState(true);

  const wrapperRef = useRef();
  const articleRef = useRef();
  const scrollNextRef = useRef(null);
  const scrollPrevRef = useRef(null);

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

  // イベントリスナーを使う方法で実装。
  // イベントハンドラーを使う方法は（scrollevent_eventhandler）内
  useEffect(() => {
    const con = articleRef.current;
    const btnPrev = scrollPrevRef.current;
    const btnNext = scrollNextRef.current;

    const scrollNextEvent = () => {
      con.scrollTo({
        left: con.scrollLeft - 1000,
        behavior: "smooth",
      });
    };

    const scrollPrevEvent = () => {
      con.scrollTo({
        left: con.scrollLeft + 1000,
        behavior: "smooth",
      });
    };

    if (btnNext) {
      btnNext.addEventListener("click", scrollNextEvent);
    }
    if (btnPrev) {
      btnPrev.addEventListener("click", scrollPrevEvent);
    }
    return () => {
      if (btnNext) {
        btnNext.removeEventListener("click", scrollNextEvent);
      }
      if (btnPrev) {
        btnNext.removeEventListener("click", scrollNextEvent);
      }
    };
  }, []);

  const Navigation = (scr) => {
    if (scr) {
      <>
        <FullScreen />
        <EmakiNavigation
          handleToId={handleToId}
          data={data}
          scrollNextRef={scrollNextRef}
          scrollPrevRef={scrollPrevRef}
        />
      </>;
    } else {
      return;
    }
  };

  return (
    <>
      <div
        className={`${
          orientation === "landscape" && scroll ? styles.land : styles.prt
        }`}
        style={{
          borderRadius:
            orientation === "landscape" &&
            scroll &&
            toggleFullscreen === false &&
            "12px",
        }}
      >
        {scroll && (
          <>
            <EmakiNavigation
              handleToId={handleToId}
              data={data}
              scrollNextRef={scrollNextRef}
              scrollPrevRef={scrollPrevRef}
            />
          </>
        )}
        {scroll && toggleFullscreen && <EmakiInfo value={data} />}
        {scroll && isModalOpen && <Modal data={data} />}
        {scroll && isMapModalOpen && <ModalMap data={data} />}
        {!genjieslug && scroll && isDescModalOpen && <ModalDesc data={data} />}
        {genjieslug && scroll && isDescModalOpen && (
          <ModalDescGenji data={data} />
        )}
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
          {emakis.map((item, index) => {
            const { cat, src } = item;
            if (data.type !== "古典文学") {
              if (cat === "image") {
                return (
                  <EmakiImage
                    key={index}
                    item={{
                      ...item,
                      index,
                      scroll,
                      selectedRef,
                      navIndex,
                    }}
                  />
                );
              }
              if (cat === "ekotoba") {
                return (
                  <OverlayEkotoba
                    key={index}
                    item={{
                      ...item,
                      cat,
                      index,
                      backgroundImage,
                      kotobagaki,
                      type,
                      scroll,
                      selectedRef,
                      navIndex,
                      data,
                    }}
                  />
                );
              }
            }
            if (data.type === "古典文学") {
              return (
                <KotenText
                  key={index}
                  item={{
                    ...item,
                    index,
                    backgroundImage,
                    kotobagaki,
                    type,
                    scroll,
                    selectedRef,
                    navIndex,
                  }}
                />
              );
            }
          })}
        </article>
      </div>
    </>
  );
};

export default EmakiContainer;
