import Title from "@/components/ui/Title";
import { GENJI_SOURCES } from "@/libs/constants/genjiSources";
import styles from "@/styles/GenjiHub.module.css";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

const GenjiSourcesBlock = () => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";

  return (
    <section className={`section-grid section-padding ${styles.sourcesSection}`}>
      <Title sectiontitle={t("genjiHub.sourcesSectionTitle")} />
      <ul className={styles.sourcesList}>
        <li>
          <a
            href={GENJI_SOURCES.kobun.indexUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {isEn ? GENJI_SOURCES.kobun.labelEn : GENJI_SOURCES.kobun.labelJa}
          </a>
        </li>
        <li>
          <a
            href={GENJI_SOURCES.gendaibun.indexUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {isEn
              ? GENJI_SOURCES.gendaibun.labelEn
              : GENJI_SOURCES.gendaibun.labelJa}
          </a>
        </li>
      </ul>
      <p className={styles.sourcesNote}>{t("genjiHub.sourcesNote")}</p>
    </section>
  );
};

export default GenjiSourcesBlock;
