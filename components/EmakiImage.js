import React, { useRef, useContext } from "react";
import styles from "../styles/EmakiImage.module.css";
import ResposiveImage from "./ResposiveImage";
import { AppContext } from "../pages/_app";

// TODO : 登場人物の名前のフォントサイズをレスポンシブにする

const EmakiImage = ({
  item: {
    srcSp,
    srcTb,
    src,
    load,
    name,
    index,
    srcWidth,
    srcHeight,
    scroll,
    selectedRef,
    navIndex,
    character,
  },
}) => {
  console.log(character);
  const { scrollDialog, characterToggle, orientation } = useContext(AppContext);

  return (
    <section
      className={`section ${styles.emakiimage}`}
      id={`${index}`}
      // ref={navIndex === index ? selectedRef : null}
      ref={navIndex === index ? scrollDialog : null}
    >
      {characterToggle && character && (
        <div className={styles.characterBox}>
          {character?.map((item, i) => {
            return (
              <p
                key={i}
                className={styles.genji}
                style={{
                  fontSize: `${
                    orientation === "portrait"
                      ? "var(--text-size-prt)"
                      : "var(--text-size)"
                  }`,
                  padding: `${
                    orientation === "portrait" ? ".5rem 0" : "1rem 0"
                  }`,
                }}
              >
                {item.name}
              </p>
            );
          })}
        </div>
      )}
      <ResposiveImage
        value={{
          srcSp,
          srcTb,
          src,
          load,
          name,
          srcWidth,
          srcHeight,
          index,
          scroll,
        }}
      />
    </section>
  );
};

export default EmakiImage;
