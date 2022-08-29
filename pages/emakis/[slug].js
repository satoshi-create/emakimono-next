import React from "react";
import styles from "../../styles/emaki.module.css";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import emakiData from "../../libs/data";
import EmakiImage from "../../components/EmakiImage";
import Ekotoba from "../../components/Ekotoba";

const emaki = () => {
  const cyoujyuuKou = emakiData[[0]].emakis;
  return (
    <article className="conteiner">
      {cyoujyuuKou.map((item, index) => {
        const { cat} = item;
        if (cat === "image") {
          return <EmakiImage key={index} item={{ ...item }} />;
        } else {
          return <Ekotoba key={index} item={{ ...item }} />;
        }
      })}
    </article>
  );
};

export default emaki;
