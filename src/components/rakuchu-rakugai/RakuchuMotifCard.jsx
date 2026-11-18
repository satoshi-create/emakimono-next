"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getSpotVisualKind,
} from "@/data/rakuchu-rakugai/rakuchuMotifMaster";
import { useMotifLike } from "@/hooks/emaki/useMotifLike";
import { resolveMotifEditionDetails } from "@/utils/rakuchuMotifClientResolver";
import { MotifCropCard } from "./MotifCropCard";
import {
  MOTIF_CATEGORY_LABELS,
  SCROLL_EDITIONS,
  SCROLL_PILL_LABELS,
  overlayCarouselBtnStyle,
} from "./rakuchuScrollConstants";
import { themeForKind } from "./spotPinTheme";
import { getMotifVisual, wingSceneHref } from "./wingLinks";

function buildVisualsMap(masterId, motifVisuals) {
  if (motifVisuals?.[masterId]) return motifVisuals;
  const details = resolveMotifEditionDetails(masterId);
  /** @type {Record<string, object>} */
  const byTitleen = {};
  for (const [titleen, detail] of Object.entries(details)) {
    if (detail?.visual?.image) {
      byTitleen[titleen] = {
        ...detail.visual,
        spotId: detail.spotId,
      };
    }
  }
  return { [masterId]: byTitleen };
}

/**
 * @param {{
 *   motif: import("@/data/rakuchu-rakugai/rakuchuMotifMaster").RakuchuSpotMaster,
 *   motifVisuals?: Record<string, Record<string, { image?: string, x?: number, y?: number, spotId?: string }>>,
 *   variant?: "grid" | "popup",
 *   currentScrollTitleen?: string,
 *   onJumpToCurrentScroll?: (href: string) => void,
 *   locale?: string,
 *   highlighted?: boolean,
 * }} props
 */
