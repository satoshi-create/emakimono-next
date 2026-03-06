import styles from "@/styles/CardC.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

const SingleCardC = ({ item, i }) => {
  const { locale } = useRouter();
  const titleen = item?.titleen ?? item?.scroll_id ?? "";
  const title = item?.title ?? "";
  const thumb = item?.thumb ?? item?.thumbnail ?? "";
  const edition = item?.edition ?? "";
  return (
    <div key={i} className={styles.box}>
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
              {locale == "en" ? titleen : title}
              <div>{locale == "ja" && edition}</div>
            </h3>
          </div>
        </a>
      </Link>
    </div>
  );
};

export default SingleCardC;
