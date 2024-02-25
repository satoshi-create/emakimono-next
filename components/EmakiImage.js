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
    getMap,
  },
}) => {
  return (
    <section
      className={`section ${styles.emakiimage}`}
      id={`${index}`}
      ref={(node) => {
        const map = getMap();
        if (node) {
          map.set(index, node);
        } else {
          map.delete(index);
        }
      }}
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
