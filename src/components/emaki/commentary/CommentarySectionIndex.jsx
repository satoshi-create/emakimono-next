import React, { useEffect, useRef } from "react";
import styles from "@/styles/SceneCommentaryBar.module.css";

const CommentarySectionIndex = ({
  indexRows = [],
  activeIndex,
  onNavigate,
  t,
}) => {
  const activeItemRef = useRef(null);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeIndex]);

  return (
    <nav
      className={styles.sectionIndex}
      aria-label={t("viewer.sectionList")}
    >
      {indexRows.map((row, i) => (
        <button
          key={row.linkId}
          ref={i === activeIndex ? activeItemRef : undefined}
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
