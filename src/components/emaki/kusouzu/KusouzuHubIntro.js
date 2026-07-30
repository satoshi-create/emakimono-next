import Image from "next/image";
import styles from "@/styles/KusouzuHub.module.css";
import { useTranslation } from "next-i18next";

const CLOUDINARY_BASE =
  "https://res.cloudinary.com/dw2gjxrrf/image/upload/fl_progressive";

/**
 * Cloudinary loader for hero images.
 * Applies smart fill crop, auto format, quality, and a subtle dark
 * gradient overlay at the bottom for text readability.
 */
const heroLoader = ({ src, width, quality }) => {
  return `${CLOUDINARY_BASE},w_${width},ar_16:9,c_fill,g_face` +
    `,f_auto,q_${quality || 75}` +
    `,co_black,e_gradient_fade:y_-0.4/${src}`;
};

const KusouzuHubIntro = ({ heroThumb, heroCloudinary }) => {
  const { t } = useTranslation("common");

  return (
    <section className={styles.hero}>
      {(heroCloudinary || heroThumb) && (
        <div className={styles.heroImageWrap}>
          {heroCloudinary ? (
            <Image
              loader={heroLoader}
              src={heroCloudinary}
              alt="九相図巻"
              width={1600}
              height={900}
              sizes="100vw"
              priority
              className={styles.heroImage}
            />
          ) : (
            <Image
              src={heroThumb}
              alt="九相図巻"
              width={800}
              height={450}
              sizes="100vw"
              priority
              className={styles.heroImage}
            />
          )}
        </div>
      )}
      <div className={styles.heroText}>
        <h1 className={styles.introTitle}>{t("kusouzuHub.introTitle")}</h1>
        <p className={styles.introLead}>{t("kusouzuHub.intro")}</p>
        <p className={styles.introTips}>{t("kusouzuHub.tips")}</p>
      </div>
    </section>
  );
};

export default KusouzuHubIntro;
