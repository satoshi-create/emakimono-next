import React from "react";
import styles from "../styles/EmakiImage.module.css"

const EmakiImage = ({ item: { srcSp, srcTb, src, load, name } }) => {
  return (
    <section className={styles.emakiimage}>
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
          className={`loading lazyload ${styles.emakiImg}`}
          alt={name}
          data-expand="1000"
        />
      </picture>
    </section>
  );
};

export default EmakiImage;