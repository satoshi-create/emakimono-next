import styles from "@/styles/ResposiveImage.module.css";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import Image from "next/image";

const ResposiveImage = ({
  value: {
    srcSp,
    srcTb,
    src,
    name,
    srcWidth,
    srcHeight,
    scroll,
    load,
    index,
    width,
    height,
  },
}) => {
  // 旧スキーマ: srcWidth/srcHeight、新スキーマ: width/height のどちらでも取得（Next/Image 用に数値化）
  const w = Number(srcWidth ?? width) || 1;
  const h = Number(srcHeight ?? height) || 1;
  return (
    <picture>
      <source
        data-srcset={srcTb}
        media="(max-height: 800px)"
        type="image/webp"
      />
      <Image
        src={srcSp ?? src}
        alt={name}
        width={w}
        height={h}
        className={`fade-in lazyload ${styles.emakiImg}`}
        data-expand="1000"
      />
      {/* <img
        src={srcSp}
        data-src={src}
        className={`fade-in lazyload ${styles.emakiImg}`}
        alt={name}
        width={srcWidth}
        height={srcHeight}
        data-expand="1000"
      /> */}
    </picture>
  );
};

export default ResposiveImage;
