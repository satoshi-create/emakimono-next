import { useState } from "react";
import { ALL_QUIZZES } from "@/data/quiz/index";
import { ChaptersTitle } from "@/utils/emakiChapterText";
import { buildSceneShellStyle } from "@/utils/emakiContentWindow";
import { isByobuScroll } from "@/utils/isByobuScroll";

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

  const { chapter, genji_chapter: genjiChapter, title: itemTitle } = item ?? {};
  const chapterTitle =
    (locale === "en"
      ? ChaptersTitle(
          data?.titleen,
          data?.title,
          chapter,
          "titleen",
          genjiChapter
        )
      : ChaptersTitle(
          data?.titleen,
          data?.title,
          chapter,
          "title",
          genjiChapter
        )) ||
    itemTitle ||
    "";

  const isByobu = isByobuScroll(data);
  const sectionStyle = buildSceneShellStyle(item, {
    toggleFullscreen,
    orientation,
    floatLandscape,
    isByobu,
  });

  const spots = isImage && !usePanoramaSpots ? item?.spots : null;
  const showChapterTitle = Boolean(
    chapterTitle && chapterToggle && !isByobu && data?.typeen !== "birdseye"
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