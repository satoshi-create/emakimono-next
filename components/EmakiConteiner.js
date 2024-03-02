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
import { NodeNextRequest } from "next/dist/server/base-http/node";

const EmakiConteiner = ({
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
  } = useContext(AppContext);

  const emakis = data.emakis;
  const { backgroundImage, kotobagaki, type } = data;

  const [toggle, setToggle] = useState(true);

  const articleRef = useRef();
  const scrollNextRef = useRef(null);
  const scrollPrevRef = useRef(null);

  useEffect(() => {
    if (scroll) {
      const el = articleRef.current;
      if (el) {
        const wheelListener = (e) => {
          console.log(e.deltaY);

          e.preventDefault();
          el.scrollTo({
            left: el.scrollLeft + e.deltaY * 3,
            behavior: "smooth",
          });
        };

        el.addEventListener("wheel", wheelListener, { passive: true });
        el.addEventListener("touchmove", wheelListener, { passive: false });
      }
    }
  }, [articleRef, scroll]);

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

  return (
    <>
      <div
        className={`${styles.wrapper} ${
          orientation === "landscape" ? styles.land : styles.prt
        }`}
        style={{
          borderRadius: toggleFullscreen && "0px",
        }}
      >
        <FullScreen />
        {toggleFullscreen && <EmakiInfo value={data} />}

        {/* <Sidebar value={data} handleToId={handleToId} /> */}
        {isModalOpen && <Modal data={data} />}
        <EmakiNavigation
          handleToId={handleToId}
          data={data}
          scrollNextRef={scrollNextRef}
          scrollPrevRef={scrollPrevRef}
        />

        <article
          className={`${styles.conteiner} ${
            type === "西洋絵画" ? styles.lr : styles.rl
          }`}
          style={{
            "--screen-height": height,
            "--screen-width": width,
            "--overflow-x": overflowX,
            "--box-shadow": boxshadow,
            borderRadius: toggleFullscreen && "0px",
          }}
          onClick={() => setOepnSidebar(false)}
          ref={articleRef}
        >
          {emakis.map((item, index) => {
            const { cat, src } = item;

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
            } else {
              return (
                <Ekotoba
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

export default EmakiConteiner;
