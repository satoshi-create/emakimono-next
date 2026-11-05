import React from "react";
import styles from "@/styles/SceneCommentaryBar.module.css";

const CommentarySectionIndex = ({
  indexRows = [],
  activeIndex,
  onNavigate,
  t,
}) => {
  return (
    <nav
      className={styles.sectionIndex}
      aria-label={t("viewer.sectionList")}
    >
      {indexRows.map((row, i) => (
        <button
          key={row.linkId}
          type="button"
          className={`${styles.indexItem} ${
            i === activeIndex ? styles.indexItemActive : ""
          }`}
          onClick={() => onNavigate(i)}
        >
          {row.thumb ? (
            <img
              className={styles.indexThumb}
              src={row.thumb}
              alt=""
              loading="lazy"
            />
          ) : (
            <span className={styles.indexThumb} aria-hidden="true" />
          )}
          <span className={styles.indexText}>
            <span className={styles.indexTitle}>{row.title}</span>
            {row.desc ? (
              <span className={styles.indexDesc}>{row.desc}</span>
            ) : null}
          </span>
          {i === activeIndex && (
            <span className={styles.indexCurrent}>
              {t("viewer.currentSection")}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};

export default CommentarySectionIndex;
