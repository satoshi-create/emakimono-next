/**
 * 屏風モード専用 UI 断片（目次・カテゴリ・本文・前後ナビ）。
 */
import CommentarySectionIndex from "@/components/emaki/commentary/CommentarySectionIndex";

export const BYOBU_TEXT_LINK = {
  padding: 0,
  border: "none",
  background: "transparent",
  color: "var(--era-text)",
  fontSize: "inherit",
  fontWeight: 500,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
  cursor: "pointer",
  lineHeight: 1.5,
};

const BYOBU_NAV_BTN = {
  ...BYOBU_TEXT_LINK,
  textDecoration: "none",
  flex: "1 1 0",
  minWidth: 0,
  maxWidth: "42%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "left",
};

const BYOBU_NAV_BTN_NEXT = {
  ...BYOBU_NAV_BTN,
  textAlign: "right",
};

// 1. スポット目次（段構成一覧の屏風版）
export function ByobuSpotIndexSection({
  viewMode,
  isByobuSpotMode,
  spotActiveIndex,
  spotIndexRows,
  handleNavigateSpot,
  t,
}) {
  if (viewMode !== "index" || !isByobuSpotMode) return null;
  return (
    <CommentarySectionIndex
      activeIndex={spotActiveIndex}
      indexRows={spotIndexRows}
      onNavigate={handleNavigateSpot}
      t={t}
    />
  );
}

// 2. 選択スポットのカテゴリラベル
export function ByobuSpotCategoryLine({
  isByobuSpotMode,
  activeByobuSpot,
  categoryLabel,
}) {
  if (!isByobuSpotMode || !activeByobuSpot || !categoryLabel) return null;
  return (
    <p
      style={{
        margin: "4px 0 0",
        padding: "0 14px",
        color: "var(--bar-text-muted)",
        fontSize: "12px",
        fontWeight: 500,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {categoryLabel}
    </p>
  );
}

// 3. 本文: 未選択ガイド / 選択時スポット解説
export function ByobuSpotBodyContent({
  isByobuSpotMode,
  activeByobuSpot,
  locale,
  allSpots,
  onSelectSpot,
  spotDisplay,
  expanded,
}) {
  if (!isByobuSpotMode) return null;

  if (!activeByobuSpot) {
    return (
      <>
        <span style={{ color: "var(--bar-text)" }}>
          {locale === "en"
            ? "Click spot badges on the scroll to zoom in and read commentary. You can also tour them in order from the right section."
            : "画面上のスポットバッジをクリックすると拡大と解説が見られます。右隻から順番に巡ることもできます。"}
        </span>
        {allSpots[0]?.spot ? (
          <button
            type="button"
            style={{
              ...BYOBU_TEXT_LINK,
              marginTop: 10,
              display: "inline-block",
              textAlign: "left",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSpot?.(allSpots[0].spot);
            }}
          >
            {locale === "en"
              ? `View the first highlight “${allSpots[0].spot.nameen || allSpots[0].spot.name}” →`
              : `最初の見どころ「${allSpots[0].spot.name}」を見る →`}
          </button>
        ) : null}
      </>
    );
  }

  if (!spotDisplay) return null;

  return (
    <>
      {spotDisplay.spotBody ? (
        <span style={{ color: "var(--bar-text)" }}>
          {expanded
            ? spotDisplay.spotBody
            : spotDisplay.spotBody.length > 120
              ? `${spotDisplay.spotBody.slice(0, 120)}…`
              : spotDisplay.spotBody}
        </span>
      ) : null}
    </>
  );
}

function resolveAdjacentSpots(allSpots, spotActiveIndex, locale, prevSpot, nextSpot) {
  const titleForRow = (row) => {
    const spot = row?.spot;
    if (!spot) return "";
    return locale === "en" ? spot.nameen || spot.name : spot.name;
  };
  const prev =
    prevSpot ??
    (spotActiveIndex > 0
      ? {
          index: spotActiveIndex - 1,
          title: titleForRow(allSpots[spotActiveIndex - 1]),
        }
      : null);
  const next =
    nextSpot ??
    (spotActiveIndex < allSpots.length - 1
      ? {
          index: spotActiveIndex + 1,
          title: titleForRow(allSpots[spotActiveIndex + 1]),
        }
      : null);
  return { prev, next };
}

// 4. フッター前後スポットナビ
export function ByobuSpotFooterNav({
  isByobuSpotMode,
  activeByobuSpot,
  allSpots,
  spotActiveIndex,
  locale,
  handleNavigateSpot,
  prevSpot,
  nextSpot,
}) {
  if (!isByobuSpotMode || !activeByobuSpot || allSpots.length === 0) {
    return null;
  }

  const { prev, next } = resolveAdjacentSpots(
    allSpots,
    spotActiveIndex,
    locale,
    prevSpot,
    nextSpot
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flex: 1,
        minWidth: 0,
        gap: "8px",
        marginRight: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        style={{
          ...BYOBU_NAV_BTN,
          opacity: next ? 1 : 0.4,
          color: "var(--bar-text)",
        }}
        disabled={!next}
        onClick={() => next && handleNavigateSpot(next.index)}
      >
        {next
          ? `← ${next.title}`
          : locale === "en"
            ? "← Next"
            : "← 次へ"}
      </button>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 500,
          color: "var(--bar-text-muted)",
          flexShrink: 0,
        }}
      >
        {`${spotActiveIndex + 1} / ${allSpots.length}`}
      </span>
      <button
        type="button"
        style={{
          ...BYOBU_NAV_BTN_NEXT,
          opacity: prev ? 1 : 0.4,
          color: "var(--bar-text)",
        }}
        disabled={!prev}
        onClick={() => prev && handleNavigateSpot(prev.index)}
      >
        {prev
          ? `${prev.title} →`
          : locale === "en"
            ? "Prev →"
            : "前へ →"}
      </button>
    </div>
  );
}