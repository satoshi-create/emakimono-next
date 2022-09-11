import React, { useRef, useEffect } from "react";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import emakiData from "../libs/data";
import EmakiImage from "./EmakiImage";
import Ekotoba from "./Ekotoba";
import styles from "../styles/EmakiConteiner.module.css";

const EmakiConteiner = ({ data }) => {
  const { backgroundImage, kotobagaki } = data;
  const emakis = data.emakis;

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
      <article className={styles.conteiner} ref={scrollRef}>
        {emakis.map((item, index) => {
          const { cat } = item;
          if (cat === "image") {
            return <EmakiImage key={index} item={{ ...item, index }} />;
          } else {
            return (
              <Ekotoba
                key={index}
                item={{ ...item, index, backgroundImage, kotobagaki }}
              />
            );
          }
        })}
      </article>
    </>
  );
};

export default EmakiConteiner;
