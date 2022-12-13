import React, { useRef } from "react";
import styles from "../styles/EmakiImage.module.css";
import ResposiveImage from "./ResposiveImage";

const EmakiImage = ({
  item: { srcSp, srcTb, src, load, name, index, srcWidth, srcHeight },
}) => {
  return (
    <section className={`section ${styles.emakiimage}`} id={`s${index}`}>
      <ResposiveImage
        value={{ srcSp, srcTb, src, load, name, srcWidth, srcHeight ,index}}
      />
    </section>
  );
};

export default EmakiImage;
