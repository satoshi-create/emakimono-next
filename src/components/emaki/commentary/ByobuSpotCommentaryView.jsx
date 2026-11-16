/**
 * 屏風モード専用 UI 断片（目次・カテゴリ・本文・前後ナビ）。
 */
import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import CommentarySectionIndex from "@/components/emaki/commentary/CommentarySectionIndex";
import { resolveByobuSpotLinkChips } from "@/components/emaki/commentary/useByobuSpotCommentary";

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

/** 解説本文（SceneCommentaryBar .bodyText / .gendaibun）と同一 */
const BYOBU_BODY_TEXT = {
  fontSize: "0.85rem",
  lineHeight: 1.45,
  fontFamily: "var(--font-story)",
};

const BYOBU_NAV_BTN = {
  ...BYOBU_TEXT_LINK,
  ...BYOBU_BODY_TEXT,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const BYOBU_NAV_BTN_NEXT = {
  ...BYOBU_NAV_BTN,
};

const EDITION_CHIP_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
  padding: "2px 8px",
  borderRadius: "9999px",
  fontSize: "11.5px",
  lineHeight: 1.4,
  textDecoration: "none",
  backgroundColor: "var(--era-soft-bg)",
  border: "1px solid var(--era-border)",
  color: "var(--era-text)",
};

const HUB_CHIP_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
  padding: "2px 8px",
  borderRadius: "9999px",
  fontSize: "11.5px",
  lineHeight: 1.4,
  textDecoration: "none",
  backgroundColor: "transparent",
  border: "1px solid var(--bar-border)",
  color: "var(--bar-text-muted)",
};

function ByobuSpotLinkChipRow({
  crossEditionLinks,
  hubComparisonLink,
  locale,
}) {
  if (!crossEditionLinks?.length && !hubComparisonLink) return null;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "6px",
        marginTop: "8px",
        width: "100%",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {crossEditionLinks?.length ? (
        <span
          style={{
            fontSize: "11px",
            color: "var(--bar-text-muted)",
            flexShrink: 0,
          }}
        >
          {locale === "en" ? "Editions:" : "他伝本:"}
        </span>
      ) : null}
      {crossEditionLinks?.map((item) => (
        <Link key={item.key} href={item.href} passHref>
          <a
            style={EDITION_CHIP_STYLE}
            onClick={(e) => e.stopPropagation()}
          >
            {`${item.label} ↗`}
          </a>
        </Link>
      ))}
      {hubComparisonLink ? (
        <Link href={hubComparisonLink.href} passHref>
          <a
            style={HUB_CHIP_STYLE}
            onClick={(e) => e.stopPropagation()}
          >
            {hubComparisonLink.label}
          </a>
        </Link>
      ) : null}
    </div>
  );
}

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

/** line-clamp 対象（2行制限）の本文のみ */
export function ByobuSpotClampText({
  isByobuSpotMode,
  activeByobuSpot,
  locale,
  spotDisplay,
}) {
  if (!isByobuSpotMode) return null;

  if (!activeByobuSpot) {
    return (
      <span style={{ color: "var(--bar-text)" }}>
        {locale === "en"
          ? "Click spot badges on the scroll to zoom in and read commentary. You can also tour them in order from the right section."
          : "画面上のスポットバッジをクリックすると拡大と解説が見られます。右隻から順番に巡ることもできます。"}
      </span>
    );
  }

  if (!spotDisplay?.spotBody) return null;

  return (
    <span style={{ color: "var(--bar-text)" }}>{spotDisplay.spotBody}</span>
  );
}

