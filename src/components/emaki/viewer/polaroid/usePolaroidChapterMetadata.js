import { useMemo } from "react";
import {
  ChaptersTitle,
  connectEmakiTextData,
  isGenjiWork,
  resolveGenjiMasterChapter,
  connectGenjiChapters,
} from "@/utils/emakiChapterText";

/**
 * PolaroidModal 内の作品名・章タイトル・詞書を解決するカスタムフック
 */
export function usePolaroidChapterMetadata({
  scenes = [],
  currentScene,
  scrollId = "",
  scrollTitle = "",
  title = "",
  emakiTitle = "",
  titleen = "",
  titleEn = "",
  scrollTitleEn = "",
  isEn = false,
}) {
  const currentLinkId = currentScene?.linkId ?? 0;

  const safeString = (val) =>
    typeof val === "string" ? val.trim() : typeof val === "number" ? String(val) : "";

  const { resolvedChapterTitle } = useMemo(() => {
    let ekotoba = null;
    for (let i = 0; i < scenes.length; i++) {
      const item = scenes[i];
      if (item?.cat === "ekotoba" && item.linkId <= currentLinkId) ekotoba = item;
    }
    if (!ekotoba) return { resolvedChapterTitle: "" };

    let chapterTitleStr = "";

    const fromJson = connectEmakiTextData(scrollId, ekotoba.chapter, isEn ? "titleen" : "title");
    if (typeof fromJson === "string" && fromJson.trim()) {
      chapterTitleStr = fromJson.trim();
    }

    if (!chapterTitleStr && isGenjiWork(scrollId, scrollTitle)) {
      const masterCh = resolveGenjiMasterChapter(
        scrollId,
        ekotoba.chapter,
        ekotoba.genji_chapter
      );
      const chNum = connectGenjiChapters(masterCh, "chapter_ch");
      const genjiTitle = connectGenjiChapters(masterCh, isEn ? "titleen" : "title");
      if (genjiTitle) {
        chapterTitleStr = chNum ? `第${chNum}帖 ${genjiTitle}` : genjiTitle;
      }
    }

    if (!chapterTitleStr) {
      if (isEn) {
        if (typeof ekotoba.titleen === "string" && ekotoba.titleen.trim()) {
          chapterTitleStr = ekotoba.titleen.trim();
        } else if (typeof ekotoba.chapterTitleEn === "string" && ekotoba.chapterTitleEn.trim()) {
          chapterTitleStr = ekotoba.chapterTitleEn.trim();
        } else if (typeof ekotoba.chapteren === "string" && ekotoba.chapteren.trim()) {
          chapterTitleStr = ekotoba.chapteren.trim();
        }
      }
      if (!chapterTitleStr && typeof ekotoba.title === "string" && ekotoba.title.trim()) {
        chapterTitleStr = ekotoba.title.trim();
      } else if (!chapterTitleStr) {
        const rawTitle = ChaptersTitle(
          scrollId,
          scrollTitle,
          ekotoba.chapter,
          isEn ? "titleen" : "title",
          ekotoba.genji_chapter
        );
        if (typeof rawTitle === "string") {
          chapterTitleStr = rawTitle.trim();
        }
      }
    }

    return {
      resolvedChapterTitle: safeString(chapterTitleStr),
    };
  }, [scenes, currentLinkId, scrollId, scrollTitle, isEn]);

  const rawTitleEn =
    safeString(titleen) ||
    safeString(titleEn) ||
    safeString(scrollTitleEn) ||
    safeString(currentScene?.titleen) ||
    safeString(currentScene?.titleEn) ||
    safeString(currentScene?.scrollTitleEn) ||
    "";

  const rawTitleJa =
    safeString(title) ||
    safeString(currentScene?.title) ||
    safeString(emakiTitle) ||
    safeString(scrollTitle);

  const displayTitle = isEn && rawTitleEn ? rawTitleEn : rawTitleJa;

  const displayChapter = isEn
    ? safeString(currentScene?.chapterTitleEn) ||
      safeString(currentScene?.chapteren) ||
      safeString(resolvedChapterTitle)
    : safeString(resolvedChapterTitle);

  return {
    displayTitle,
    displayChapter,
  };
}
