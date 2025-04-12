import styles from "@/styles/ResposiveImage.module.css";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import Image from "next/image";

const ResposiveImage = ({
  value: { srcSp, srcTb, src, name, srcWidth, srcHeight, scroll, load, index },
}) => {
  return (
    <picture>
      <source
        data-srcset={srcTb}
        media="(max-height: 800px)"
        type="image/webp"
      />
      <Image
        src={srcSp}
        alt={name}
        width={width}
        height={height}
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
