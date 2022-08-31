import React from "react";
import styles from "../styles/EmakiImage.module.css";
import ResposiveImage from "./ResposiveImage";

const EmakiImage = ({ item: { srcSp, srcTb, src, load, name, index } }) => {
  return (
    <section className={styles.emakiimage} id={`s${index}`}>
      <ResposiveImage value={{ srcSp, srcTb, src, load, name }} />
    </section>
  );
};

export default EmakiImage;
