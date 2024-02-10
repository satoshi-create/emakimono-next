import React, { useRef, useEffect, useContext, useState } from "react";
import "lazysizes";
import EmakiImage from "./EmakiImage";
import Ekotoba from "./Ekotoba";
import styles from "../styles/EmakiConteiner.module.css";
import { AppContext } from "../pages/_app";
import Modal from "./Modal";

const EmakiConteiner = ({
  data,
  height,
  width,
  scroll,
  overflowX,
  boxshadow,
}) => {
  const { isModalOpen, setOepnSidebar, oepnSidebar } = useContext(AppContext);

  const emakis = data.emakis;
  const { backgroundImage, kotobagaki, type } = data;

  // const [orientation, setOrientation] = useState();
  // console.log(orientation);
  // useEffect(() => {
  //   const isLandscape = () =>
  //     window.matchMedia("(orientation:portrait)").matches;
  //   setOrientation(isLandscape());
  // }, []);

  const scrollRef = useRef();
  // console.log(scrollRef);

  // const scrollToLatest = (behavior = "smooth") =>
  //   scrollRef.current.scrollIntoView({ behavior });
  console.log(scroll);

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
  }, []);

  return (
    <>
      {type === "浮世絵" && isModalOpen && <Modal data={data} />}
      {type === "浮世絵" && isModalOpen && <Modal data={data} />}
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
            return <EmakiImage key={index} item={{ ...item, index, scroll }} />;
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
