import Image from "next/image";
import styles from "@/styles/GenjiHub.module.css";
import { useTranslation } from "next-i18next";

const GenjiHubIntro = ({ heroThumb }) => {
  const { t } = useTranslation("common");

  return (
    <section className={styles.hero}>
      {heroThumb && (
        <div className={styles.heroImageWrap}>
          <Image
            src={heroThumb}
            alt=""
            width={800}
            height={450}
            sizes="100vw"
            priority
            className={styles.heroImage}
          />
        </div>
      )}
      <div className={styles.heroText}>
        <h1 className={styles.introTitle}>{t("genjiHub.introTitle")}</h1>
        <p className={styles.introLead}>{t("genjiHub.intro")}</p>
        <p className={styles.introTips}>{t("genjiHub.tips")}</p>
      </div>
    </section>
  );
};

export default GenjiHubIntro;
