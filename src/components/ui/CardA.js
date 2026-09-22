import SingleCardA from "@/components/ui/SingleCardA";
import Title from "@/components/ui/Title";
import styles from "@/styles/CardA.module.css";
import emakiStyles from "@/styles/Emakis.module.css";
import { useRouter } from "next/router";
import { useState } from "react";

const CardA = ({
  emakis,
  columns,
  sectiontitle,
  needdesc,
  sectiondesc,
  sectiontitleen,
  bcg,
  variant,
}) => {
  const { locale } = useRouter();
  const [viewMode, setViewMode] = useState("card");
  const showToggle = columns !== "searchbox";

  return (
    <section
      className={columns !== "searchbox" && "section-grid section-padding"}
      style={{ background: bcg }}
    >
      <div className={emakiStyles.listHeader}>
        <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
        {showToggle && (
          <div
            className={emakiStyles.viewToggle}
            role="tablist"
            aria-label={locale === "en" ? "View mode" : "表示切替"}
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "card"}
              className={`${emakiStyles.viewToggleButton} ${
                viewMode === "card" ? emakiStyles.viewToggleActive : ""
              }`}
              onClick={() => setViewMode("card")}
            >
              {locale === "en" ? "Cards" : "カード"}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "list"}
              className={`${emakiStyles.viewToggleButton} ${
                viewMode === "list" ? emakiStyles.viewToggleActive : ""
              }`}
              onClick={() => setViewMode("list")}
            >
              {locale === "en" ? "List" : "リスト"}
            </button>
          </div>
        )}
      </div>
      {sectiondesc && <p className={styles.sectiondesc}>{sectiondesc}</p>}
      <div
        className={
          viewMode === "list" ? emakiStyles.listView : styles[columns]
        }
      >
        {emakis.map((item, i) => {
          return (
            <SingleCardA
              item={item}
              sectiontitle={sectiontitle}
              columns={columns}
              needdesc={needdesc}
              key={i}
              variant={variant}
            />
          );
        })}
      </div>
    </section>
  );
};

export default CardA;
