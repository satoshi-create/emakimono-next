"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
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
import { getMotifVisual, wingSceneHref } from "./wingLinks";

function MotifCarouselCard({ motif, motifVisuals, locale, highlighted = false }) {
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
      id={`motif-${motif.masterId}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        borderRadius: 6,
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
          <MotifCropCard
            visual={visual}
            href={wingSceneHref(edition, visual) ?? `/${edition.titleen}`}
          />
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

/** @param {{ motifVisuals?: Record<string, Record<string, { image?: string, x?: number, y?: number }>>, locale?: string, highlightMotifId?: string }} props */
export function RakuchuMotifSection({
  motifVisuals,
  locale = "ja",
  highlightMotifId,
}) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [ringMotifId, setRingMotifId] = useState(null);
  const INITIAL_VISIBLE_COUNT = 6;
  const [isExpanded, setIsExpanded] = useState(false);

  const isJa = locale !== "en";

  useEffect(() => {
    const motifId =
      highlightMotifId ||
      (typeof router.query.motif === "string" ? router.query.motif : null);
    if (!motifId) return undefined;
    const id = String(motifId);
    const motifsEl = document.getElementById("motifs");
    if (motifsEl) {
      motifsEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const scrollTimer = setTimeout(() => {
      const el = document.getElementById(`motif-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setRingMotifId(id);
    }, 400);
    const clearTimer = setTimeout(() => setRingMotifId(null), 4500);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [highlightMotifId, router.query.motif]);

  useEffect(() => {
    setIsExpanded(false);
  }, [selectedCategory]);

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

  useEffect(() => {
    const motifId =
      highlightMotifId ||
      (typeof router.query.motif === "string" ? router.query.motif : null);
    if (!motifId) return;
    const idx = filteredMotifs.findIndex(
      (m) => m.masterId === String(motifId)
    );
    if (idx >= INITIAL_VISIBLE_COUNT) {
      setIsExpanded(true);
    }
  }, [highlightMotifId, router.query.motif, filteredMotifs]);

  const visibleMotifs = isExpanded
    ? filteredMotifs
    : filteredMotifs.slice(0, INITIAL_VISIBLE_COUNT);

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
        {visibleMotifs.map((motif) => (
          <MotifCarouselCard
            key={motif.masterId}
            motif={motif}
            motifVisuals={motifVisuals}
            locale={locale}
            highlighted={ringMotifId === motif.masterId}
          />
        ))}
      </div>

      {filteredMotifs.length > INITIAL_VISIBLE_COUNT ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: "1px solid #d8d0c3",
              background: "#f4f1ea",
              color: "#3b3228",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
            }}
          >
            {isExpanded
              ? locale === "en"
                ? "Show Less"
                : "閉じる"
              : locale === "en"
                ? `Show More (${filteredMotifs.length - INITIAL_VISIBLE_COUNT} more)`
                : `もっと見る（残り ${filteredMotifs.length - INITIAL_VISIBLE_COUNT}件）`}
          </button>
        </div>
      ) : null}
    </section>
  );
}