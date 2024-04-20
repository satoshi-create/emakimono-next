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
    ebiki,
  },
}) => {
  const { scrollDialog, characterToggle, orientation, ebikiToggle } =
    useContext(AppContext);

  const characterOuntline = (x) => {
    switch (x) {
      case "man":
        return "1px solid #5da3ff";
        break;
      case "woman":
        return "1px solid #ff7580";
      case "animal":
        return "1px solid rgb(171 223 51)";
      default:
        break;
    }
  };

  const ebikiOutline = (x) => {
    switch (x) {
      case "link":
        return "1px solid var(--clr-accent-02)";
        break;
      default:
        return "1px solid var(--clr-black)";
        break;
    }
  };

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
            if (item.link) {
              return (
                <Link key={i} href={`${item.link && item.link}`}>
                  <a
                    target="_blank"
                    className={`${styles.characterbox} ${styles.characterboxLink}`}
                    // inline cssにhoverは当てられない？？
                    style={{
                      top: `${item.top}%`,
                      right: `${item.right}%`,
                      outline: characterOuntline(item.gender),
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
            } else {
              return (
                <div
                  key={i}
                  target="_blank"
                  className={styles.characterbox}
                  // inline cssにhoverは当てられない？？
                  style={{
                    top: `${item.top}%`,
                    right: `${item.right}%`,
                    outline: characterOuntline(item.gender),
                    // outline: `${
                    //   item.gender === "man"
                    //     ? "1px solid #5da3ff"
                    //     : "1px solid #ff7580"
                    // }`,
                    cursor: "default",
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
                </div>
              );
            }
          })}
        </div>
      )}
      {ebikiToggle && ebiki && (
        <div>
          {ebiki?.map((item, i) => {
            if (item.path) {
              return (
                <Link key={i} href={item.path}>
                  <a
                    target="_blank"
                    className={styles.ebikibox}
                    // inline cssにhoverは当てられない？？
                    style={{
                      top: `${item.top}%`,
                      right: `${item.right}%`,
                      fontSize: `${
                        orientation === "portrait"
                          ? "var(--text-size-prt)"
                          : "var(--text-size)"
                      }`,
                      outline: ebikiOutline(item.attr),
                      padding: `${
                        orientation === "portrait" ? ".5rem 0" : "1rem 0"
                      }`,
                    }}
                  >
                    {item.name}
                  </a>
                </Link>
              );
            } else {
              return (
                <div
                  key={i}
                  className={styles.ebikibox}
                  // inline cssにhoverは当てられない？？
                  style={{
                    top: `${item.top}%`,
                    right: `${item.right}%`,
                    fontSize: `${
                      orientation === "portrait"
                        ? "var(--text-size-prt)"
                        : "var(--text-size)"
                    }`,
                    outline: ebikiOutline(item.attr),
                    cursor: "default",
                    padding: `${
                      orientation === "portrait" ? ".5rem 0" : "1rem 0"
                    }`,
                  }}
                >
                  {item.name}
                </div>
              );
            }
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
