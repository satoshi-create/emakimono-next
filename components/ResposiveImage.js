import React, { useEffect, useState } from "react";
import styles from "../styles/ResposiveImage.module.css";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";

const ResposiveImage = ({
  value: { srcSp, srcTb, src, load, name, srcWidth, srcHeight, index, scroll },
}) => {
  return (
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
        // src={
        //   load
        //     ? srcSp
        //     : "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
        // }
        src={
          scroll
            ? srcSp
            : "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
        }
        className={`fade-in lazyload ${styles.emakiImg}`}
        alt={name}
        width={srcWidth}
        height={srcHeight}
        data-expand="-300"
      />
    </picture>
  );
};

export default ResposiveImage;
