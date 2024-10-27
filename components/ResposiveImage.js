import React from "react";
import styles from "../styles/ResposiveImage.module.css";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";

// TODO:FIXED:モバイルデバイスでリンク元から目的の画像に飛ばない
// ⇒幅（srcWidth）、高さ（srcHeight）がsrcTbの画像で設定されていない事が原因。
// next / imageで画像サイズを自動で付与する方法を試してみる

const ResposiveImage = ({
  value: { srcSp, srcTb, src, name, srcWidth, srcHeight, scroll, load },
}) => {
    return (
      <picture>
        <source
          data-srcset={srcTb}
          media="(max-height: 800px)"
          type="image/webp"
        />
        <img
          loading="lazy"
          src={srcSp}
          data-src={src}
          // data-size="auto"
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
