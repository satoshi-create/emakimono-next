import LegalPageLayout from "@/components/layout/LegalPageLayout";
import LegalContactButton from "@/components/ui/LegalContactButton";
import styles from "@/styles/LegalPage.module.css";
import "lazysizes";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Privacy = () => {
  const { t } = useTranslation("common");
  const sections = t("privacy.sections", { returnObjects: true });

  const renderSection = (key) => {
    const section = sections[key];
    if (!section) return null;
    const items = section.items;

    return (
      <section key={key}>
        <h3>{section.title}</h3>
        <p>{section.body}</p>
        {Array.isArray(items) && (
          <ul>
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}
      </section>
    );
  };

  return (
    <LegalPageLayout
      pagetitle={t("privacy.pagetitle")}
      pageDesc={t("privacy.metaDesc")}
      breadcrumbName={t("privacy.breadcrumb")}
      sectionTitle={t("privacy.sectionTitle")}
    >
      <p className={styles.updated}>{t("privacy.updated")}</p>
      <p>{t("privacy.intro")}</p>
      {renderSection("collected")}
      {renderSection("location")}
      {renderSection("thirdParty")}
      {renderSection("purpose")}
      {sections?.contact && (
        <section>
          <h3>{sections.contact.title}</h3>
          <p>{sections.contact.body}</p>
          <LegalContactButton />
        </section>
      )}
    </LegalPageLayout>
  );
};

export default Privacy;

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
};
