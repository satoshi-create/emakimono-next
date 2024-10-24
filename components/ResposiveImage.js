import React from "react";
import styles from "../styles/ResposiveImage.module.css";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";

// TODO:FIXED:モバイルデバイスでリンク元から目的の画像に飛ばない
// ⇒幅（srcWidth）、高さ（srcHeight）がsrcTbの画像で設定されていない事が原因。
// next / imageで画像サイズを自動で付与する方法を試してみる

const ResposiveImage = ({
  value: { srcSp, srcTb, src,name, srcWidth, srcHeight, scroll },
}) => {
  return (
    <picture>
      {/* <source
        data-srcset={srcSp}
        media="(max-height: 412px)"
        type="image/webp"
      /> */}
      <source
        data-srcset={srcTb}
        media="(max-height: 800px)"
        type="image/webp"
      />
      <source data-srcset={scroll ? src : srcTb} type="image/webp" />
      <img
        // decoding="async"
        // decoding="async"について詳しく調べてみる //https://zenn.dev/ixkaito/articles/deep-dive-into-decoding
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
