import LazyImage from "@/components/emaki/viewer/LazyImage";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/EmakiImage.module.css";
import Link from "next/link";
import { useContext } from "react";

const EmakiImage = ({
  item: { config, index, navIndex, character, ebiki, uniqueIndex },
  item,
  isPlayMode, // 再生モード状態
  emakiId, // 計測用: 絵巻ID
}) => {
  const {
    scrollDialog,
    characterToggle,
    orientation,
    ebikiToggle,
    windowHeight,
    toggleFullscreen, // 全画面切替時の画像再マウント用
  } = useContext(AppContext);

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
    <div
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
      {/* key に toggleFullscreen を含めることで、全画面切替時にコンポーネントを再マウント */}
      {/* これにより next/image の IntersectionObserver が再初期化され、画像が確実に読み込まれる */}
      <LazyImage
        key={`${index}-${toggleFullscreen}`}
        src={item}
        alt={item.name}
        width={item.srcWidth}
        height={item.srcHeight}
        index={index}
        srcSp={item.srcSp}
        config={config}
        uniqueIndex={uniqueIndex}
        navIndex={navIndex}
        isPlayMode={isPlayMode}
        emakiId={emakiId}
      />
    </div>
  );
};

export default EmakiImage;
