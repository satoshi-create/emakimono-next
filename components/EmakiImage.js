import React, { useRef } from "react";
import styles from "../styles/EmakiImage.module.css";
import ResposiveImage from "./ResposiveImage";

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
  return (
    <section
      className={`section ${styles.emakiimage}`}
      id={`${index}`}
      ref={navIndex === index ? selectedRef : null}
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
