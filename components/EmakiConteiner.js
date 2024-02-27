import React, { useRef, useEffect, useContext, useState } from "react";
import "lazysizes";
import EmakiImage from "./EmakiImage";
import Ekotoba from "./Ekotoba";
import styles from "../styles/EmakiConteiner.module.css";
import { AppContext } from "../pages/_app";
import Modal from "./Modal";
import { useRouter } from "next/router";

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
  const { isModalOpen, setOepnSidebar, oepnSidebar } = useContext(AppContext);
  const router = useRouter();
  const emakis = data.emakis;
  const { backgroundImage, kotobagaki, type } = data;

  const scrollRef = useRef();

  // const scrollBottomRef = useRef();

  // useEffect(() => {
  //   if (scrollBottomRef && scrollBottomRef.current) {
  //     scrollBottomRef.current.scrollIntoView({
  //       behavior: "smooth",
  //       // block: "end",
  //       // inline: "nearest",
  //     });
  //   }
  // }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (scroll) {
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
  }, [scroll]);

  return (
    <>
      {isModalOpen && <Modal data={data} />}
      <article
        className={`${styles.conteiner} ${
          type === "西洋絵画" ? styles.lr : styles.rl
        }`}
        style={{
          "--screen-height": height,
          "--screen-width": width,
          "--overflow-x": overflowX,
          "--box-shadow": boxshadow,
        }}
        onClick={() => setOepnSidebar(false)}
        ref={scrollRef}
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
    </>
  );
};

export default EmakiConteiner;
