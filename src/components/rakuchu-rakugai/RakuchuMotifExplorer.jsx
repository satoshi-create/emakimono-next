"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  RAKUCHU_COMPOSITION_FORMS,
  RAKUCHU_SPOT_MASTERS,
} from "@/data/rakuchu-rakugai/rakuchuMotifMaster";

const FORM_TAB_IDS = ["first", "second", "second_variant"];

const SCROLL_EDITIONS = [
  {
    titleen: "rakuchu_rakugai_funaki",
    labelJa: "舟木本（国宝）",
    labelEn: "Funaki Version (National Treasure)",
  },
  {
    titleen: "rakuchu_rakugai_met",
    labelJa: "バーク本（MET）",
    labelEn: "Burke Version (MET)",
  },
  {
    titleen: "rakuchu_rakugai_fukuoka",
    labelJa: "福岡本（重文）",
    labelEn: "Fukuoka Version (Important Cultural Property)",
  },
];

const FORM_WING_VISUALS = {
  second: {
    left: { masterId: "nijo_castle", titleen: "rakuchu_rakugai_funaki" },
    right: { masterId: "hokoji_daibutsu", titleen: "rakuchu_rakugai_funaki" },
  },
  second_variant: {
    left: { masterId: "imperial_palace", titleen: "rakuchu_rakugai_fukuoka" },
    right: { masterId: "kiyomizudera", titleen: "rakuchu_rakugai_fukuoka" },
  },
};

function getMotifVisual(motifVisuals, masterId, titleen) {
  const entry = motifVisuals?.[masterId]?.[titleen];
  if (!entry?.image) return null;
  const x = typeof entry.x === "number" ? entry.x : 50;
  const y = typeof entry.y === "number" ? entry.y : 50;
  const dx = typeof entry.dx === "number" ? entry.dx : 0;
  const dy = typeof entry.dy === "number" ? entry.dy : 0;
  const zoom =
    typeof entry.zoom === "number" ? Math.max(1.6, entry.zoom) : 1.85;
  const rawFx = Math.min(100, Math.max(0, x + dx));
  const rawFy = Math.min(100, Math.max(0, y + dy));
  const halfSpanX = 50 / zoom;
  const clampedFx = Math.min(100 - halfSpanX, Math.max(halfSpanX, rawFx));
  const clampedFy = Math.min(82, Math.max(18, rawFy));
  return {
    image: entry.image,
    x,
    y,
    fx: rawFx,
    fy: rawFy,
    clampedFx,
    clampedFy,
    zoom,
  };
}

function MotifCropCard({ visual, href, children, style = {} }) {
  if (!visual) {
    return (
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 10,
          background:
            "repeating-linear-gradient(-12deg, #f4efe6 0, #f4efe6 8px, #ebe4d8 8px, #ebe4d8 16px)",
          border: "2px dashed rgba(120, 90, 60, 0.35)",
          width: "100%",
          height: 220,
          aspectRatio: "16 / 10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(80, 60, 40, 0.75)",
          fontSize: 13,
          fontWeight: 500,
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  const inner = (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 10,
        width: "100%",
        height: 220,
        aspectRatio: "16 / 10",
        background: "#1a1510",
        ...style,
      }}
    >
      <img
        src={visual.image}
        alt=""
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "100%",
          height: "auto",
          maxWidth: "none",
          transform: `translate(-${visual.clampedFx}%, -${visual.clampedFy}%) scale(${visual.zoom})`,
          transformOrigin: `${visual.clampedFx}% ${visual.clampedFy}%`,
        }}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ display: "block", textDecoration: "none" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}

function WingPanel({ title, subtitle, motifVisuals, wingSpec, locale, schematic }) {
  const isJa = locale !== "en";
  const visual =
    wingSpec && !schematic
      ? getMotifVisual(motifVisuals, wingSpec.masterId, wingSpec.titleen)
      : null;

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#6e6050",
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1f1a14", lineHeight: 1.4 }}>
          {subtitle}
        </div>
      </div>
      {schematic ? (
        <div
          style={{
            flex: 1,
            minHeight: 160,
            borderRadius: 10,
            border: "1px solid #dfd6c7",
            background: "rgba(248, 244, 236, 0.9)",
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#4a3f33",
              lineHeight: 1.55,
            }}
          >
            {schematic}
          </div>
        </div>
      ) : (
        <MotifCropCard visual={visual} href={wingSpec ? `/${wingSpec.titleen}` : undefined}>
          {!visual && (isJa ? "描写なし / Not depicted" : "Not depicted")}
        </MotifCropCard>
      )}
    </div>
  );
}

const carouselBtnStyle = {
  flexShrink: 0,
  width: 40,
  height: 40,
  borderRadius: 8,
  border: "1px solid #d8d0c3",
  background: "#faf7f2",
  color: "#1f1a14",
  fontSize: 14,
  cursor: "pointer",
};

