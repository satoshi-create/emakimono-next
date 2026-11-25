import styles from "@/styles/CardC.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { getLocalizedField } from "@/utils/emakiDisplayTitle";

const SingleCardC = ({ item, i, variant }) => {
  const { locale } = useRouter();
  const isJa = locale === "ja";
  const { titleen, title, thumb, edition, author } = item;
  const boxClass =
    variant === "editionlink"
      ? `${styles.box} ${styles.boxEdition}`
      : styles.box;
  return (
    <div key={i} className={boxClass}>
      <Link href={`/${titleen}`}>
        <a>
          <Image
            src={thumb}
            width={233}
            height={130}
            alt={title}
            className={styles.image}
            loading="lazy"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
          />
        </a>
      </Link>
      <Link href={`/${titleen}`}>
        <a>
          <div className={styles.metadata}>
            <h3 className={styles.title}>
              {getLocalizedField(item, "title", locale)}
              <div>{isJa && edition}</div>
            </h3>
          </div>
        </a>
      </Link>
    </div>
  );
};

export default SingleCardC;
