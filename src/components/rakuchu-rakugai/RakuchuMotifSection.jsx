"use client";

import { useMemo, useState } from "react";
import {
  RAKUCHU_SPOT_MASTERS,
  getSpotVisualKind,
} from "@/data/rakuchu-rakugai/rakuchuMotifMaster";
import { MotifCropCard } from "./MotifCropCard";
import {
  CATEGORY_FILTERS,
  MOTIF_CATEGORY_LABELS,
  SCROLL_EDITIONS,
  SCROLL_PILL_LABELS,
  overlayCarouselBtnStyle,
} from "./rakuchuScrollConstants";
import { categoryFilterTheme, themeForKind } from "./spotPinTheme";
import { getMotifVisual } from "./wingLinks";

function MotifCarouselCard({ motif, motifVisuals, locale }) {
  const isJa = locale !== "en";
  const availableScrolls = useMemo(
    () =>
      SCROLL_EDITIONS.filter((s) =>
        Boolean(getMotifVisual(motifVisuals, motif.masterId, s.titleen))
      ),
    [motifVisuals, motif.masterId]
  );
  const [scrollIndex, setScrollIndex] = useState(0);

  if (availableScrolls.length === 0) return null;

  const edition = availableScrolls[scrollIndex];
  const visual = getMotifVisual(motifVisuals, motif.masterId, edition.titleen);
  const pillLabels = isJa ? SCROLL_PILL_LABELS.ja : SCROLL_PILL_LABELS.en;
  const visualKind =
    (typeof getSpotVisualKind === "function"
      ? getSpotVisualKind(motif.masterId)
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

  const goPrev = () => {
    setScrollIndex((i) => (i <= 0 ? availableScrolls.length - 1 : i - 1));
  };
  const goNext = () => {
    setScrollIndex((i) => (i >= availableScrolls.length - 1 ? 0 : i + 1));
  };

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        borderRadius: 6,
        border: `1px solid ${theme.borderColor}`,
        borderLeft: `4px solid ${theme.accentColor}`,
        background: theme.bg,
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 15,
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
            fontSize: 11,
            fontWeight: 600,
            color: theme.textColor,
            marginBottom: 6,
          }}
        >
          {categoryText}
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.65, color: "#4a3f33" }}>
          {isJa ? motif.summaryJa : motif.summaryEn}
        </div>
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
          <MotifCropCard visual={visual} href={`/${edition.titleen}`} />
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

/** @param {{ motifVisuals?: Record<string, Record<string, { image?: string, x?: number, y?: number }>>, locale?: string }} props */
export function RakuchuMotifSection({ motifVisuals, locale = "ja" }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const isJa = locale !== "en";

  const filteredMotifs = useMemo(() => {
    const byCategory =
      selectedCategory === "all"
        ? RAKUCHU_SPOT_MASTERS
        : RAKUCHU_SPOT_MASTERS.filter((m) => m.category === selectedCategory);
    return byCategory.filter((motif) =>
      SCROLL_EDITIONS.some((s) =>
        Boolean(getMotifVisual(motifVisuals, motif.masterId, s.titleen))
      )
    );
  }, [selectedCategory, motifVisuals]);

  return (
    <section>
      <div
        role="tablist"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 8,
          marginBottom: 24,
        }}
      >
        {CATEGORY_FILTERS.map((cat) => {
          const active = selectedCategory === cat.id;
          const filterTheme = categoryFilterTheme(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 6,
                border: active
                  ? `1px solid ${filterTheme.borderColor}`
                  : "1px solid #d8d0c3",
                background: active ? filterTheme.pillBg : "#f4f1ea",
                color: active ? filterTheme.textColor : "#3b3228",
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  display: "inline-block",
                  ...filterTheme.dotStyle,
                }}
              />
              {isJa ? cat.labelJa : cat.labelEn}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 24,
        }}
      >
        {filteredMotifs.map((motif) => (
          <MotifCarouselCard
            key={motif.masterId}
            motif={motif}
            motifVisuals={motifVisuals}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}