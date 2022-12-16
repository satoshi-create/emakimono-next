import React, { useRef, useEffect, useContext } from "react";
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
  const { isModalOpen } = useContext(AppContext);

  const emakis = data.emakis;
  const { backgroundImage, kotobagaki, type } = data;

  const scrollRef = useRef();

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
        ref={scrollRef}
      >
        {emakis.map((item, index) => {
          const { cat, src } = item;

          if (cat === "image") {
            return <EmakiImage key={index} item={{ ...item, index }} />;
          } else {
            return (
              <Ekotoba
                key={index}
                item={{ ...item, index, backgroundImage, kotobagaki, type }}
              />
            );
          }
        })}
      </article>
    </>
  );
};

export default EmakiConteiner;
