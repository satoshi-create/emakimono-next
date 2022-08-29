import React from "react";
import styles from "../../styles/emaki.module.css";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import emakiData from "../../libs/data";
import EmakiImage from "../../components/EmakiImage";

const emaki = () => {
  const cyoujyuuKou = emakiData[[0]].emakis;
  return (
    <div className="conteiner">
      {cyoujyuuKou.map((item, index) => {
        const { cat } = item;
        if (cat == "image") {
          return <EmakiImage key={index} item={{...item}} />;
        }
      })}
    </div>
  );
};

export default emaki;
