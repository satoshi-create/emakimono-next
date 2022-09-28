import React from "react";
import styles from "../styles/ResposiveImage.module.css";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";

const ResposiveImage = ({ value: { srcSp, srcTb, src, load, name } }) => (
  <picture>
    <source data-srcset={srcSp} media="(max-height: 375px)" type="image/webp" />
    <source data-srcset={srcTb} media="(max-height: 800px)" type="image/webp" />
    <source data-srcset={src} type="image/webp" />
    <img
      decoding="async"
      // src={
      //   load
      //     ? srcSp
      //     : "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
      // }
      src={srcSp}
      className={`loading lazyload ${styles.emakiImg}`}
      alt={name}
    />
  </picture>
);

export default ResposiveImage;
