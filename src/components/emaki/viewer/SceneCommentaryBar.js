/**
 * ボトムコメントバー: ビューア最下部に常駐するシーン解説バー（オーケストレーター）。
 */
import * as gtag from "@/libs/api/gtag";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/SceneCommentaryBar.module.css";
import FolkloreDetailSheet from "@/components/emaki/folklore/FolkloreDetailSheet";
import FolkloreToggleButton from "@/components/emaki/folklore/FolkloreToggleButton";
import SceneLikeButton from "@/components/emaki/viewer/SceneLikeButton";
import ShareButtons from "@/components/emaki/viewer/ShareButtons";
import GenjiHubLink from "@/components/genji/GenjiHubLink";
import KusouzuHubLink from "@/components/emaki/kusouzu/KusouzuHubLink";
import {
  buildViewerThemeStyle,
  resolveViewerLayoutMode,
} from "@/theme/colorMode";
import { connectGenjiChapters } from "@/utils/emakiChapterText";
import { getMotifDefinition } from "@/utils/motifNetwork";
import { emakiDisplayTitle } from "@/utils/emakiDisplayTitle";
import {
  useCommentaryBarShell,
  useCommentaryBarMetrics,
  isCompactViewport,
} from "@/components/emaki/commentary/useCommentaryBarShell";
import { useByobuSpotCommentary } from "@/components/emaki/commentary/useByobuSpotCommentary";
import { useEmakiSceneCommentary } from "@/components/emaki/commentary/useEmakiSceneCommentary";
import {
  ByobuSpotIndexSection,
  ByobuSpotCategoryLine,
  ByobuSpotClampText,
  ByobuSpotPersistentActions,
  ByobuSpotFooterNav,
} from "@/components/emaki/commentary/ByobuSpotCommentaryView";
import {
  EmakiSectionIndex,
  EmakiFolkloreListHeader,
  EmakiModeTabs,
  EmakiSceneBodyContent,
} from "@/components/emaki/commentary/EmakiSceneCommentaryView";
import {
  faBookOpen,
  faList,
  faLocationDot,
  faTimeline,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { findGeoSpotByScrollSpot } from "@/data/hub/rakuchuRakugaiGeoSpots";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Link from "next/link";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "next-i18next";

const EmakiEraTimeline = dynamic(
  () => import("@/components/chronology/EmakiEraTimeline"),
  { ssr: false }
);

const SceneCommentaryBar = ({
  data,
  navIndex,
  isFullscreen = false,
  commentaryFloating = false,
  entryContainerRef,
  quizFab = null,
  isPlayMode = false,
  onIdlePauseChange,
  onIdleActivity,
  openPolaroidModal,
  selectedSpot = null,
  onClearSelectedSpot,
  allSpots = [],
  onSelectSpot,
  isZoomed = false,
  onOpenMapDrawer,
}) => {
  const { handleToId, orientation } = useContext(AppContext);
  const router = useRouter();
  const { locale } = router;
  const { t } = useTranslation("common");
  const { title, titleen } = data;
  const isLtr = data?.readingDirection === "ltr";

  const [isFolkloreOpen, setIsFolkloreOpen] = useState(false);

  const shell = useCommentaryBarShell({
    isFullscreen,
    commentaryFloating,
    entryContainerRef,
    orientation,
    setIsFolkloreOpen,
    isFolkloreOpen,
    workKey: titleen,
    isLtr,
  });

  const closeBarIfCompact = useCallback(() => {
    if (isCompactViewport()) shell.setClosed(true);
  }, [shell.setClosed]);

  const onSelectSpotFromCommentary = useCallback(
    (spot) => {
      onSelectSpot?.(spot);
      closeBarIfCompact();
    },
    [onSelectSpot, closeBarIfCompact]
  );

  const selectedSpotId =
    selectedSpot?.id != null ? String(selectedSpot.id) : null;
  const prevSelectedSpotIdRef = useRef(undefined);
  useEffect(() => {
    if (prevSelectedSpotIdRef.current === undefined) {
      prevSelectedSpotIdRef.current = selectedSpotId;
      return;
    }
    if (prevSelectedSpotIdRef.current === selectedSpotId) return;
    prevSelectedSpotIdRef.current = selectedSpotId;
    if (selectedSpotId) closeBarIfCompact();
  }, [selectedSpotId, closeBarIfCompact]);

  useEffect(() => {
    const onBadgeSelect = () => closeBarIfCompact();
    window.addEventListener("emaki:spot-badge-select", onBadgeSelect);
    return () =>
      window.removeEventListener("emaki:spot-badge-select", onBadgeSelect);
  }, [closeBarIfCompact]);

  const barWrapRef = shell.wrapRef;
  const zoomOutsideTapRef = useRef(null);

  useEffect(() => {
    if (shell.closed || !isZoomed) return undefined;

    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      zoomOutsideTapRef.current = {
        x: e.clientX,
        y: e.clientY,
        inside: Boolean(barWrapRef.current?.contains(e.target)),
      };
    };

    const onPointerUp = (e) => {
      if (e.button !== 0) return;
      const start = zoomOutsideTapRef.current;
      zoomOutsideTapRef.current = null;
      if (!start) return;
      if (!isCompactViewport()) return;
      if (start.inside || barWrapRef.current?.contains(e.target)) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) >= 8) return;
      shell.setClosed(true);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerUp, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
    };
  }, [shell.closed, isZoomed, shell.setClosed, barWrapRef]);

  const byobu = useByobuSpotCommentary({
    data,
    allSpots,
    selectedSpot,
    navIndex,
    viewMode: shell.viewMode,
    locale,
    titleen,
    onSelectSpot: onSelectSpotFromCommentary,
    setViewMode: shell.setViewMode,
    setIsFolkloreOpen,
  });

  const activeSpotId =
    byobu.isByobuSpotMode && byobu.activeByobuSpot?.id
      ? String(byobu.activeByobuSpot.id)
      : selectedSpot?.id
        ? String(selectedSpot.id)
        : null;
  const activeGeoSpot = useMemo(
    () =>
      titleen && activeSpotId
        ? findGeoSpotByScrollSpot(titleen, activeSpotId)
        : null,
    [titleen, activeSpotId]
  );

  const emaki = useEmakiSceneCommentary({
    data,
    navIndex,
    router,
    locale,
    titleen,
    title,
    handleToId,
    viewMode: shell.viewMode,
    setViewMode: shell.setViewMode,
    selectedSpot,
    isByobuSpotMode: byobu.isByobuSpotMode,
    onIdlePauseChange,
    isFolkloreOpen,
    setIsFolkloreOpen,
    isLtr,
  });

  useCommentaryBarMetrics({
    barRef: shell.barRef,
    wrapRef: shell.wrapRef,
    entryContainerRef,
    expanded: shell.expanded,
    closed: shell.closed,
    textMode: emaki.textMode,
    contentTab: emaki.contentTab,
    isFolkloreOpen,
    viewMode: shell.viewMode,
    cardPos: shell.cardPos,
    selectedSpot,
  });

  if (!emaki.current && !byobu.isByobuSpotMode) return null;

  const currentSliceItem = Array.isArray(data?.emakis)
    ? data.emakis[navIndex]
    : null;
  const activeSliceNumber = (() => {
    const emakis = data?.emakis;
    if (!Array.isArray(emakis)) {
      return (
        emaki.current?.panel_number ??
        emaki.current?.index ??
        (typeof navIndex === "number" ? navIndex + 1 : 1)
      );
    }
    const imageOrdinal = emakis
      .slice(0, navIndex + 1)
      .filter((e) => e.cat === "image").length;
    if (currentSliceItem?.cat === "image") {
      const direct =
        currentSliceItem.panel_number ??
        currentSliceItem.scene_id ??
        currentSliceItem.index;
      if (direct != null && Number.isFinite(Number(direct))) {
        return Number(direct);
      }
      return imageOrdinal > 0 ? imageOrdinal : 1;
    }
    if (currentSliceItem?.cat === "ekotoba") {
      const nextImage = emakis.slice(navIndex + 1).find((e) => e.cat === "image");
      if (nextImage) {
        const n =
          nextImage.panel_number ?? nextImage.scene_id ?? nextImage.index;
        if (n != null && Number.isFinite(Number(n))) return Number(n);
      }
      return imageOrdinal > 0 ? imageOrdinal : 1;
    }
    return (
      emaki.current?.panel_number ??
      emaki.current?.index ??
      (imageOrdinal > 0 ? imageOrdinal : 1)
    );
  })();

  const baseShareTitle =
    locale === "en"
      ? emakiDisplayTitle(data, locale)
      : `${title ?? ""}`.trim();

  const folkloreChrome = (
    <FolkloreDetailSheet
      item={emaki.folkloreItem}
      open={Boolean(emaki.folkloreItem)}
      onClose={() => emaki.setFolkloreItem(null)}
      onActivity={onIdleActivity}
    />
  );

  if (shell.closed) {
    const defaultShow =
      locale === "en" ? "Show commentary" : "解説を表示";
    let showLabel = t("viewer.showCommentary", {
      defaultValue: defaultShow,
    });
    const spot = byobu.activeByobuSpot;
    if (byobu.isByobuSpotMode && spot) {
      const name =
        locale === "en" ? spot.nameen || spot.name : spot.name;
      showLabel =
        locale === "en" ? `Show: ${name}` : `${name}の解説`;
    }
    return (
      <div
        ref={shell.barRef}
        className={`${styles.reopenBar} ${isLtr ? styles.ltr : ""}`}
        data-orientation={orientation}
        data-fullscreen={shell.cardFloats ? "true" : "false"}
      >
        {quizFab}
        <button
          type="button"
          className={styles.reopenBtn}
          onClick={() => shell.setClosed(false)}
          aria-label={showLabel}
        >
          <FontAwesomeIcon icon={faBookOpen} />
          <span>{showLabel}</span>
        </button>
        {folkloreChrome}
      </div>
    );
  }

  const chapterTitle = byobu.isByobuSpotMode
    ? byobu.byobuChapterTitle(allSpots.length)
    : emaki.emakiChapterTitle();

  const spotDisplay = byobu.isByobuSpotMode
    ? byobu.spotDisplay
    : emaki.emakiSpotDisplay;

  const plainBody =
    emaki.activeMode === "desc"
      ? emaki.chapterTexts.desc
      : emaki.activeMode === "gendaibun"
        ? emaki.chapterTexts.gendaibun
        : emaki.activeMode === "tansaku" || emaki.activeMode === "sou"
          ? (emaki.tansakuData?.summary || "").replace(/<[^>]+>/g, "").trim()
          : emaki.chapterTexts.kobun;
  const hasBody = byobu.isByobuSpotMode
    ? byobu.activeByobuSpot
      ? Boolean(spotDisplay?.spotBody)
      : true
    : emaki.activeMode === "tansaku" || emaki.activeMode === "sou"
      ? Boolean(
          emaki.tansakuData &&
            (emaki.tansakuData.prompt ||
              (Array.isArray(emaki.tansakuData.motifs) &&
                emaki.tansakuData.motifs.length > 0) ||
              emaki.tansakuData.motif ||
              emaki.tansakuData.summary)
        )
      : plainBody.length > 0;
  const splitAt =
    locale === "en" ? plainBody.search(/\.\s/) : plainBody.indexOf("。");
  const hasRest = hasBody && splitAt >= 0 && splitAt < plainBody.length - 1;
  const showModeTabs =
    !byobu.isByobuSpotMode && emaki.availableModes.length >= 1;

  const viewerThemeStyle = buildViewerThemeStyle(data);
  const viewerLayout = resolveViewerLayoutMode({
    data,
    commentaryFloating,
    isFullscreen: shell.cardFloats,
  });
  const readMoreLabel = locale === "en" ? "More ▾" : "もっと見る";

  const toggleExpanded = () => {
    const next = !shell.expanded;
    if (next) {
      gtag.event("scene_modal_open", {
        emaki_title: title,
        emaki_id: titleen,
        scene_index: byobu.isByobuSpotMode
          ? byobu.activeByobuSpotEntry?.linkId ?? navIndex
          : emaki.current.linkId,
        scene_chapter: byobu.isByobuSpotMode
          ? byobu.activeByobuSpot?.name
          : emaki.current.chapter,
        text_mode: byobu.isByobuSpotMode ? "spot" : emaki.activeMode,
      });
    }
    shell.setExpanded(next);
  };

  const showFolkloreList =
    isFolkloreOpen && !isPlayMode && emaki.folkloreCount > 0;
  const folkloreToggleLabel =
    emaki.folkloreCount > 0
      ? t("viewer.folkloreToggleCount", {
          count: emaki.folkloreCount,
          defaultValue:
            locale === "en"
              ? `Folklore tags (${emaki.folkloreCount})`
              : `絵引（${emaki.folkloreCount}件）`,
        })
      : t("viewer.folkloreToggle", {
          defaultValue:
            locale === "en"
              ? "Folklore tags (daily life & tools)"
              : "絵引（生活誌・民具）",
        });

  const hasMultipleSections = byobu.isByobuSpotMode
    ? allSpots.length > 1
    : emaki.hasMultipleSections;

  return (
    <div
      ref={shell.wrapRef}
      className={`${styles.wrap} ${shell.isCardDragging ? styles.dragging : ""} ${
        isLtr ? styles.ltr : ""
      }`}
      data-viewer-mode={viewerLayout.viewerMode}
      data-layout-placement={viewerLayout.layoutPlacement}
      data-fullscreen={shell.cardFloats ? "true" : "false"}
      style={{
        ...viewerThemeStyle,
        ...(shell.cardFloats && shell.cardPos
          ? {
              transform: `translate3d(${shell.cardPos.x}px, ${shell.cardPos.y}px, 0)`,
            }
          : null),
      }}
      onDoubleClick={shell.onCardDoubleClick}
    >
      <div
        ref={shell.barRef}
        className={`${styles.bar} ${isLtr ? styles.ltr : ""}`}
        data-orientation={orientation}
        data-fullscreen={shell.cardFloats ? "true" : "false"}
        data-expanded={shell.expanded ? "true" : "false"}
        data-text-mode={emaki.activeMode}
      >
        <div
          className={styles.header}
          onPointerDown={shell.onCardPointerDown}
          onPointerMove={shell.onCardPointerMove}
          onPointerUp={shell.onCardPointerUp}
          onPointerCancel={shell.onCardPointerCancel}
          onClickCapture={shell.onCardClickCapture}
        >
          <div className={styles.titleLine}>
            <button
              type="button"
              className={styles.titleBtn}
              onClick={toggleExpanded}
              aria-expanded={shell.expanded}
              aria-label={
                shell.expanded
                  ? t("viewer.closeDetails")
                  : t("viewer.seeDetailsOfSection")
              }
            >
              <span className={styles.title} style={{ color: "var(--era-text)" }}>
                {chapterTitle}
              </span>
            </button>
            {emaki.isGenji && emaki.current?.genji_chapter ? (
              <GenjiHubLink
                genjieslug={
                  connectGenjiChapters(emaki.current.genji_chapter, "path") ||
                  undefined
                }
                variant="icon"
                linkClassName={styles.genjiGuidePill}
              />
            ) : null}
            {emaki.isKusouzu ? (
              <KusouzuHubLink
                variant="icon"
                linkClassName={styles.genjiGuidePill}
              />
            ) : null}
            <div
              className={styles.titleActions}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {(byobu.isByobuSpotMode
                ? byobu.activeByobuSpot && byobu.spotLikeSceneIndex != null
                : emaki.current != null) ? (
                <SceneLikeButton
                  titleen={titleen}
                  title={title}
                  chapter={
                    byobu.isByobuSpotMode
                      ? byobu.activeByobuSpot?.name
                      : emaki.current?.chapter
                  }
                  index={
                    byobu.isByobuSpotMode
                      ? byobu.spotLikeSceneIndex
                      : emaki.current?.linkId
                  }
                  variant="bar"
                />
              ) : null}
              {(() => {
                let currentShareTitle = baseShareTitle;
                if (byobu.isByobuSpotMode && spotDisplay?.spotTitle) {
                  currentShareTitle = spotDisplay.spotTitle;
                } else if (
                  (emaki.activeMode === "tansaku" || emaki.activeMode === "sou") &&
                  emaki.tansakuData
                ) {
                  const activeMotif = getMotifDefinition(emaki.selectedMotifId);
                  let prompt = null;
                  const isEn = router.locale === "en";
                  if (
                    isEn &&
                    emaki.souData?.promptsEn &&
                    emaki.selectedMotifId &&
                    emaki.souData.promptsEn[emaki.selectedMotifId]
                  ) {
                    prompt = String(
                      emaki.souData.promptsEn[emaki.selectedMotifId]
                    ).replace(/[\s\.…・]+$/, "");
                  } else if (
                    !isEn &&
                    emaki.souData?.prompts &&
                    emaki.selectedMotifId &&
                    emaki.souData.prompts[emaki.selectedMotifId]
                  ) {
                    prompt = String(
                      emaki.souData.prompts[emaki.selectedMotifId]
                    ).replace(/[\s\.…・]+$/, "");
                  } else if (activeMotif) {
                    const motifPrompt = isEn
                      ? activeMotif.promptEn || activeMotif.prompt
                      : activeMotif.prompt;
                    if (motifPrompt) {
                      prompt = String(motifPrompt).replace(/[\s\.…・]+$/, "");
                    }
                  } else if (emaki.souData) {
                    const scenePrompt = isEn
                      ? emaki.souData.promptEn || emaki.souData.prompt
                      : emaki.souData.prompt;
                    if (scenePrompt) {
                      prompt = String(scenePrompt).replace(/[\s\.…・]+$/, "");
                    }
                  } else if (activeMotif) {
                    const label = isEn
                      ? activeMotif.labelEn || activeMotif.label
                      : activeMotif.label;
                    if (label) {
                      prompt = isEn
                        ? `What was the artist's intent behind the depiction of "${label}"?`
                        : `「${label}」の描写から読み解く、絵師の意図とは？`;
                    }
                  }
                  const tag = activeMotif?.label ? `#${activeMotif.label}` : "";
                  const sceneName = emaki.current?.title
                    ? `【${emaki.current.title}】`
                    : "";
                  if (prompt) {
                    currentShareTitle =
                      `💡 ${prompt}${tag ? ` ── ${tag}` : ""}\n${sceneName} ${baseShareTitle}`.trim();
                  } else if (tag) {
                    currentShareTitle =
                      `${tag}\n${sceneName} ${baseShareTitle}`.trim();
                  }
                }
                return (
                  <ShareButtons
                    variant="share"
                    navIndex={
                      byobu.isByobuSpotMode
                        ? byobu.activeByobuSpotEntry?.linkId ?? navIndex
                        : navIndex
                    }
                    emakiId={titleen}
                    openPolaroidModal={openPolaroidModal}
                    shareTitle={currentShareTitle}
                    spotId={
                      byobu.isByobuSpotMode && byobu.activeByobuSpot?.id
                        ? String(byobu.activeByobuSpot.id)
                        : undefined
                    }
                  />
                );
              })()}
              {activeGeoSpot && onOpenMapDrawer && (
                <button
                  type="button"
                  className={styles.timelineBtn}
                  onClick={() => {
                    onIdleActivity?.();
                    onOpenMapDrawer();
                  }}
                  aria-label={
                    locale === "en"
                      ? `View ${activeGeoSpot.nameEn || activeGeoSpot.nameJa} on Kyoto Map`
                      : `${activeGeoSpot.nameJa}を京都マップで見る`
                  }
                  title={
                    locale === "en"
                      ? `View ${activeGeoSpot.nameEn || activeGeoSpot.nameJa} on Kyoto Map`
                      : `${activeGeoSpot.nameJa}を京都マップで見る`
                  }
                >
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    style={{ color: "#c2410c" }}
                  />
                </button>
              )}
            </div>
          </div>
          {shell.viewMode === "index" ? (
            byobu.isByobuSpotMode ? (
              <ByobuSpotIndexSection
                viewMode={shell.viewMode}
                isByobuSpotMode={byobu.isByobuSpotMode}
                spotActiveIndex={byobu.spotActiveIndex}
                spotIndexRows={byobu.spotIndexRows}
                handleNavigateSpot={byobu.handleNavigateSpot}
                t={t}
              />
            ) : (
              <EmakiSectionIndex
                viewMode={shell.viewMode}
                isByobuSpotMode={byobu.isByobuSpotMode}
                activeIndex={emaki.activeIndex}
                indexRows={emaki.indexRows}
                handleNavigate={emaki.handleNavigate}
                onSectionStep={emaki.handleSectionStep}
                isLtr={isLtr}
                t={t}
              />
            )
          ) : showFolkloreList ? (
            <EmakiFolkloreListHeader
              showFolkloreList={showFolkloreList}
              showModeTabs={showModeTabs}
              availableModes={emaki.availableModes}
              handleTextMode={emaki.handleTextMode}
              t={t}
              chapterFolkloreItems={emaki.chapterFolkloreItems}
              sceneThumbSrc={emaki.sceneThumbSrc}
              handleFolkloreSelect={emaki.handleFolkloreSelect}
              onIdleActivity={onIdleActivity}
              folkloreToggleLabel={folkloreToggleLabel}
            />
          ) : (
            <>
              {byobu.isByobuSpotMode && byobu.activeByobuSpot ? (
                <ByobuSpotCategoryLine
                  isByobuSpotMode={byobu.isByobuSpotMode}
                  activeByobuSpot={byobu.activeByobuSpot}
                  categoryLabel={spotDisplay?.categoryLabel}
                />
              ) : (
                <EmakiModeTabs
                showModeTabs={showModeTabs}
                isByobuSpotMode={byobu.isByobuSpotMode}
                availableModes={emaki.availableModes}
                contentTab={emaki.contentTab}
                activeMode={emaki.activeMode}
                locale={locale}
                t={t}
                handleTextMode={emaki.handleTextMode}
                selectedSpot={selectedSpot}
                spotDisplay={emaki.emakiSpotDisplay}
                setIsFolkloreOpen={setIsFolkloreOpen}
                setViewMode={shell.setViewMode}
                setContentTab={emaki.setContentTab}
                onClearSelectedSpot={onClearSelectedSpot}
                panels={data?.panels}
              />
              )}
              {byobu.isByobuSpotMode ? (
                <>
                  <button
                    type="button"
                    className={styles.body}
                    onClick={toggleExpanded}
                    aria-expanded={shell.expanded}
                    aria-label={
                      shell.expanded
                        ? t("viewer.closeDetails")
                        : t("viewer.seeDetailsOfSection")
                    }
                  >
                    <span className={styles.bodyText}>
                      <ByobuSpotClampText
                        isByobuSpotMode={byobu.isByobuSpotMode}
                        activeByobuSpot={byobu.activeByobuSpot}
                        locale={locale}
                        spotDisplay={byobu.spotDisplay}
                      />
                    </span>
                  </button>
                  <div
                    style={{
                      padding: "0 14px 6px",
                      width: "100%",
                      flex: "0 0 auto",
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <ByobuSpotPersistentActions
                      isByobuSpotMode={byobu.isByobuSpotMode}
                      activeByobuSpot={byobu.activeByobuSpot}
                      locale={locale}
                      allSpots={allSpots}
                      onSelectSpot={onSelectSpotFromCommentary}
                      spotDisplay={byobu.spotDisplay}
                      crossEditionLinks={byobu.crossEditionLinks}
                      hubComparisonLink={byobu.hubComparisonLink}
                      titleen={titleen}
                    />
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.body}
                  onClick={toggleExpanded}
                  aria-expanded={shell.expanded}
                  aria-label={
                    shell.expanded
                      ? t("viewer.closeDetails")
                      : t("viewer.seeDetailsOfSection")
                  }
                >
                  <span
                    className={`${styles.bodyText} ${
                      emaki.activeMode === "kobun" &&
                      emaki.contentTab === "scene"
                        ? styles.bodyTextClassical
                        : ""
                    }`}
                  >
                    {(emaki.contentTab === "spot" && selectedSpot) &&
                    spotDisplay ? (
                      <EmakiSceneBodyContent
                        isByobuSpotMode={false}
                        contentTab={emaki.contentTab}
                        selectedSpot={selectedSpot}
                        spotDisplay={emaki.emakiSpotDisplay}
                        activeMode={emaki.activeMode}
                        tansakuData={emaki.tansakuData}
                        titleen={titleen}
                        filterEkotobas={emaki.filterEkotobas}
                        handleNavigate={emaki.handleNavigate}
                        setSelectedMotifId={emaki.setSelectedMotifId}
                        relatedScenes={emaki.relatedScenes}
                        selectedMotifId={emaki.selectedMotifId}
                        souData={emaki.souData}
                        chapterTexts={emaki.chapterTexts}
                        expanded={shell.expanded}
                        locale={locale}
                        readMoreLabel={readMoreLabel}
                        panels={data?.panels}
                        activeSliceNumber={activeSliceNumber}
                      />
                    ) : (
                      <EmakiSceneBodyContent
                        isByobuSpotMode={false}
                        contentTab={emaki.contentTab}
                        selectedSpot={selectedSpot}
                        spotDisplay={emaki.emakiSpotDisplay}
                        activeMode={emaki.activeMode}
                        tansakuData={emaki.tansakuData}
                        titleen={titleen}
                        filterEkotobas={emaki.filterEkotobas}
                        handleNavigate={emaki.handleNavigate}
                        setSelectedMotifId={emaki.setSelectedMotifId}
                        relatedScenes={emaki.relatedScenes}
                        selectedMotifId={emaki.selectedMotifId}
                        souData={emaki.souData}
                        chapterTexts={emaki.chapterTexts}
                        expanded={shell.expanded}
                        locale={locale}
                        readMoreLabel={readMoreLabel}
                        panels={data?.panels}
                        activeSliceNumber={activeSliceNumber}
                      />
                    )}
                  </span>
                </button>
              )}
            </>
          )}
          <div className={styles.utilityActions}>
            {quizFab}
            <ByobuSpotFooterNav
              isByobuSpotMode={byobu.isByobuSpotMode}
              activeByobuSpot={byobu.activeByobuSpot}
              allSpots={allSpots}
              spotActiveIndex={byobu.spotActiveIndex}
              locale={locale}
              handleNavigateSpot={byobu.handleNavigateSpot}
              prevSpot={byobu.prevSpot}
              nextSpot={byobu.nextSpot}
            />
            <div className={styles.utilityActionsEnd}>
              <FolkloreToggleButton
                count={emaki.folkloreCount}
                open={isFolkloreOpen}
                disabled={isPlayMode}
                label={folkloreToggleLabel}
                onToggle={() => {
                  onIdleActivity?.();
                  setIsFolkloreOpen((v) => {
                    const next = !v;
                    if (next) shell.setViewMode("commentary");
                    return next;
                  });
                }}
              />
              {hasMultipleSections && (
                <button
                  type="button"
                  className={`${styles.listBtn} ${
                    shell.viewMode === "index" ? styles.listBtnActive : ""
                  }`}
                  onClick={() => {
                    setIsFolkloreOpen(false);
                    shell.setViewMode((v) =>
                      v === "index" ? "commentary" : "index"
                    );
                  }}
                  aria-label={
                    shell.viewMode === "index"
                      ? t("viewer.backToCommentary")
                      : t("viewer.sectionList")
                  }
                  aria-expanded={shell.viewMode === "index"}
                  title={
                    shell.viewMode === "index"
                      ? t("viewer.backToCommentary")
                      : t("viewer.sectionList")
                  }
                >
                  <FontAwesomeIcon icon={faList} />
                </button>
              )}
              {emaki.eraen && (
                <EmakiEraTimeline
                  eraen={emaki.eraen}
                  t={t}
                  trigger={(open) =>
                    open ? (
                      <button
                        type="button"
                        className={styles.timelineBtn}
                        onClick={open}
                        aria-haspopup="dialog"
                        aria-label={t("timeline.embedTitle")}
                        title={t("timeline.embedTitle")}
                      >
                        <FontAwesomeIcon icon={faTimeline} />
                      </button>
                    ) : (
                      <Link href="/timeline">
                        <a
                          className={styles.timelineBtn}
                          aria-label={t("timeline.embedTitle")}
                          title={t("timeline.embedTitle")}
                        >
                          <FontAwesomeIcon icon={faTimeline} />
                        </a>
                      </Link>
                    )
                  }
                />
              )}
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => {
                  shell.setViewMode("commentary");
                  shell.setClosed(true);
                }}
                aria-label={t("viewer.closeCommentaryBar", {
                  defaultValue:
                    locale === "en"
                      ? "Close commentary bar"
                      : "解説バーを閉じる",
                })}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {folkloreChrome}
    </div>
  );
};

export default SceneCommentaryBar;