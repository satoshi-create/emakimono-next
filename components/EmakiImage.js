import React, { useRef, useContext } from "react";
import styles from "../styles/EmakiImage.module.css";
import ResposiveImage from "./ResposiveImage";
import { AppContext } from "../pages/_app";
import Link from "next/link";

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
  const { scrollDialog, characterToggle, orientation } = useContext(AppContext);

  return (
    <section
      className={`section ${styles.emakiimage}`}
      id={`${index}`}
      // ref={navIndex === index ? selectedRef : null}
      ref={navIndex === index ? scrollDialog : null}
    >
      {characterToggle && character && (
        <div>
          {character?.map((item, i) => {
            return (
              <Link key={i} href={`${item.wiki ? item.wiki : "/"}`}>
                <a
                  target="_blank"
                  className={styles.characterbox}
                  // inline cssにhoverは当てられない？？
                  style={{
                    top: `${item.top}%`,
                    right: `${item.right}%`,
                    outline: `${
                      item.gender === "man"
                        ? "1px solid #5da3ff"
                        : "1px solid #ff7580"
                    }`,
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
                </a>
              </Link>
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
