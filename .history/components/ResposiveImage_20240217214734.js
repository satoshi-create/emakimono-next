import React, { useEffect, useState } from "react";
import styles from "../styles/ResposiveImage.module.css";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";

const ResposiveImage = ({
  value: { srcSp, srcTb, src, load, name, srcWidth, srcHeight, index,scroll },
}) => {

  // const dummySrc = (s, l) => {
  //   if (s) {
  //     if (l) {
  //       return srcSp;
  //     } else {
  //       return "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
  //     }
  //   } else {
  //     return "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
  //   }
  // };
  return (
    <picture>
      <source
        data-srcset={srtTb}
        media="(max-height: 375px)"
        type="image/webp"
      />
      <source
        data-srcset={srcTb}
        media="(max-height: 800px)"
        type="image/webp"
      />
      <source data-srcset={scroll ? src : srcTb} type="image/webp" />
      <img
        decoding="async"
        // src={dummySrc(scroll,load)}
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
        data-expand="1000"
      />
    </picture>
  );
};

export default ResposiveImage;
