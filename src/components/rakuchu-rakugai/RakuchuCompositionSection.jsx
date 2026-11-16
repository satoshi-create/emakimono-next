"use client";

import { useEffect, useMemo, useState } from "react";
import { RAKUCHU_COMPOSITION_FORMS } from "@/data/rakuchu-rakugai/rakuchuMotifMaster";
import { MotifPanoramaFrame } from "./MotifPanoramaFrame";
import { FORM_PANORAMA, FORM_TAB_IDS } from "./rakuchuScrollConstants";

/** @param {{ motifVisuals?: Record<string, Record<string, { image?: string, x?: number, y?: number }>>, stripsByTitleen?: Record<string, unknown[]>, locale?: string, initialForm?: string }} props */
export function RakuchuCompositionSection({
  motifVisuals,
  stripsByTitleen,
  locale = "ja",
  initialForm,
}) {
  const resolvedInitial =
    initialForm && FORM_TAB_IDS.includes(initialForm) ? initialForm : "second";
  const [selectedForm, setSelectedForm] = useState(resolvedInitial);

  useEffect(() => {
    if (initialForm && FORM_TAB_IDS.includes(initialForm)) {
      setSelectedForm(initialForm);
    }
  }, [initialForm]);

  const isJa = locale !== "en";
  const form = RAKUCHU_COMPOSITION_FORMS[selectedForm];
  const panoramaConfig = FORM_PANORAMA[selectedForm];

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
    <section
      style={{
        marginBottom: 40,
        width: "100%",
      }}
    >
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
                border: active ? "1px solid #c59b27" : "1px solid #d8d0c3",
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
      <MotifPanoramaFrame
        motifVisuals={motifVisuals}
        stripsByTitleen={stripsByTitleen}
        locale={locale}
        panoramaConfig={panoramaConfig}
        leftTitle={isJa ? "左隻（西側の主役）" : "Left Scroll (West Anchor)"}
        rightTitle={isJa ? "右隻（東側の主役）" : "Right Scroll (East Anchor)"}
        leftSubtitle={leftSubtitle}
        rightSubtitle={rightSubtitle}
      />
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