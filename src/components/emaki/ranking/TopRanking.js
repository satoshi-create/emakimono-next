import Title from "@/components/ui/Title";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/TopRanking.module.css";
import { eraColor } from "@/utils/func";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext } from "react";

const TopRanking = () => {
  const { locale } = useRouter();
  const { rankingData, loading } = useContext(AppContext);

  const top3 = rankingData.slice(0, 3);

  if (loading || top3.length === 0) return null;

  return (
    <section className="section-grid section-padding">
      <Title
        sectiontitle={locale === "en" ? "Popular Emaki" : "いま人気の絵巻"}
      />
      <div className={styles.grid}>
        {top3.map((item, i) => {
          const rank = i + 1;
          return (
            <Link href={`/${item.titleen}`} key={i}>
              <a>
                <div className={styles.card}>
                  <Image
                    src={item.thumb}
                    alt={item.title}
                    layout="fill"
                    objectFit="cover"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
                  />
                  <div className={styles.overlay}>
                    <div className={styles.rankRow}>
                      <span className={styles.rank} data-rank={rank}>
                        {locale === "en" ? `#${rank}` : `${rank}位`}
                      </span>
                      <span
                        className={styles.eraBadge}
                        style={{
                          backgroundColor: eraColor(item.era) || "#888",
                        }}
                      >
                        {locale === "en"
                          ? `${item.eraen} period`
                          : `${item.era}時代`}
                      </span>
                    </div>
                    <span className={styles.cardTitle}>
                      {locale === "en" ? item.titleen : item.title}
                      {locale === "ja" && item.edition && ` ${item.edition}`}
                    </span>
                    <div className={styles.views}>
                      <FontAwesomeIcon icon={faEye} className={styles.viewIcon} />
                      {Number(item.pageView).toLocaleString()}
                      {locale === "ja" && "回鑑賞"}
                    </div>
                  </div>
                </div>
              </a>
            </Link>
          );
        })}
      </div>
      <div className={styles.moreLink}>
        <Link href="/ranking">
          <a>
            <button className={styles.moreLinkBtn}>
              {locale === "en"
                ? "View All Rankings"
                : "ランキングをもっと見る"}
            </button>
          </a>
        </Link>
      </div>
    </section>
  );
};

export default TopRanking;
