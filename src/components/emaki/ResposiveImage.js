import styles from "@/styles/ResposiveImage.module.css";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";

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
      <img
        src={srcSp}
        data-src={src}
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
