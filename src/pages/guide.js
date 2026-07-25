import LegalPageLayout from "@/components/layout/LegalPageLayout";
import LegalContactButton from "@/components/ui/LegalContactButton";
import { GITHUB_REPO_URL } from "@/libs/constants/links";
import styles from "@/styles/LegalPage.module.css";
import { buildFaqJsonLd } from "@/utils/buildFaqJsonLd";
import "lazysizes";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Guide = () => {
  const { t } = useTranslation("common");
  const faq = t("guide.faq", { returnObjects: true });
  const jsonLd = buildFaqJsonLd(Array.isArray(faq) ? faq : []);

  return (
    <LegalPageLayout
      pagetitle={t("guide.pagetitle")}
      pageDesc={t("guide.metaDesc")}
      breadcrumbName={t("guide.breadcrumb")}
      sectionTitle={t("guide.sectionTitle")}
      jsonLd={jsonLd}
    >
      <nav className={styles.toc} aria-label={t("guide.tocTitle")}>
        <h3>{t("guide.tocTitle")}</h3>
        <ul>
          <li>
            <a href="#scroll">{t("guide.toc.scroll")}</a>
          </li>
          <li>
            <a href="#features">{t("guide.toc.features")}</a>
          </li>
          <li>
            <a href="#share">{t("guide.toc.share")}</a>
          </li>
        </ul>
      </nav>

      <section id="scroll">
        <h3>{t("guide.scroll.title")}</h3>
        <ol>
          <li>{t("guide.scroll.step1")}</li>
          <li>{t("guide.scroll.step2")}</li>
          <li>{t("guide.scroll.step3")}</li>
        </ol>
      </section>

      <section id="features">
        <h3>{t("guide.features.title")}</h3>
        <ul>
          <li>{t("guide.features.ekotoba")}</li>
          <li>{t("guide.features.nav")}</li>
          <li>{t("guide.features.playback")}</li>
          <li>{t("guide.features.tips")}</li>
        </ul>
      </section>

      <section id="share">
        <h3>{t("guide.share.title")}</h3>
        <ul>
          <li>{t("guide.share.url")}</li>
          <li className={styles.contactBlock}>
            <p>{t("guide.share.contact")}</p>
            <LegalContactButton />
          </li>
          <li>
            {t("guide.share.github")}{" "}
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </li>
        </ul>
      </section>
    </LegalPageLayout>
  );
};

export default Guide;

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
};