/** @param {{ motifVisuals?: Record<string, Record<string, { image?: string, x?: number, y?: number }>>, locale?: string }} props */
export function RakuchuCompositionSection({ motifVisuals, locale = "ja" }) {
  const [selectedForm, setSelectedForm] = useState("second");

  const isJa = locale !== "en";
  const form = RAKUCHU_COMPOSITION_FORMS[selectedForm];
  const wingConfig = FORM_WING_VISUALS[selectedForm];

  const leftSubtitle = isJa ? form.leftFocusJa : form.leftFocusEn;
  const rightSubtitle = isJa ? form.rightFocusJa : form.rightFocusEn;
  const formSummary = isJa ? form.summaryJa : form.summaryEn;
  const formLabel = isJa ? form.labelJa : form.labelEn;

  const firstSchematic = useMemo(() => {
    if (selectedForm !== "first") return null;
    return isJa
      ? "左隻（西側の主役）：花の御所（室町将軍）・武家屋敷群\n右隻（東側の主役）：内裏（天皇）・朝廷の中心"
      : "Left scroll (west anchor): Hana-no-Gosho (Shogun) & warrior mansions\nRight scroll (east anchor): Imperial Palace (Emperor) & court";
  }, [selectedForm, isJa]);

  return (
      <section style={{ marginBottom: 40 }}>
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
          {FORM_TAB_IDS.map((id) => {
            const f = RAKUCHU_COMPOSITION_FORMS[id];
            const active = selectedForm === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedForm(id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: active
                    ? "1px solid #c59b27"
                    : "1px solid #d8d0c3",
                  background: active ? "#f3e6c8" : "#f4f1ea",
                  color: active ? "#5c4200" : "#3b3228",
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                }}
              >
                {isJa ? f.labelJa : f.labelEn}
              </button>
            );
          })}
        </div>
        <p
          style={{
            fontSize: 14,
            textAlign: "center",
            maxWidth: "44rem",
            margin: "0 auto 28px",
            lineHeight: 1.85,
            color: "#4a3f33",
          }}
        >
          <strong style={{ color: "#1f1a14" }}>{formLabel}</strong>
          {" — "}
          {formSummary}
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          <WingPanel
            title={isJa ? "左隻（西側の主役）" : "Left Scroll (West Anchor)"}
            subtitle={leftSubtitle}
            motifVisuals={motifVisuals}
            wingSpec={wingConfig?.left}
            locale={locale}
            schematic={
              selectedForm === "first"
                ? isJa
                  ? "花の御所（将軍）を軸にした戦国期・初期型の左隻构图"
                  : "Early Sengoku left scroll anchored on the Shogun’s Hana-no-Gosho"
                : null
            }
          />
          <WingPanel
            title={isJa ? "右隻（東側の主役）" : "Right Scroll (East Anchor)"}
            subtitle={rightSubtitle}
            motifVisuals={motifVisuals}
            wingSpec={wingConfig?.right}
            locale={locale}
            schematic={
              selectedForm === "first"
                ? isJa
                  ? "内裏（天皇）を軸にした戦国期・初期型の右隻构图"
                  : "Early Sengoku right scroll anchored on the Imperial Palace"
                : null
            }
          />
        </div>
        {selectedForm === "first" && firstSchematic && (
          <p
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "#6e6050",
              whiteSpace: "pre-line",
            }}
          >
            {firstSchematic}
          </p>
        )}
      </section>
  );
}

const CATEGORY_FILTERS = [
  { id: "all", labelJa: "すべて", labelEn: "All" },
  { id: "power", labelJa: "権力・城郭", labelEn: "Power & Castles" },
  { id: "temple", labelJa: "寺社", labelEn: "Temples & Shrines" },
  { id: "town", labelJa: "町並み・祭礼・河川", labelEn: "Town, Festivals & Rivers" },
];

const SCROLL_PILL_LABELS = {
  ja: ["舟木本", "バーク本", "福岡本"],
  en: ["Funaki", "Burke", "Fukuoka"],
};

const MOTIF_CATEGORY_LABELS = {
  power: { ja: "権力・城郭", en: "Power & Castles" },
  temple: { ja: "寺社", en: "Temples & Shrines" },
  town: { ja: "町並み・祭礼・河川", en: "Town, Festivals & Rivers" },
};

function firstAvailableScrollIndex(motifVisuals, masterId) {
  const idx = SCROLL_EDITIONS.findIndex((s) =>
    getMotifVisual(motifVisuals, masterId, s.titleen)
  );
  return idx >= 0 ? idx : 0;
}

const overlayCarouselBtnStyle = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "rgba(31, 26, 20, 0.5)",
  color: "#fff",
  fontSize: 13,
  cursor: "pointer",
  zIndex: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

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
  const catLabel = MOTIF_CATEGORY_LABELS[motif.category];
  const categoryText = catLabel
    ? isJa
      ? catLabel.ja
      : catLabel.en
    : motif.category;
  const showCarouselNav = availableScrolls.length >= 2;

  const goPrev = () => {
    setScrollIndex((i) =>
      i <= 0 ? availableScrolls.length - 1 : i - 1
    );
  };
  const goNext = () => {
    setScrollIndex((i) =>
      i >= availableScrolls.length - 1 ? 0 : i + 1
    );
  };

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        borderRadius: 12,
        border: "1px solid #dfd6c7",
        background: "rgba(252, 249, 244, 0.95)",
      }}
    >
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1f1a14", marginBottom: 4 }}>
          {isJa ? motif.nameJa : motif.nameEn}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#8a7355",
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
                    ? "1px solid #c59b27"
                    : "1px solid #d8d0c3",
                  background: active ? "#f3e6c8" : "#f4f1ea",
                  color: active ? "#5c4200" : "#3b3228",
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
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: active ? "1px solid #c59b27" : "1px solid #d8d0c3",
                background: active ? "#f3e6c8" : "#f4f1ea",
                color: active ? "#5c4200" : "#3b3228",
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
              }}
            >
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

/** @param {{ motifVisuals?: Record<string, Record<string, { image?: string, x?: number, y?: number }>>, locale?: string }} props */
export default function RakuchuMotifExplorer({ motifVisuals, locale = "ja" }) {
  return (
    <>
      <div
        style={{
          fontFamily: "var(--font-ui, system-ui, sans-serif)",
          color: "#1f1a14",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <RakuchuCompositionSection motifVisuals={motifVisuals} locale={locale} />
        <RakuchuMotifSection motifVisuals={motifVisuals} locale={locale} />
      </div>
      <style jsx>{`
        @media (max-width: 720px) {
          section > div:last-of-type {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}