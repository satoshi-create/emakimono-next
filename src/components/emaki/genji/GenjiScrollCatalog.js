import CardA from "@/components/ui/CardA";
import { useTranslation } from "next-i18next";

/** Related Genji picture scrolls on the hub. */
const GenjiScrollCatalog = ({ scrollEmakis }) => {
  const { t } = useTranslation("common");

  if (!scrollEmakis?.length) return null;

  return (
    <CardA
      emakis={scrollEmakis}
      columns={"three"}
      sectiontitle={t("genjiHub.scrollSectionTitle")}
      sectiontitleen={t("genjiHub.scrollSectionTitle")}
    />
  );
};

export default GenjiScrollCatalog;
