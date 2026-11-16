/**
 * 絵巻モード専用 UI 断片（目次・タブ・探索・詞書本文）。
 */
import CommentaryExploreView from "@/components/emaki/commentary/CommentaryExploreView";
import CommentaryTextView from "@/components/emaki/commentary/CommentaryTextView";
import CommentarySectionIndex from "@/components/emaki/commentary/CommentarySectionIndex";
import FolkloreSceneList from "@/components/emaki/folklore/FolkloreSceneList";
import { getMotifDefinition } from "@/utils/motifNetwork";
import styles from "@/styles/SceneCommentaryBar.module.css";

// 1. 段目次
export function EmakiSectionIndex({
  viewMode,
  isByobuSpotMode,
  activeIndex,
  indexRows,
  handleNavigate,
  t,
}) {
  if (viewMode !== "index" || isByobuSpotMode) return null;
  return (
    <CommentarySectionIndex
      activeIndex={activeIndex}
      indexRows={indexRows}
      onNavigate={handleNavigate}
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
}) {
  if (isByobuSpotMode || !showModeTabs) return null;
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
            onClick={() => handleTextMode(mode)}
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