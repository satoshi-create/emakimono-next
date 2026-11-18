"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  RAKUCHU_SPOT_MASTERS,
} from "@/data/rakuchu-rakugai/rakuchuMotifMaster";
import { RakuchuMotifCard } from "./RakuchuMotifCard";
import {
  CATEGORY_FILTERS,
  SCROLL_EDITIONS,
} from "./rakuchuScrollConstants";
import { categoryFilterTheme } from "./spotPinTheme";
import { getMotifVisual } from "./wingLinks";

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
          <RakuchuMotifCard
            key={motif.masterId}
            variant="grid"
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