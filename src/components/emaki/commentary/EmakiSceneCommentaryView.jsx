/**
 * 絵巻モード専用 UI 断片（目次・タブ・探索・詞書本文）。
 */
import CommentaryExploreView from "@/components/emaki/commentary/CommentaryExploreView";
import CommentaryTextView from "@/components/emaki/commentary/CommentaryTextView";
import CommentarySectionIndex from "@/components/emaki/commentary/CommentarySectionIndex";
import FolkloreSceneList from "@/components/emaki/folklore/FolkloreSceneList";
import { getMotifDefinition } from "@/utils/motifNetwork";
import styles from "@/styles/SceneCommentaryBar.module.css";
import jaMessages from "../../../../messages/ja.json";
import enMessages from "../../../../messages/en.json";

function viewerPanelLabel(key, locale) {
  const ns =
    (locale === "en" ? enMessages : jaMessages).viewerPanel ?? {};
  return ns[key] ?? key;
}

function resolveActivePanel(panels, activeSliceNumber) {
  if (!Array.isArray(panels) || panels.length === 0 || activeSliceNumber == null) {
    return null;
  }
  const sliceNum = Number(activeSliceNumber);
  if (!Number.isFinite(sliceNum)) return null;
  const byId = panels.find(
    (p) => p.id === sliceNum || p.panel_number === sliceNum
  );
  if (byId) return byId;
  return (
    panels.find((p) => {
      const range = p.slice_range;
      if (!Array.isArray(range) || range.length < 2) return false;
      return range[0] <= sliceNum && sliceNum <= range[1];
    }) ?? null
  );
}

function panelLocalizedStrings(panel, locale) {
  const isEn = locale === "en";
  const isZh = locale === "zh-Hans";
  const title = isZh
    ? panel.title_zh || panel.titleen || panel.title
    : isEn
      ? panel.titleen || panel.title
      : panel.title || panel.titleen;
  const summaryObj = panel.summary;
  const summary = summaryObj
    ? isZh
      ? summaryObj.desc_zh || summaryObj.descen || summaryObj.desc
      : isEn
        ? summaryObj.descen || summaryObj.desc
        : summaryObj.desc || summaryObj.descen
    : "";
  return { title, summary };
}

// 1. 段目次
export function EmakiSectionIndex({
  viewMode,
  isByobuSpotMode,
  activeIndex,
  indexRows,
  handleNavigate,
  onSectionStep,
  isLtr = false,
  t,
}) {
  if (viewMode !== "index" || isByobuSpotMode) return null;
  return (
    <CommentarySectionIndex
      activeIndex={activeIndex}
      indexRows={indexRows}
      onNavigate={handleNavigate}
      onSectionStep={onSectionStep}
      isLtr={isLtr}
      t={t}
    />
  );
}

// 2. 絵引リスト表示時ヘッダ（モードタブ＋リスト）
export function EmakiFolkloreListHeader({
  showFolkloreList,
  showModeTabs,
  availableModes,
  handleTextMode,
  t,
  chapterFolkloreItems,
  sceneThumbSrc,
  handleFolkloreSelect,
  onIdleActivity,
  folkloreToggleLabel,
}) {
  if (!showFolkloreList) return null;
  return (
    <>
      {showModeTabs && (
        <div
          className={styles.modeTabs}
          role="tablist"
          aria-label={t("viewer.textMode.label")}
          onClick={(e) => e.stopPropagation()}
        >
          {availableModes.map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={false}
              className={styles.modeTab}
              onClick={() => handleTextMode(mode)}
            >
              {t(`viewer.textMode.${mode}`)}
            </button>
          ))}
        </div>
      )}
      <FolkloreSceneList
        items={chapterFolkloreItems}
        sceneThumb={sceneThumbSrc}
        onSelect={handleFolkloreSelect}
        onActivity={onIdleActivity}
        ariaLabel={folkloreToggleLabel}
      />
    </>
  );
}

