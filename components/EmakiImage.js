import React, { useRef, useContext } from "react";
import styles from "../styles/EmakiImage.module.css";
import ResposiveImage from "./ResposiveImage";
import { AppContext } from "../pages/_app";

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
  },
}) => {
  const { scrollDialog } = useContext(AppContext);

  return (
    <section
      className={`section ${styles.emakiimage}`}
      id={`${index}`}
      // ref={navIndex === index ? selectedRef : null}
      ref={navIndex === index ? scrollDialog : null}
    >
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