export function RakuchuMotifCard({
  motif,
  motifVisuals,
  variant = "grid",
  currentScrollTitleen,
  onJumpToCurrentScroll,
  locale = "ja",
  highlighted = false,
}) {
  const masterId = motif.masterId ?? motif.id;
  const isJa = locale !== "en";
  const isPopup = variant === "popup";
  const { liked, count, toggleLike } = useMotifLike(masterId);

  const resolvedVisuals = useMemo(
    () => buildVisualsMap(masterId, motifVisuals),
    [masterId, motifVisuals]
  );

  const availableScrolls = useMemo(
    () =>
      SCROLL_EDITIONS.filter((s) =>
        Boolean(getMotifVisual(resolvedVisuals, masterId, s.titleen))
      ),
    [resolvedVisuals, masterId]
  );

  const initialIndex = useMemo(() => {
    if (!currentScrollTitleen) return 0;
    const idx = availableScrolls.findIndex(
      (s) => s.titleen === currentScrollTitleen
    );
    return idx >= 0 ? idx : 0;
  }, [availableScrolls, currentScrollTitleen]);

  const [scrollIndex, setScrollIndex] = useState(initialIndex);

  if (availableScrolls.length === 0) return null;

  const edition = availableScrolls[scrollIndex] ?? availableScrolls[0];
  const visual = getMotifVisual(resolvedVisuals, masterId, edition.titleen);
  const pillLabels = isJa ? SCROLL_PILL_LABELS.ja : SCROLL_PILL_LABELS.en;
  const visualKind =
    (typeof getSpotVisualKind === "function"
      ? getSpotVisualKind(masterId)
      : null) ||
    motif.category ||
    "town";
  const theme = themeForKind(visualKind);
  const catLabel = MOTIF_CATEGORY_LABELS[motif.category];
  const categoryText = catLabel
    ? isJa
      ? catLabel.ja
      : catLabel.en
    : motif.category;
  const showCarouselNav = availableScrolls.length >= 2;

  const sceneHref =
    wingSceneHref(edition, visual) ?? `/${edition.titleen}`;
  const currentEdition =
    currentScrollTitleen &&
    availableScrolls.find((s) => s.titleen === currentScrollTitleen);
  const currentVisual = currentEdition
    ? getMotifVisual(resolvedVisuals, masterId, currentEdition.titleen)
    : null;
  const jumpHref =
    currentEdition && currentVisual
      ? wingSceneHref(currentEdition, currentVisual) ??
        `/${currentScrollTitleen}?spot=${encodeURIComponent(currentVisual.spotId ?? "")}`
      : null;

  const lat = motif.lat ?? motif.geo?.lat;
  const lng = motif.lng ?? motif.geo?.lng;
  const mapsHref =
    typeof lat === "number" && typeof lng === "number"
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : null;

  const goPrev = () => {
    setScrollIndex((i) => (i <= 0 ? availableScrolls.length - 1 : i - 1));
  };
  const goNext = () => {
    setScrollIndex((i) => (i >= availableScrolls.length - 1 ? 0 : i + 1));
  };

  if (isPopup) {
    const activeSpotId = visual?.spotId ?? "";
    const popupViewHref =
      jumpHref ??
      (activeSpotId
        ? `/${edition.titleen}?spot=${encodeURIComponent(activeSpotId)}`
        : sceneHref);

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "2px 0",
        maxHeight: "min(230px, 44vh)",
        overflowY: "auto",
        fontSize: 12,
        boxSizing: "border-box",
        width: "min(300px, 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 14,
            fontWeight: 700,
            color: "#1f1a14",
            fontFamily: "var(--font-classical)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {isJa ? motif.nameJa : motif.nameEn}
        </div>
        <button
          type="button"
          aria-pressed={liked}
          aria-label={isJa ? "モチーフにいいね" : "Like motif"}
          onClick={(e) => {
            e.stopPropagation();
            void toggleLike();
          }}
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            padding: "2px 6px",
            borderRadius: 999,
            border: "1px solid #d8d0c3",
            background: "#f4f1ea",
            color: liked ? "#be123c" : "#6b5d4f",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
          <span>{count}</span>
        </button>
      </div>

      <p
        style={{
          margin: "4px 0 0",
          fontSize: 11.5,
          lineHeight: 1.45,
          color: "#475569",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {isJa ? motif.summaryJa : motif.summaryEn}
      </p>

      <div
        style={{
          display: "flex",
          gap: 4,
          flexWrap: "wrap",
          marginTop: 6,
        }}
      >
        {availableScrolls.map((s, availIdx) => {
          const idx = SCROLL_EDITIONS.findIndex((e) => e.titleen === s.titleen);
          const active = availIdx === scrollIndex;
          return (
            <button
              key={s.titleen}
              type="button"
              onClick={() => setScrollIndex(availIdx)}
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                border: active
                  ? `1px solid ${theme.borderColor}`
                  : "1px solid #d8d0c3",
                background: active ? theme.pillBg : "#f4f1ea",
                color: active ? theme.textColor : "#3b3228",
                fontSize: 10.5,
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
              }}
            >
              {pillLabels[idx]}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginTop: 6,
        }}
      >
        <div
          style={{
            width: 96,
            height: 68,
            borderRadius: 6,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <MotifCropCard visual={visual} href={sceneHref} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            flex: 1,
            minWidth: 0,
          }}
        >
          {onJumpToCurrentScroll ? (
            <button
              type="button"
              onClick={() => onJumpToCurrentScroll(popupViewHref)}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                border: "none",
                background: "#c2410c",
                color: "#fff",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              {isJa ? "この場面を見る" : "View this scene"}
            </button>
          ) : (
            <Link
              href={popupViewHref}
              style={{
                display: "block",
                padding: "5px 10px",
                borderRadius: 6,
                background: "#c2410c",
                color: "#fff",
                fontSize: 11.5,
                fontWeight: 600,
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              {isJa ? "この場面を見る" : "View this scene"}
            </Link>
          )}
          {mapsHref ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#2563eb",
                textDecoration: "none",
              }}
            >
              {isJa ? "Google マップ ↗" : "Google Maps ↗"}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
  }

  const padding = 16;
  const gap = 12;
  const titleSize = 15;
  const bodySize = 12;
  const catSize = 11;

  return (
    <article
      id={`motif-${masterId}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
        padding,
        borderRadius: 6,
        boxSizing: "border-box",
        border: highlighted
          ? `2px solid ${theme.accentColor}`
          : `1px solid ${theme.borderColor}`,
        borderLeft: `4px solid ${theme.accentColor}`,
        background: theme.bg,
        boxShadow: highlighted
          ? `0 0 0 3px ${theme.accentColor}33, 0 4px 16px rgba(0, 0, 0, 0.12)`
          : "0 1px 4px rgba(0, 0, 0, 0.08)",
        transition: "box-shadow 0.3s ease, border-color 0.3s ease",
      }}
    >
      {jumpHref && currentScrollTitleen ? (
        <div style={{ marginBottom: 4 }}>
          {onJumpToCurrentScroll ? (
            <button
              type="button"
              onClick={() => onJumpToCurrentScroll(jumpHref)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: `1px solid ${theme.borderColor}`,
                background: theme.pillBg,
                color: theme.textColor,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              {isJa ? "絵巻のこの場面を見る" : "View this scene in the scroll"}
            </button>
          ) : (
            <Link
              href={jumpHref}
              style={{
                display: "block",
                padding: "8px 12px",
                borderRadius: 6,
                border: `1px solid ${theme.borderColor}`,
                background: theme.pillBg,
                color: theme.textColor,
                fontSize: 12,
                fontWeight: 600,
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              {isJa ? "絵巻のこの場面を見る" : "View this scene in the scroll"}
            </Link>
          )}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: titleSize,
              fontWeight: 700,
              color: "#1f1a14",
              marginBottom: 4,
              fontFamily: "var(--font-classical)",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                flexShrink: 0,
                display: "inline-block",
                ...theme.dotStyle,
              }}
            />
            {isJa ? motif.nameJa : motif.nameEn}
          </div>
          <div
            style={{
              fontSize: catSize,
              fontWeight: 600,
              color: theme.textColor,
              marginBottom: 6,
            }}
          >
            {categoryText}
          </div>
        </div>
        <button
          type="button"
          aria-pressed={liked}
          aria-label={isJa ? "モチーフにいいね" : "Like motif"}
          onClick={(e) => {
            e.stopPropagation();
            void toggleLike();
          }}
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
            borderRadius: 999,
            border: "1px solid #d8d0c3",
            background: "#f4f1ea",
            color: liked ? "#be123c" : "#6b5d4f",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
          <span>{count}</span>
        </button>
      </div>

      <div style={{ fontSize: bodySize, lineHeight: 1.65, color: "#4a3f33" }}>
        {isJa ? motif.summaryJa : motif.summaryEn}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {availableScrolls.map((s, availIdx) => {
            const idx = SCROLL_EDITIONS.findIndex((e) => e.titleen === s.titleen);
            const active = availIdx === scrollIndex;
            return (
              <button
                key={s.titleen}
                type="button"
                onClick={() => setScrollIndex(availIdx)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 999,
                  border: active
                    ? `1px solid ${theme.borderColor}`
                    : "1px solid #d8d0c3",
                  background: active ? theme.pillBg : "#f4f1ea",
                  color: active ? theme.textColor : "#3b3228",
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                }}
              >
                {pillLabels[idx]}
              </button>
            );
          })}
        </div>

        <div style={{ position: "relative" }}>
          {showCarouselNav ? (
            <button
              type="button"
              onClick={goPrev}
              aria-label={isJa ? "前の伝本" : "Previous scroll"}
              style={{ ...overlayCarouselBtnStyle, left: 8 }}
            >
              ◀
            </button>
          ) : null}
          <MotifCropCard visual={visual} href={sceneHref} />
          {showCarouselNav ? (
            <button
              type="button"
              onClick={goNext}
              aria-label={isJa ? "次の伝本" : "Next scroll"}
              style={{ ...overlayCarouselBtnStyle, right: 8 }}
            >
              ▶
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}