import React, { useRef, useEffect, useContext } from "react";
import "lazysizes";
// import "lazysizes/plugins/attrchange/ls.attrchange";
import EmakiImage from "./EmakiImage";
import Ekotoba from "./Ekotoba";
import styles from "../styles/EmakiConteiner.module.css";
import { AppContext } from "../pages/_app";
import Modal from "./Modal";

const EmakiConteiner = ({ data }) => {
  const { isModalOpen } = useContext(AppContext);

  const emakis = data.emakis;
  const { backgroundImage, kotobagaki, type } = data;
  console.log(backgroundImage);

  const scrollRef = useRef();

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const wheelListener = (e) => {
        e.preventDefault();
        el.scrollTo({
          left: el.scrollLeft + e.deltaY * 3,
          behavior: "smooth",
        });
      };
      el.addEventListener("wheel", wheelListener);
      return () => el.removeEventListener("wheel", wheelListener);
    }
  }, []);

  return (
    <>
      {isModalOpen && <Modal emakis={emakis} />}
      <article
        className={`${styles.conteiner} ${
          type === "西洋絵画" ? styles.lr : styles.rl
        }`}
        ref={scrollRef}
      >
        {emakis.map((item, index) => {
          const { cat } = item;
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
