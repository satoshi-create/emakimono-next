import styles from "@/styles/KusouzuHub.module.css";
import { useTranslation } from "next-i18next";

const KusouzuHubIntro = () => {
  const { t } = useTranslation("common");

  return (
    <section className={`section-grid section-padding ${styles.intro}`}>
      <h1 className={styles.introTitle}>{t("kusouzuHub.introTitle")}</h1>
      <p className={styles.introLead}>{t("kusouzuHub.intro")}</p>
      <p className={styles.introTips}>{t("kusouzuHub.tips")}</p>
    </section>
  );
};

export default KusouzuHubIntro;
