import styles from "@/styles/CardC.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import type { EmakiImageMetadata } from '@/types/metadata'; // Import the type

// Define Props Interface
interface SingleCardCProps {
  item: EmakiImageMetadata;
}

const SingleCardC = ({ item }: SingleCardCProps) => {
  const { locale } = useRouter();
  const { titleen, title, thumb, edition, author } = item;
  return (
    <div className={styles.box}>
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
