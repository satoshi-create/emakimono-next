import React from "react";
import SceneLikeButton from "@/components/emaki/viewer/SceneLikeButton";
import styles from "@/styles/SwitcherEmaki.module.css";

export function SceneChapterOverlay({
  chapterTitle,
  index,
  locale,
  title,
  titleen,
  onSelectChapter,
  isLtr = false,
}) {
  return (
    <div className={`${styles.chapterbox}${isLtr ? ` ${styles.ltr}` : ""}`}>
      <h3
        className={styles.chapter}
        onClick={() => onSelectChapter?.(index)}
        style={{
          fontFamily:
            locale === "en" ? "var(--font-ui)" : "var(--font-classical)",
        }}
      >
        {chapterTitle}
      </h3>
      <SceneLikeButton
        chapter={chapterTitle}
        index={index}
        title={title}
        titleen={titleen}
        variant="bar"
      />
    </div>
  );
}