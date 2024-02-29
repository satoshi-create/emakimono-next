import React, { useRef, useEffect, useContext, useState } from "react";
import "lazysizes";
import EmakiImage from "./EmakiImage";
import Ekotoba from "./Ekotoba";
import styles from "../styles/EmakiConteiner.module.css";
import { AppContext } from "../pages/_app";
import Modal from "./Modal";
import { useRouter } from "next/router";
import FullScreen from "../components/FullScreen";

const EmakiConteiner = ({
  data,
  height,
  width,
  scroll,
  overflowX,
  boxshadow,
  selectedRef,
  navIndex,
  articleRef,
}) => {
  const { isModalOpen, setOepnSidebar, oepnSidebar, orientation, handleToId } =
    useContext(AppContext);
  const router = useRouter();
  const emakis = data.emakis;
  const { backgroundImage, kotobagaki, type } = data;
  console.log(data);

  useEffect(() => {
    if (scroll) {
      const el = articleRef.current;
      if (el) {
        const wheelListener = (e) => {
          // e.preventDefault();
          el.scrollTo({
            left: el.scrollLeft + e.deltaY * 3,
            behavior: "smooth",
          });
        };
        el.addEventListener("wheel", wheelListener, { passive: true });
      }
    }
  }, [articleRef, scroll]);

  const emakkiHeight = (scr) => {
    if (scr) {
      if (orientation === "portrait") {
        return "40vh";
      } else {
        return "100vh";
      }
    } else {
      return "50vh";
    }
  };

  return (
    <>
      {isModalOpen && <Modal data={data} />}
      <article
        className={`${styles.conteiner} ${
          type === "西洋絵画" ? styles.lr : styles.rl
        }`}
        style={{
          "--screen-height": emakkiHeight(scroll),
          "--screen-width": width,
          "--overflow-x": overflowX,
          "--box-shadow": boxshadow,
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
      {orientation === "portrait" && (
        <div className={styles.metadata}>
          <div className={styles.emakiinfo}>
            <h3>{data.title}</h3>
            <p>絵師{data.author ? data.author : "不詳"}</p>
            <p>{data.era}時代</p>
            <p>{data.desc}</p>
          </div>
          <ul className={styles.mokuji}>
            {emakis.map((item, index) => {
              const { cat, chapter } = item;
              if (cat === "ekotoba") {
                return (
                  <li key={index}>
                    <span
                      onClick={() => handleToId(index)}
                      dangerouslySetInnerHTML={{ __html: chapter }}
                    ></span>
                  </li>
                );
              }
            })}
          </ul>
        </div>
      )}
    </>
  );
};

export default EmakiConteiner;
