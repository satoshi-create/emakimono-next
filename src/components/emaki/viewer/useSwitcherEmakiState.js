import { useState } from "react";
import { ALL_QUIZZES } from "@/data/quiz/index";
import { ChaptersTitle } from "@/utils/emakiChapterText";
import { buildSceneShellStyle } from "@/utils/emakiContentWindow";
import { isByobuScroll } from "@/utils/isByobuScroll";

function usesPanelChapterGuards(data) {
  if (Array.isArray(data?.panels) && data.panels.length > 0) return true;
  return data?.readingDirection === "ltr";
}

function sceneChapterKeyForPill(data, item) {
  if (item?.scene_chapter != null && String(item.scene_chapter).trim() !== "") {
    return String(item.scene_chapter);
  }
  const globalIdx = item?.global_index;
  if (
    Number.isFinite(Number(globalIdx)) &&
    Array.isArray(data?.panels) &&
    data.panels.length > 0
  ) {
    const panel = data.panels.find((p) => {
      const range = p?.slice_range;
      if (!Array.isArray(range) || range.length < 1) return false;
      return Number(range[0]) === Number(globalIdx);
    });
    if (panel?.chapter_id != null) return String(panel.chapter_id);
  }
  return item?.chapter;
}

function shouldShowSceneChapterPill(data, item) {
  if (!usesPanelChapterGuards(data)) return true;
  if (item?.chapter_pill) return true;
  const chapters = data?.chapters;
  if (!Array.isArray(chapters) || chapters.length === 0) return false;
  const globalIdx = item?.global_index;
  for (const ch of chapters) {
    const range = ch?.range;
    if (!Array.isArray(range) || range.length < 2) continue;
    const start = Number(range[0]);
    if (!Number.isFinite(start)) continue;
    if (Number(globalIdx) === start) return true;
    if (
      globalIdx == null &&
      item?.chapter != null &&
      String(ch.chapter) === String(item.chapter) &&
      start === 1
    ) {
      return true;
    }
  }
  return false;
}

export function useSwitcherEmakiState({
  cat,
  data,
  item,
  index,
  locale,
  orientation,
  toggleFullscreen,
  chapterToggle,
  floatLandscape,
  ebikiPickerEnabled,
}) {
  const isEditSpotsMode =
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("editSpots") === "1";

  const [activeSliceIdx, setActiveSliceIdx] = useState(null);

  const isSupportedCat = cat === "image" || cat === "ekotoba";
  const isImage = cat === "image";

  const scrollKey = data?.scroll_id ?? data?.titleen;
  const quizDef =
    scrollKey &&
    ALL_QUIZZES.find((q) => q.titleen === scrollKey || q.id === scrollKey);
  const hasQuizPanoramaTarget = Boolean(
    quizDef?.questions?.some((q) => q?.target)
  );
  const usePanoramaSpots =
    Array.isArray(data?.spots) || hasQuizPanoramaTarget;

  const {
    chapter,
    genji_chapter: genjiChapter,
    title: itemTitle,
    title_zh: itemTitleZh,
  } = item ?? {};
  const panelGuards = usesPanelChapterGuards(data);
  const chapterLookup = panelGuards ? sceneChapterKeyForPill(data, item) : chapter;
  const panelsArg = data?.panels;
  const chapterTitleFromTexts =
    locale === "zh-Hans"
      ? ChaptersTitle(
          data?.titleen,
          data?.title,
          chapterLookup,
          "title_zh",
          genjiChapter,
          panelsArg
        ) ||
        ChaptersTitle(
          data?.titleen,
          data?.title,
          chapterLookup,
          "titleen",
          genjiChapter,
          panelsArg
        )
      : locale === "en"
        ? ChaptersTitle(
            data?.titleen,
            data?.title,
            chapterLookup,
            "titleen",
            genjiChapter,
            panelsArg
          )
        : ChaptersTitle(
            data?.titleen,
            data?.title,
            chapterLookup,
            "title",
            genjiChapter,
            panelsArg
          );
  const chapterTitle =
    chapterTitleFromTexts ||
    (panelGuards
      ? ""
      : (locale === "zh-Hans" ? itemTitleZh || itemTitle : itemTitle) || "");

  const isByobu = isByobuScroll(data);
  const sectionStyle = buildSceneShellStyle(item, {
    toggleFullscreen,
    orientation,
    floatLandscape,
    isByobu,
  });

  const spots = isImage && !usePanoramaSpots ? item?.spots : null;
  const showChapterTitle = Boolean(
    chapterTitle &&
      chapterToggle &&
      !isByobu &&
      data?.typeen !== "birdseye" &&
      shouldShowSceneChapterPill(data, item)
  );

  const needsRelativeLayer = Boolean(
    spots?.length ||
      isEditSpotsMode ||
      ebikiPickerEnabled ||
      showChapterTitle
  );
  const hasSpotOverflow = Boolean(spots?.length || isEditSpotsMode);

  const imageSectionStyle = needsRelativeLayer
    ? {
        ...sectionStyle,
        position: "relative",
        overflow: hasSpotOverflow ? "visible" : sectionStyle?.overflow,
        zIndex: activeSliceIdx === index ? 40 : undefined,
      }
    : sectionStyle;

  const activeSectionStyle = isImage ? imageSectionStyle : sectionStyle;
  const sectionWithChapterStyle = showChapterTitle
    ? { ...activeSectionStyle, position: "relative" }
    : activeSectionStyle;

  return {
    isSupportedCat,
    isImage,
    isByobu,
    isEditSpotsMode,
    chapterTitle,
    showChapterTitle,
    spots,
    sectionStyle,
    sectionWithChapterStyle,
    setActiveSliceIdx,
  };
}