import React, { useRef, useEffect, useState } from "react";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import emakiData from "../libs/data";
import EmakiImage from "./EmakiImage";
import Ekotoba from "./Ekotoba";
import styles from "../styles/EmakiConteiner.module.css";
import { faScrollTorah } from "@fortawesome/free-solid-svg-icons";

const EmakiConteiner = ({ data }) => {
  // const [loading, setLoading] = useState(false);
  // const [scrollWidth, setScrollWidth] = useState(1000);
  // const [emakis, setEmakis] = useState([]);

  const emakis = data.emakis;
  const { backgroundImage, kotobagaki, type } = emakis;

  // const fetchImages = async () => {
  //   setLoading(true);
  //   setEmakis(data.emakis);
  //   console.log(emakis);
  //   setLoading(false);
  // };

  // useEffect(() => {
  //   fetchImages();
  // }, []);

  // useEffect(() => {
  //   if (!loading) {
  //     const xwidth = window.outerWidth;
  //     setScrollWidth((scrollWidth) => scrollWidth + xwidth);
  //   }
  // }, []);

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