/** 折りたたみ時も常時表示（クランプ外） */
export function ByobuSpotPersistentActions({
  isByobuSpotMode,
  activeByobuSpot,
  locale,
  allSpots,
  onSelectSpot,
  spotDisplay,
  crossEditionLinks: crossEditionLinksProp,
  hubComparisonLink: hubComparisonLinkProp,
  titleen: titleenProp,
}) {
  const router = useRouter();
  const titleen =
    titleenProp ||
    (typeof router.query.slug === "string" ? router.query.slug : undefined);

  const linkSpotId = activeByobuSpot?.id;

  const { crossEditionLinks, hubComparisonLink } = useMemo(() => {
    if (crossEditionLinksProp != null || hubComparisonLinkProp != null) {
      return {
        crossEditionLinks: crossEditionLinksProp ?? [],
        hubComparisonLink: hubComparisonLinkProp ?? null,
      };
    }
    if (!linkSpotId) {
      return { crossEditionLinks: [], hubComparisonLink: null };
    }
    return resolveByobuSpotLinkChips(linkSpotId, titleen, locale);
  }, [
    crossEditionLinksProp,
    hubComparisonLinkProp,
    linkSpotId,
    titleen,
    locale,
  ]);

  if (!isByobuSpotMode) return null;

  if (!activeByobuSpot) {
    if (!allSpots[0]?.spot) return null;
    return (
      <span
        role="button"
        tabIndex={0}
        style={{
          ...BYOBU_TEXT_LINK,
          marginTop: 0,
          display: "inline-block",
          textAlign: "left",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSpot?.(allSpots[0].spot);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          e.stopPropagation();
          onSelectSpot?.(allSpots[0].spot);
        }}
      >
        {locale === "en"
          ? `View the first highlight “${allSpots[0].spot.nameen || allSpots[0].spot.name}” →`
          : `最初の見どころ「${allSpots[0].spot.name}」を見る →`}
      </span>
    );
  }

  if (!spotDisplay) return null;

  if (!crossEditionLinks?.length && !hubComparisonLink) return null;

  return (
    <ByobuSpotLinkChipRow
      crossEditionLinks={crossEditionLinks}
      hubComparisonLink={hubComparisonLink}
      locale={locale}
    />
  );
}

// 3. 本文: 未選択ガイド / 選択時スポット解説（後方互換）
export function ByobuSpotBodyContent(props) {
  return (
    <>
      <ByobuSpotClampText
        isByobuSpotMode={props.isByobuSpotMode}
        activeByobuSpot={props.activeByobuSpot}
        locale={props.locale}
        spotDisplay={props.spotDisplay}
      />
      <ByobuSpotPersistentActions {...props} />
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
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <span
          role="button"
          tabIndex={next ? 0 : -1}
          aria-disabled={!next}
          aria-label={
            next
              ? locale === "en"
                ? `Next spot: ${next.title}`
                : `次のスポット: ${next.title}`
              : locale === "en"
                ? "No next spot"
                : "次のスポットなし"
          }
          title={
            next
              ? locale === "en"
                ? `Go to next spot: ${next.title}`
                : `次のスポットへ: ${next.title}`
              : undefined
          }
          style={{
            ...BYOBU_NAV_BTN,
            opacity: next ? 1 : 0.4,
            cursor: next ? "pointer" : "default",
            color: "var(--bar-text)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (next) handleNavigateSpot(next.index);
          }}
          onKeyDown={(e) => {
            if (!next) return;
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            e.stopPropagation();
            handleNavigateSpot(next.index);
          }}
        >
          {next
            ? `← ${next.title}`
            : locale === "en"
              ? "← Next"
              : "← 次へ"}
        </span>
      </div>
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
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <span
          role="button"
          tabIndex={prev ? 0 : -1}
          aria-disabled={!prev}
          aria-label={
            prev
              ? locale === "en"
                ? `Previous spot: ${prev.title}`
                : `前のスポット: ${prev.title}`
              : locale === "en"
                ? "No previous spot"
                : "前のスポットなし"
          }
          title={
            prev
              ? locale === "en"
                ? `Go to previous spot: ${prev.title}`
                : `前のスポットへ: ${prev.title}`
              : undefined
          }
          style={{
            ...BYOBU_NAV_BTN_NEXT,
            opacity: prev ? 1 : 0.4,
            cursor: prev ? "pointer" : "default",
            color: "var(--bar-text)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (prev) handleNavigateSpot(prev.index);
          }}
          onKeyDown={(e) => {
            if (!prev) return;
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            e.stopPropagation();
            handleNavigateSpot(prev.index);
          }}
        >
          {prev
            ? `${prev.title} →`
            : locale === "en"
              ? "Previous →"
              : "前へ →"}
        </span>
      </div>
    </div>
  );
}