// 3. 現代文・古文・解説・探索タブ（スポットタブ含む）
export function EmakiModeTabs({
  showModeTabs,
  isByobuSpotMode,
  availableModes,
  contentTab,
  activeMode,
  locale,
  t,
  handleTextMode,
  selectedSpot,
  spotDisplay,
  setIsFolkloreOpen,
  setViewMode,
  setContentTab,
  onClearSelectedSpot,
  panels,
}) {
  const hasPanels = Array.isArray(panels) && panels.length > 0;
  if (isByobuSpotMode || (!showModeTabs && !hasPanels)) return null;
  return (
    <div
      className={styles.modeTabs}
      role="tablist"
      aria-label={t("viewer.textMode.label")}
      onClick={(e) => e.stopPropagation()}
    >
      {availableModes.map((mode) => (
        <span key={mode} style={{ display: "contents" }}>
          <button
            type="button"
            role="tab"
            aria-selected={contentTab === "scene" && mode === activeMode}
            className={`${styles.modeTab} ${
              contentTab === "scene" && mode === activeMode
                ? styles.modeTabActive
                : ""
            }`}
            onClick={() => {
              setContentTab("scene");
              handleTextMode(mode);
            }}
          >
            {mode === "tansaku" || mode === "sou"
              ? locale === "en"
                ? "Explore"
                : "探索"
              : t(`viewer.textMode.${mode}`)}
          </button>
          {mode === "desc" &&
          !isByobuSpotMode &&
          selectedSpot &&
          spotDisplay ? (
            <span
              className={`${styles.modeTab} ${
                contentTab === "spot" ? styles.modeTabActive : ""
              }`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                paddingRight: 4,
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={contentTab === "spot"}
                className={styles.modeTab}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  boxShadow: "none",
                }}
                onClick={() => {
                  setIsFolkloreOpen(false);
                  setViewMode("commentary");
                  setContentTab("spot");
                }}
              >
                {spotDisplay.spotTitle}
              </button>
              <button
                type="button"
                aria-label={
                  locale === "en"
                    ? "Clear spot selection"
                    : "スポット選択を解除"
                }
                title={
                  locale === "en"
                    ? "Clear spot selection"
                    : "スポット選択を解除"
                }
                onClick={(e) => {
                  e.stopPropagation();
                  onClearSelectedSpot?.();
                }}
                style={{
                  padding: "0 4px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  lineHeight: 1,
                  opacity: 0.75,
                }}
              >
                ×
              </button>
            </span>
          ) : null}
        </span>
      ))}
      {hasPanels ? (
        <button
          type="button"
          role="tab"
          aria-selected={contentTab === "panel"}
          className={`${styles.modeTab} ${
            contentTab === "panel" ? styles.modeTabActive : ""
          }`}
          onClick={() => setContentTab("panel")}
        >
          {viewerPanelLabel("panelTab", locale)}
        </button>
      ) : null}
    </div>
  );
}

// 4. 絵巻本文（探索 / 詞書 / ピンスポット）
export function EmakiSceneBodyContent({
  isByobuSpotMode,
  contentTab,
  selectedSpot,
  spotDisplay,
  activeMode,
  tansakuData,
  titleen,
  filterEkotobas,
  handleNavigate,
  setSelectedMotifId,
  relatedScenes,
  selectedMotifId,
  souData,
  chapterTexts,
  expanded,
  locale,
  readMoreLabel,
  panels,
  activeSliceNumber,
}) {
  if (isByobuSpotMode) return null;

  if (contentTab === "spot" && selectedSpot && spotDisplay) {
    return spotDisplay.spotBody ? (
      <span>
        {expanded
          ? spotDisplay.spotBody
          : spotDisplay.spotBody.length > 120
            ? `${spotDisplay.spotBody.slice(0, 120)}…`
            : spotDisplay.spotBody}
      </span>
    ) : null;
  }

  if ((activeMode === "tansaku" || activeMode === "sou") && tansakuData) {
    const activeMotif = getMotifDefinition(selectedMotifId);
    return (
      <CommentaryExploreView
        activeMotif={activeMotif}
        currentEmakiSlug={titleen}
        onNavigateSameEmaki={(chapter) => {
          const targetIdx = filterEkotobas.findIndex(
            (item) => String(item.chapter) === String(chapter)
          );
          if (targetIdx !== -1) {
            handleNavigate(targetIdx);
          }
        }}
        onSelectMotif={setSelectedMotifId}
        relatedScenes={relatedScenes}
        selectedMotifId={selectedMotifId}
        souData={souData}
      />
    );
  }

  const hasPanels = Array.isArray(panels) && panels.length > 0;

  if (hasPanels && contentTab === "panel") {
    const activePanel =
      resolveActivePanel(panels, activeSliceNumber) ?? panels[0];
    const panelCopy = panelLocalizedStrings(activePanel, locale);
    const latinTranslation =
      locale === "en"
        ? activePanel.latin_translation_en
        : activePanel.latin_translation_ja;
    const translationQuote = latinTranslation
      ? locale === "en"
        ? `"${latinTranslation}"`
        : `「${latinTranslation}」`
      : null;
    return (
      <span className={styles.panelSceneCard}>
        <span className={styles.panelSceneHeader}>
          {activePanel.embroidered_mark ? (
            <span className={styles.panelSceneMarkBadge}>
              {activePanel.embroidered_mark}
            </span>
          ) : null}
          {panelCopy.title ? (
            <span className={styles.panelSceneTitle}>{panelCopy.title}</span>
          ) : null}
        </span>
        {activePanel.latin_inscription ? (
          <blockquote className={styles.panelSceneLatinQuote}>
            <span className={styles.panelSceneLatinLabel}>
              {viewerPanelLabel("latinInscription", locale)}
            </span>
            <p className={styles.panelSceneLatinText}>
              {activePanel.latin_inscription}
            </p>
            {translationQuote ? (
              <p className={styles.panelSceneLatinTranslation}>
                {translationQuote}
              </p>
            ) : null}
          </blockquote>
        ) : null}
        {panelCopy.summary ? (
          <span className={styles.panelSceneSummary}>{panelCopy.summary}</span>
        ) : null}
      </span>
    );
  }

  return (
    <CommentaryTextView
      activeMode={activeMode}
      chapterTexts={chapterTexts}
      expanded={expanded}
      locale={locale}
      readMoreLabel={readMoreLabel}
    />
  );
}