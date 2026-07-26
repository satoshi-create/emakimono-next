import CardA from "@/components/ui/CardA";
import Title from "@/components/ui/Title";
import { useLocale } from "@/utils/func";
import { useTranslation } from "next-i18next";

const KusouzuScrollCatalog = ({ scrollEmakis }) => {
  const { t } = useTranslation("common");
  const { t: staticCopy } = useLocale();

  return (
    <section className="section-grid section-padding">
      <Title sectiontitle={t("kusouzuHub.scrollSectionTitle")} />
      <CardA
        emakis={scrollEmakis}
        columns={staticCopy.kusouzu.columns}
        bcg="var(--clr-surface)"
      />
    </section>
  );
};

export default KusouzuScrollCatalog;
