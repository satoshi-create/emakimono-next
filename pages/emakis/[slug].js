import React from "react";
import styles from "../../styles/emaki.module.css";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import emakiData from "../../libs/data";

const emaki = () => {
  console.log(emakiData[[0]].emakis);
  const cyoujyuuKou = emakiData[[0]].emakis;
  return (
    <div className={styles.conteiner}>
      {cyoujyuuKou.map((item, index) => {
        const {
          cat,
          kobun,
          gendaibun,
          src,
          name,
          chapter,
          srcSp,
          srcTb,
          load,
          viewBoxW,
          viewBoxH,
          clickImg,
        } = item;

        if (cat == "image") {
          return (
            <div className="box" key={index}>
              <picture>
                <source
                  data-srcset={srcSp}
                  media="(max-height: 375px)"
                  type="image/webp"
                />
                <source
                  data-srcset={srcTb}
                  media="(max-height: 800px)"
                  type="image/webp"
                />
                <source data-srcset={src} type="image/webp" />
                <img
                  decoding="async"
                  src={
                    load
                      ? srcSp
                      : "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                  }
                  className="loading lazyload"
                  alt={name}
                  data-expand="600"
                />
              </picture>
            </div>
          );
        }
      })}
    </div>
  );
};

export default emaki;
