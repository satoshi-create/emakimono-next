import React, { useEffect, useRef } from "react";
import styles from "@/styles/SceneCommentaryBar.module.css";

const CommentarySectionIndex = ({
  indexRows = [],
  activeIndex,
  onNavigate,
  onSectionStep,
  isLtr = false,
  t,
}) => {
  const activeItemRef = useRef(null);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({
      block: "nearest",
      inline: isLtr ? "start" : "nearest",
      behavior: "smooth",
    });
  }, [activeIndex, isLtr]);

  const onKeyDown = (e) => {
    if (!isLtr || typeof onSectionStep !== "function") return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onSectionStep(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onSectionStep(1);
    }
  };

  return (
    <nav
      className={`${styles.sectionIndex} ${isLtr ? styles.ltr : ""}`}
      aria-label={t("viewer.sectionList")}
      onKeyDown={onKeyDown}
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
