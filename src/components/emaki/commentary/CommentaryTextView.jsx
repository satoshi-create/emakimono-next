import React from "react";
import styles from "@/styles/SceneCommentaryBar.module.css";

const CommentaryTextView = ({
  activeMode,
  chapterTexts,
  expanded,
  locale,
  readMoreLabel,
}) => {
  const isEn = locale === "en";
  const plainBody =
    activeMode === "desc"
      ? chapterTexts.desc
      : activeMode === "gendaibun"
        ? chapterTexts.gendaibun
        : chapterTexts.kobun;

  const hasBody = Boolean(plainBody && plainBody.length > 0);
  if (!hasBody) return null;

  const splitAt = isEn ? plainBody.search(/\.\s/) : plainBody.indexOf("。");
  const hasRest = splitAt >= 0 && splitAt < plainBody.length - 1;
  const previewText = hasRest ? plainBody.slice(0, splitAt + 1) : plainBody;

  if (expanded) {
    if (activeMode === "kobun" && chapterTexts.kobunHtml) {
      return (
        <span
          className={`${styles.bodyText} ${styles.bodyTextClassical}`}
          dangerouslySetInnerHTML={{
            __html: chapterTexts.kobunHtml,
          }}
        />
      );
    }
    return (
      <span
        className={`${styles.bodyText} ${
          activeMode === "kobun" ? styles.bodyTextClassical : ""
        }`}
      >
        {plainBody}
      </span>
    );
  }

  return (
    <span
      className={`${styles.bodyText} ${
        activeMode === "kobun" ? styles.bodyTextClassical : ""
      }`}
    >
      {previewText}
      {hasRest && (
        <span
          style={{
            display: "inline",
            fontSize: "0.75rem",
            color: "rgba(0, 0, 0, 0.45)",
            fontWeight: 400,
            marginLeft: "6px",
          }}
        >
          …{readMoreLabel}
        </span>
      )}
    </span>
  );
};

export default CommentaryTextView;
