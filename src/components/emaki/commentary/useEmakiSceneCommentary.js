/**
 * 絵巻モード: 段解説・詞書タブ・絵引・探索・目次のロジック。
 */
import * as gtag from "@/libs/api/gtag";
import { ChaptersTitle } from "@/utils/func";
import {
  getChapterCustomData,
  getChapterFieldRaw,
} from "@/utils/emakiChapterText";
import { findRelatedScenesByMotif } from "@/utils/motifNetwork";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import useFolkloreForScroll from "@/hooks/emaki/useFolkloreForScroll";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import { resolveEbikiScrollTarget } from "@/utils/resolveQuizJump";
import { triggerEbikiSpotlight } from "@/utils/triggerEbikiSpotlight";
import { getMasterByRawSpotId } from "@/data/rakuchu-rakugai/rakuchuMotifMaster";
import { useEffect, useMemo, useRef, useState } from "react";

export const TEXT_MODES = ["gendaibun", "kobun", "desc", "tansaku"];

const stripHtml = (html) =>
  (html || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();

/**
 * @param {object} opts
 */
export function useEmakiSceneCommentary({
  data,
  navIndex,
  router,
  locale,
  titleen,
  title,
  handleToId,
  viewMode,
  setViewMode,
  selectedSpot,
  isByobuSpotMode,
  onIdlePauseChange,
  isFolkloreOpen,
  setIsFolkloreOpen,
}) {
  const { era, eraen } = data;
  const { getItemsForChapter, getItemById, hasFolklore } =
    useFolkloreForScroll(titleen);
  const [folkloreItem, setFolkloreItem] = useState(null);

  const isGenji = typeof titleen === "string" && titleen.includes("genji");
  const isKusouzu = isKusouzuScroll(data);
  const emakis = useMemo(() => data.emakis || [], [data.emakis]);

  const ebikiAppliedRef = useRef(null);

  // 1. ディープリンク `?ebiki={item_id}`
  useEffect(() => {
    const raw = router.query?.ebiki;
    if (!raw || !hasFolklore) return undefined;
    const id = String(Array.isArray(raw) ? raw[0] : raw).trim();
    if (!id) return undefined;
    const found = getItemById(id);
    if (!found) return undefined;
    if (ebikiAppliedRef.current === id) return undefined;
    const target = resolveEbikiScrollTarget(emakis, found);
    if (!target) return undefined;
    ebikiAppliedRef.current = id;
    handleToId(target.linkId, {
      realign: false,
      offsetPercent: target.offsetPercent,
      behavior: "smooth",
    });
    triggerEbikiSpotlight(target.linkId, target.offsetPercent);
    setFolkloreItem(found);
  }, [router.query?.ebiki, hasFolklore, getItemById, emakis, handleToId]);

  const filterEkotobas = useMemo(
    () => emakis.filter((item) => item.cat === "ekotoba"),
    [emakis]
  );

  // 2. 章サムネイルマップ
  const chapterThumbMap = useMemo(() => {
    const map = new Map();
    let currentChapter = null;
    let leadingSrc = null;
    emakis.forEach((item) => {
      if (item.cat === "ekotoba") {
        if (currentChapter === null && leadingSrc) {
          map.set(item.chapter, leadingSrc);
        }
        currentChapter = item.chapter;
      } else if (item.cat === "image" && item.src) {
        if (currentChapter === null) {
          if (!leadingSrc) leadingSrc = item.src;
        } else if (!map.has(currentChapter)) {
          map.set(currentChapter, item.src);
        }
      }
    });
    return map;
  }, [emakis]);

  const activeIndex = useMemo(() => {
    if (filterEkotobas.length === 0) return -1;
    let current = 0;
    filterEkotobas.forEach((item, i) => {
      if (item.linkId <= navIndex) current = i;
    });
    return current;
  }, [filterEkotobas, navIndex]);

  const prevActiveIndexRef = useRef(activeIndex);

  useEffect(() => {
    if (isByobuSpotMode) return;
    if (prevActiveIndexRef.current !== activeIndex) {
      prevActiveIndexRef.current = activeIndex;
      setViewMode("commentary");
      setIsFolkloreOpen(false);
    }
  }, [activeIndex, isByobuSpotMode, setViewMode, setIsFolkloreOpen]);

  // 3. 段目次行
  const indexRows = useMemo(() => {
    if (viewMode !== "index") return [];
    const isEn = locale === "en";
    return filterEkotobas.map((item) => ({
      linkId: item.linkId,
      title: isEn
        ? ChaptersTitle(titleen, title, item.chapter, "titleen", item.genji_chapter)
        : ChaptersTitle(titleen, title, item.chapter, "title", item.genji_chapter),
      desc: stripHtml(
        getChapterFieldRaw(
          titleen,
          title,
          item.chapter,
          isEn ? "descen" : "desc",
          item.desc,
          item.genji_chapter
        )
      ),
      thumb: chapterThumbMap.has(item.chapter)
        ? buildCloudinaryUrl(chapterThumbMap.get(item.chapter), [
            "w_160",
            "f_auto",
            "q_auto:good",
          ])
        : null,
    }));
  }, [viewMode, filterEkotobas, chapterThumbMap, locale, titleen, title]);

  const [textMode, setTextMode] = useState("gendaibun");
  const [selectedMotifId, setSelectedMotifId] = useState(null);
  const [contentTab, setContentTab] = useState("scene");
  const prevSelectedSpotIdRef = useRef(null);

  useEffect(() => {
    const id = selectedSpot?.id ? String(selectedSpot.id) : null;
    if (id && id !== prevSelectedSpotIdRef.current) {
      setContentTab("spot");
    }
    if (!id) {
      setContentTab("scene");
    }
    prevSelectedSpotIdRef.current = id;
  }, [selectedSpot?.id]);

  useEffect(() => {
    const paused = isFolkloreOpen || Boolean(folkloreItem);
    onIdlePauseChange?.(paused);
    return () => onIdlePauseChange?.(false);
  }, [isFolkloreOpen, folkloreItem, onIdlePauseChange]);

  const current = filterEkotobas[activeIndex];

  const chapterTexts = useMemo(() => {
    if (!current) {
      return { desc: "", gendaibun: "", kobun: "", kobunHtml: "" };
    }
    const isEn = locale === "en";
    const genjiCh = current.genji_chapter;
    const descRaw = getChapterFieldRaw(
      titleen,
      title,
      current.chapter,
      isEn ? "descen" : "desc",
      current.desc,
      genjiCh
    );
    const gendaibunRaw = getChapterFieldRaw(
      titleen,
      title,
      current.chapter,
      isEn ? "gendaibunen" : "gendaibun",
      isEn ? "" : current.gendaibun,
      genjiCh
    );
    const kobunHtml = getChapterFieldRaw(
      titleen,
      title,
      current.chapter,
      isEn ? "kobunen" : "kobun",
      isEn ? "" : current.kobun,
      genjiCh
    );
    return {
      desc: stripHtml(descRaw),
      gendaibun: stripHtml(gendaibunRaw),
      kobun: stripHtml(kobunHtml),
      kobunHtml,
    };
  }, [current, locale, titleen, title]);

  const tansakuData = useMemo(() => {
    if (!current) return null;
    return (
      getChapterCustomData(titleen, current.chapter, "tansaku") ||
      getChapterCustomData(titleen, current.chapter, "sou") ||
      current.tansaku ||
      current.sou ||
      null
    );
  }, [current, titleen]);
  const souData = tansakuData;

  useEffect(() => {
    if (souData && Array.isArray(souData.motifs) && souData.motifs.length > 0) {
      setSelectedMotifId(souData.motifs[0]);
    } else {
      setSelectedMotifId(null);
    }
  }, [souData]);

  const relatedScenes = useMemo(() => {
    if (!selectedMotifId) return [];
    const chapterVal = current?.chapter;
    if (chapterVal == null) return [];
    return findRelatedScenesByMotif(titleen, chapterVal, selectedMotifId);
  }, [selectedMotifId, current, titleen]);

  const availableModes = useMemo(
    () =>
      TEXT_MODES.filter((mode) => {
        if (mode === "desc") return chapterTexts.desc.length > 0;
        if (mode === "tansaku") return Boolean(tansakuData);
        if (mode === "gendaibun")
          return (
            chapterTexts.kobun.length > 0 && chapterTexts.gendaibun.length > 0
          );
        return chapterTexts.kobun.length > 0;
      }),
    [chapterTexts, tansakuData]
  );

  useEffect(() => {
    if (availableModes.length === 0) return;
    if (!availableModes.includes(textMode)) {
      setTextMode(availableModes[0]);
    }
  }, [availableModes, textMode]);

  // 4. 絵巻上のピン選択スポット表示（非屏風）
  const emakiRakuchuMaster = useMemo(() => {
    if (isByobuSpotMode || !selectedSpot) return null;
    if (typeof titleen !== "string" || !titleen.startsWith("rakuchu_rakugai")) {
      return null;
    }
    return getMasterByRawSpotId(selectedSpot.id) || null;
  }, [isByobuSpotMode, selectedSpot, titleen]);

  const emakiSpotDisplay = useMemo(() => {
    if (isByobuSpotMode || !selectedSpot) return null;
    const isEn = locale === "en";
    const spotTitle = isEn
      ? selectedSpot.nameen || selectedSpot.name
      : selectedSpot.name;
    let spotBody = selectedSpot.description || selectedSpot.summary || "";
    if (!spotBody && emakiRakuchuMaster) {
      spotBody = isEn
        ? emakiRakuchuMaster.summaryEn || emakiRakuchuMaster.summaryJa
        : emakiRakuchuMaster.summaryJa;
    }
    return {
      spotTitle,
      spotBody: stripHtml(String(spotBody || "")),
    };
  }, [isByobuSpotMode, selectedSpot, emakiRakuchuMaster, locale]);

  const activeMode = availableModes.includes(textMode)
    ? textMode
    : availableModes[0] || "desc";

  const handleTextMode = (mode) => {
    if (
      mode === activeMode &&
      contentTab === "scene" &&
      !isFolkloreOpen &&
      viewMode === "commentary"
    ) {
      return;
    }
    setContentTab("scene");
    setIsFolkloreOpen(false);
    setViewMode("commentary");
    setTextMode(mode);
    if (current) {
      gtag.event("scene_text_mode_change", {
        emaki_title: title,
        emaki_id: titleen,
        scene_index: current.linkId,
        scene_chapter: current.chapter,
        text_mode: mode,
      });
    }
  };

  const handleNavigate = (ekotobaIndex) => {
    const target = filterEkotobas[ekotobaIndex];
    if (!target) return;
    handleToId(target.linkId);
    setViewMode("commentary");
    setIsFolkloreOpen(false);
  };

  const handleFolkloreSelect = (item) => {
    if (!item) return;
    const target = resolveEbikiScrollTarget(emakis, item);
    if (!target || typeof handleToId !== "function") {
      console.warn("[Ebiki] handleToId または targetLinkId が無効です:", {
        target,
        hasHandleToId: typeof handleToId === "function",
        link_id: item.link_id,
        scene_id: item.scene_id,
      });
      return;
    }
    handleToId(target.linkId, {
      realign: false,
      offsetPercent: target.offsetPercent,
      behavior: "smooth",
    });
    triggerEbikiSpotlight(target.linkId, target.offsetPercent);
    setFolkloreItem(item);
  };

  const hasMultipleSections = isByobuSpotMode
    ? false
    : filterEkotobas.length > 1;

  const chapterFolkloreItems =
    hasFolklore && current?.chapter
      ? getItemsForChapter(current.chapter)
      : [];
  const folkloreCount = chapterFolkloreItems.length;

  const sceneThumbSrc =
    current?.chapter && chapterThumbMap.has(current.chapter)
      ? buildCloudinaryUrl(chapterThumbMap.get(current.chapter), [
          "w_160",
          "f_auto",
          "q_auto:good",
        ])
      : null;

  const emakiChapterTitle = () => {
    if (!current) return "";
    return locale === "en"
      ? ChaptersTitle(
          titleen,
          title,
          current.chapter,
          "titleen",
          current.genji_chapter
        )
      : ChaptersTitle(
          titleen,
          title,
          current.chapter,
          "title",
          current.genji_chapter
        );
  };

  return {
    isGenji,
    isKusouzu,
    era,
    eraen,
    current,
    filterEkotobas,
    activeIndex,
    indexRows,
    chapterTexts,
    tansakuData,
    souData,
    relatedScenes,
    selectedMotifId,
    setSelectedMotifId,
    availableModes,
    textMode,
    activeMode,
    contentTab,
    setContentTab,
    folkloreItem,
    setFolkloreItem,
    isFolkloreOpen,
    setIsFolkloreOpen,
    hasFolklore,
    handleTextMode,
    handleNavigate,
    handleFolkloreSelect,
    hasMultipleSections,
    chapterFolkloreItems,
    folkloreCount,
    sceneThumbSrc,
    emakiSpotDisplay,
    emakiChapterTitle,
  };
}