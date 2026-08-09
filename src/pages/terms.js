import LegalPageLayout from "@/components/layout/LegalPageLayout";
import LegalContactButton from "@/components/ui/LegalContactButton";
import { operatorSocialLinks } from "@/libs/constants/links";
import styles from "@/styles/LegalPage.module.css";
import "lazysizes";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Terms = () => {
  const { locale } = useRouter();
  const { t } = useTranslation("common");
  const sections = t("terms.sections", { returnObjects: true });

  const sectionKeys = ["definitions", "service", "prohibited", "disclaimer"];

  return (
    <LegalPageLayout
      pagetitle={t("terms.pagetitle")}
      pageDesc={t("terms.metaDesc")}
      breadcrumbName={t("terms.breadcrumb")}
      sectionTitle={t("terms.sectionTitle")}
    >
      <p className={styles.updated}>{t("terms.updated")}</p>
      <p>{t("terms.intro")}</p>
      {sectionKeys.map((key) => {
        const section = sections[key];
        if (!section) return null;
        return (
          <section key={key}>
            <h3>{section.title}</h3>
            <p>{section.body}</p>
            {Array.isArray(section.items) && (
              <ul>
                {section.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {sections?.sensitive && (
        <section>
          <h3>{sections.sensitive.title}</h3>
          <p>{sections.sensitive.body}</p>
        </section>
      )}

      {sections?.operator && (
        <section>
          <h3>{sections.operator.title}</h3>
          <p>{sections.operator.body}</p>
          <LegalContactButton />
          <p className={styles.socialLinksTitle}>{t("legal.socialLinksTitle")}</p>
          <ul className={styles.socialLinks}>
            {operatorSocialLinks.map(({ label, labelEn, url }) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  {locale === "ja" ? label : labelEn || label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </LegalPageLayout>
  );
};

export default Terms;

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
};
