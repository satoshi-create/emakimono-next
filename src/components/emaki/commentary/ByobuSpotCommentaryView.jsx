/**
 * 屏風モード専用 UI 断片（目次・カテゴリ・本文・前後ナビ）。
 */
import Link from "next/link";
import CommentarySectionIndex from "@/components/emaki/commentary/CommentarySectionIndex";
import {
  SCROLL_EDITIONS,
  SCROLL_PILL_LABELS,
} from "@/components/rakuchu-rakugai/rakuchuScrollConstants";

export const BYOBU_TEXT_LINK = {
  padding: 0,
  border: "none",
  background: "transparent",
  color: "var(--era-text, #256394)",
  fontSize: "inherit",
  fontWeight: 500,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
  cursor: "pointer",
  lineHeight: 1.5,
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
        color: "#6b7280",
        fontSize: "12px",
        fontWeight: 500,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {categoryLabel}
    </p>
  );
}

// 3. 本文: 未選択ガイド / 選択時スポット解説・他伝本リンク
export function ByobuSpotBodyContent({
  isByobuSpotMode,
  activeByobuSpot,
  locale,
  allSpots,
  onSelectSpot,
  spotDisplay,
  rakuchuSpotMaster,
  expanded,
}) {
  if (!isByobuSpotMode) return null;

  if (!activeByobuSpot) {
    return (
      <>
        <span>
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
        <span>
          {expanded
            ? spotDisplay.spotBody
            : spotDisplay.spotBody.length > 120
              ? `${spotDisplay.spotBody.slice(0, 120)}…`
              : spotDisplay.spotBody}
        </span>
      ) : null}
      {rakuchuSpotMaster ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 6,
            marginTop: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {spotDisplay.otherScrolls.map((otherTitleen) => {
            const editionIdx = SCROLL_EDITIONS.findIndex(
              (e) => e.titleen === otherTitleen
            );
            const shortJa =
              editionIdx >= 0
                ? SCROLL_PILL_LABELS.ja[editionIdx]
                : otherTitleen;
            const shortEn =
              editionIdx >= 0
                ? SCROLL_PILL_LABELS.en[editionIdx]
                : otherTitleen;
            const label =
              locale === "en"
                ? `View in another scroll: ${shortEn} ↗`
                : `他伝本で見る: ${shortJa} ↗`;
            return (
              <Link
                key={otherTitleen}
                href={`/${otherTitleen}?spot=${encodeURIComponent(
                  spotDisplay.targetSpotId
                )}`}
              >
                <a
                  style={BYOBU_TEXT_LINK}
                  onClick={(e) => e.stopPropagation()}
                >
                  {label}
                </a>
              </Link>
            );
          })}
          <Link
            href={`/rakuchu-rakugai/chapters?motif=${encodeURIComponent(
              rakuchuSpotMaster.masterId
            )}#motifs`}
          >
            <a
              style={BYOBU_TEXT_LINK}
              onClick={(e) => e.stopPropagation()}
            >
              {locale === "en"
                ? "Compare three scrolls via motif hub ↗"
                : "主要モチーフ比較で3伝本を見比べる ↗"}
            </a>
          </Link>
        </div>
      ) : null}
    </>
  );
}

// 4. フッター前後スポットナビ
export function ByobuSpotFooterNav({
  isByobuSpotMode,
  activeByobuSpot,
  allSpots,
  spotActiveIndex,
  locale,
  handleNavigateSpot,
}) {
  if (!isByobuSpotMode || !activeByobuSpot || allSpots.length === 0) {
    return null;
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginRight: "auto",
        flexWrap: "wrap",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        style={{
          fontSize: "12px",
          fontWeight: 500,
          color: "#6b7280",
        }}
      >
        {`${spotActiveIndex + 1} / ${allSpots.length}`}
      </span>
      <button
        type="button"
        style={{
          ...BYOBU_TEXT_LINK,
          opacity: spotActiveIndex <= 0 ? 0.4 : 1,
        }}
        disabled={spotActiveIndex <= 0}
        onClick={() => handleNavigateSpot(spotActiveIndex - 1)}
      >
        {locale === "en" ? "← Prev" : "← 前へ"}
      </button>
      <button
        type="button"
        style={{
          ...BYOBU_TEXT_LINK,
          opacity: spotActiveIndex >= allSpots.length - 1 ? 0.4 : 1,
        }}
        disabled={spotActiveIndex >= allSpots.length - 1}
        onClick={() => handleNavigateSpot(spotActiveIndex + 1)}
      >
        {locale === "en" ? "Next →" : "次へ →"}
      </button>
    </div>
  );
}