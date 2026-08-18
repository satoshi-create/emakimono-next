import Image from "next/image";
import styles from "@/styles/KusouzuHub.module.css";
import { createCloudinaryHeroLoader } from "@/utils/cloudinaryUrl";
import { useTranslation } from "next-i18next";

const heroLoader = createCloudinaryHeroLoader("g_face");

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
