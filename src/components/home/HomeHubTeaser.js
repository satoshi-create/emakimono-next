import styles from "@/styles/HomeHubTeaser.module.css";
import {
  CHOUJU_GIGA_HUB_PATH,
  KUSOUZU_HUB_PATH,
} from "@/libs/constants/links";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "next-i18next";

/**
 * Compact hub teaser — one thumbnail + CTA to the full hub page.
 */
const HomeHubTeaser = ({ hubKey, thumb, title }) => {
  const { t } = useTranslation("common");
  const href = hubKey === "chouju" ? CHOUJU_GIGA_HUB_PATH : KUSOUZU_HUB_PATH;

  return (
    <Link href={href}>
      <a className={styles.card}>
        {thumb && (
          <div className={styles.thumbWrap}>
            <Image
              src={thumb}
              alt={title}
              width={533}
              height={300}
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
            />
          </div>
        )}
        <div className={styles.body}>
          <h3 className={styles.title}>{t(`home.${hubKey}Teaser.title`)}</h3>
          <p className={styles.desc}>{t(`home.${hubKey}Teaser.desc`)}</p>
          <span className={styles.cta}>{t(`home.${hubKey}Teaser.cta`)} →</span>
        </div>
      </a>
    </Link>
  );
};

const HomeHubTeaserSection = ({ choujuThumb, choujuTitle, kusouzuThumb, kusouzuTitle }) => {
  const { t } = useTranslation("common");

  return (
    <section className={`section-grid section-padding ${styles.section}`}>
      <h2 className={styles.sectionTitle}>{t("home.hubTeaserSectionTitle")}</h2>
      <div className={styles.grid}>
        <HomeHubTeaser hubKey="chouju" thumb={choujuThumb} title={choujuTitle} />
        <HomeHubTeaser hubKey="kusouzu" thumb={kusouzuThumb} title={kusouzuTitle} />
      </div>
    </section>
  );
};

export default HomeHubTeaserSection;
