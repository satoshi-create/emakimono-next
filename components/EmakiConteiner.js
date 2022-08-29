import React, { useRef, useEffect } from "react";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import emakiData from "../libs/data";
import EmakiImage from "./EmakiImage";
import Ekotoba from "./Ekotoba";

const EmakiConteiner = ({ data }) => {
  const emakis = data.emakis;

  const scrollRef = useRef();

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const wheelListener = (e) => {
        e.preventDefault();
        el.scrollTo({
          left: el.scrollLeft + e.deltaY * 5,
          behavior: "smooth",
        });
      };
      el.addEventListener("wheel", wheelListener);
      return () => el.removeEventListener("wheel", wheelListener);
    }
  }, []);

  return (
    <article className="conteiner" ref={scrollRef}>
      {emakis.map((item, index) => {
        const { cat } = item;
        if (cat === "image") {
          return <EmakiImage key={index} item={{ ...item }} />;
        } else {
          return <Ekotoba key={index} item={{ ...item }} />;
        }
      })}
    </article>
  );
};

export default EmakiConteiner;
