import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import Title from "@/components/ui/Title";
import { relatedSiteLinks } from "@/libs/constants/links";
import styles from "@/styles/LegalPage.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const LegalPageLayout = ({
  pagetitle,
  pageDesc,
  breadcrumbName,
  sectionTitle,
  jsonLd,
  noindex,
  children,
}) => {
  const { locale } = useRouter();
  const { t } = useTranslation("common");

  return (
    <>
      <Head
        pagetitle={pagetitle}
        pageDesc={pageDesc}
        jsonLd={jsonLd}
        noindex={noindex}
      />
      <Header fixed={false} />
      <Breadcrumbs name={breadcrumbName} />
      <section className="section-grid section-padding">
        <Title sectiontitle={sectionTitle} />
        <div className={styles.content}>{children}</div>
        <nav className={styles.related} aria-label={t("legal.relatedLinks")}>
          <h3>{t("legal.relatedLinks")}</h3>
          <ul>
            {relatedSiteLinks.map(({ path, name, nameen }) => (
              <li key={path}>
                <Link href={path}>
                  <a>{locale === "ja" ? name : nameen}</a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>
      <Footer />
    </>
  );
};

export default LegalPageLayout;
