import LegalPageLayout from "@/components/layout/LegalPageLayout";
import LegalContactButton from "@/components/ui/LegalContactButton";
import styles from "@/styles/LegalPage.module.css";
import "lazysizes";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Copyright = () => {
  const { t } = useTranslation("common");

  const getArray = (path) => {
    const value = t(path, { returnObjects: true });
    return Array.isArray(value) ? value : [];
  };

  const renderPoints = (key) => {
    const points = getArray(`copyright.sections.${key}.points`);
    if (!points.length) return null;
    return (
      <ul>
        {points.map((point, i) => (
          <li key={i}>{point}</li>
        ))}
      </ul>
    );
  };

  const renderConditions = () => {
    const conditions = getArray("copyright.sections.cc.conditions");
    if (!conditions.length) return null;
    return (
      <ul className={styles.conditionList}>
        {conditions.map((item, i) => (
          <li key={i} className={styles.conditionItem}>
            <span className={styles.conditionBadge}>{item.code}</span>
            <span>
              <strong>{item.label}</strong> — {item.desc}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderLicenseTable = () => {
    const columns = getArray("copyright.sections.cc.columns");
    const rows = getArray("copyright.sections.cc.rows");
    if (!rows.length) return null;
    const cellClass = (cell) =>
      cell === "✕"
        ? styles.cellNg
        : cell === "◯"
          ? styles.cellOk
          : "";
    return (
      <div className={styles.tableWrap}>
        <table className={styles.licenseTable}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} scope="col">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <th scope="row">{row.name}</th>
                {row.cells.map((cell, j) => (
                  <td key={j} className={cellClass(cell)}>
                    {cell}
                  </td>
                ))}
                <td className={styles.cellSummary}>{row.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderOfficialLinks = (key) => {
    const links = getArray(`copyright.sections.${key}.official.links`);
    if (!links.length) return null;
    return (
      <div className={styles.officialLinks}>
        <h4>{t(`copyright.sections.${key}.official.title`)}</h4>
        <ul>
          {links.map((link, i) => (
            <li key={i}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderLinks = (key) => {
    const links = getArray(`copyright.sections.${key}.links`);
    if (!links.length) return null;
    return (
      <ul>
        {links.map((link, i) => (
          <li key={i}>
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.name}
            </a>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <LegalPageLayout
      pagetitle={t("copyright.pagetitle")}
      pageDesc={t("copyright.metaDesc")}
      breadcrumbName={t("copyright.breadcrumb")}
      sectionTitle={t("copyright.sectionTitle")}
    >
      <p className={styles.updated}>{t("copyright.updated")}</p>
      <p>{t("copyright.intro")}</p>

      <nav className={styles.toc} aria-label={t("copyright.tocTitle")}>
        <h3>{t("copyright.tocTitle")}</h3>
        <ul>
          <li>
            <a href="#copyright">{t("copyright.toc.copyright")}</a>
          </li>
          <li>
            <a href="#cc">{t("copyright.toc.cc")}</a>
          </li>
          <li>
            <a href="#ai">{t("copyright.toc.ai")}</a>
          </li>
          <li>
            <a href="#sources">{t("copyright.toc.sources")}</a>
          </li>
        </ul>
      </nav>

      <section id="copyright">
        <h3>{t("copyright.sections.copyright.title")}</h3>
        <p>{t("copyright.sections.copyright.body")}</p>
        {renderPoints("copyright")}
        {renderOfficialLinks("copyright")}
      </section>

      <section id="cc">
        <h3>{t("copyright.sections.cc.title")}</h3>
        <p>{t("copyright.sections.cc.body")}</p>
        <h4>{t("copyright.sections.cc.conditionsTitle")}</h4>
        {renderConditions()}
        <h4>{t("copyright.sections.cc.tableTitle")}</h4>
        {renderLicenseTable()}
        <p className={styles.sectionNote}>{t("copyright.sections.cc.note")}</p>
        {renderOfficialLinks("cc")}
      </section>

      <section id="ai">
        <h3>{t("copyright.sections.ai.title")}</h3>
        <p>{t("copyright.sections.ai.body")}</p>
        {renderPoints("ai")}
      </section>

      <section id="sources">
        <h3>{t("copyright.sections.sources.title")}</h3>
        <p>{t("copyright.sections.sources.body")}</p>
        {renderLinks("sources")}
      </section>

      <section id="contact">
        <h3>{t("copyright.sections.contact.title")}</h3>
        <p>{t("copyright.sections.contact.body")}</p>
        <LegalContactButton />
      </section>
    </LegalPageLayout>
  );
};

export default Copyright;

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
};
