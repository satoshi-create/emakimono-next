"use client";

import { useMemo } from "react";
import { SCROLL_PANORAMA_PREVIEW } from "./rakuchuScrollConstants";
import { getMotifByMasterId, getMotifVisual } from "./wingLinks";

export function panoramaImageFromConfig(_motifVisuals, panoramaConfig) {
  if (!panoramaConfig) return null;
  if (panoramaConfig.isBlankCanvas) return null;
  if (panoramaConfig.panoramaImage) return panoramaConfig.panoramaImage;
  const titleen = panoramaConfig.titleen;
  if (titleen && SCROLL_PANORAMA_PREVIEW[titleen]) {
    return SCROLL_PANORAMA_PREVIEW[titleen];
  }
  return null;
}

function totalStripWidth(strips) {
  return strips.reduce((sum, s) => sum + (s.srcWidth || 0), 0);
}

function globalCx(strips, stripIndex, spotX) {
  const total = totalStripWidth(strips);
  if (total <= 0) return spotX;
  let offset = 0;
  for (let i = 0; i < stripIndex; i += 1) {
    offset += strips[i].srcWidth || 0;
  }
  const w = strips[stripIndex]?.srcWidth || 0;
  const x = typeof spotX === "number" ? spotX : 50;
  const offsetPct = (100 * offset) / total;
  const fromStripRight = ((100 - x) * w) / total;
  return 100 - (offsetPct + fromStripRight);
}

/**
 * @param {{ spots?: { id?: string }[] }[]} strips
 * @param {string | undefined} spotId
 * @param {string[] | undefined} aliasSpotIds
 */
function findSpotInStrips(strips, spotId, aliasSpotIds) {
  if (!strips?.length) return null;
  if (spotId) {
    for (let i = 0; i < strips.length; i += 1) {
      const spot = strips[i].spots?.find((s) => s?.id === spotId);
      if (spot) {
        return {
          spot,
          stripIndex: i,
          scene: strips[i].scene,
        };
      }
    }
  }
  const aliasSet = new Set(aliasSpotIds || []);
  for (let i = 0; i < strips.length; i += 1) {
    const spot = strips[i].spots?.find((s) => s?.id && aliasSet.has(s.id));
    if (spot) {
      return {
        spot,
        stripIndex: i,
        scene: strips[i].scene,
      };
    }
  }
  return null;
}

export function MotifPanoramaFrame({
  motifVisuals,
  stripsByTitleen,
  locale,
  panoramaConfig,
  leftTitle,
  rightTitle,
  leftSubtitle,
  rightSubtitle,
}) {
  const isJa = locale !== "en";
  const isBlankCanvas = panoramaConfig?.isBlankCanvas === true;
  const imageSrc = panoramaImageFromConfig(motifVisuals, panoramaConfig);
  const titleen = panoramaConfig?.titleen;
  const strips =
    titleen && !isBlankCanvas ? stripsByTitleen?.[titleen] : null;
  const hasStrips = Array.isArray(strips) && strips.length > 0;

  const spotLayers = useMemo(() => {
    if (!panoramaConfig?.spots?.length) return [];
    if (isBlankCanvas) {
      return panoramaConfig.spots.map((spec, index) => ({
        num: index + 1,
        primary: spec.primary === true,
        cx: typeof spec.cx === "number" ? spec.cx : 50,
        cy: typeof spec.cy === "number" ? spec.cy : 50,
      }));
    }
    if (!titleen) return [];
    return panoramaConfig.spots
      .map((spec, index) => {
        const motif = getMotifByMasterId(spec.masterId);
        const hint = motifVisuals?.[spec.masterId]?.[titleen];
        let cx;
        let cy;
        let scene;

        if (hasStrips) {
          const found = findSpotInStrips(
            strips,
            hint?.spotId,
            motif?.aliasSpotIds
          );
          if (!found) return null;
          cx = globalCx(strips, found.stripIndex, found.spot.x);
          cy = typeof found.spot.y === "number" ? found.spot.y : 50;
          scene =
            typeof found.scene === "number"
              ? found.scene
              : hint?.scene;
        } else {
          const visual = getMotifVisual(motifVisuals, spec.masterId, titleen);
          if (!visual) return null;
          cx = visual.x;
          cy = visual.y;
          scene = visual.scene;
        }

        return {
          num: index + 1,
          primary: spec.primary === true,
          cx,
          cy,
        };
      })
      .filter(Boolean);
  }, [motifVisuals, panoramaConfig, titleen, strips, hasStrips, isBlankCanvas]);

  const svgMarkers = spotLayers.map((s) => ({
    num: s.num,
    cx: s.cx,
    cy: s.cy,
    primary: s.primary,
  }));

  const svgMarkersOverlay = (markers) =>
    markers.length > 0 ? (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        {markers.map((m) => {
          const primary = m.primary === true;
          const rx = primary ? 5.5 : 4.2;
          const ry = primary ? 4.2 : 3.2;
          const stroke = primary ? "#b91c1c" : "rgba(185, 28, 28, 0.55)";
          const fill = primary
            ? "rgba(220, 38, 38, 0.26)"
            : "rgba(220, 38, 38, 0.12)";
          return (
            <ellipse
              key={`${m.num}-${m.cx}-${m.cy}`}
              cx={m.cx}
              cy={m.cy}
              rx={rx}
              ry={ry}
              fill={fill}
              stroke={stroke}
              strokeWidth={primary ? 0.65 : 0.5}
            />
          );
        })}
      </svg>
    ) : null;

  const viewportBody = isBlankCanvas ? (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "4.5 / 1",
        minHeight: 220,
        background: "#f6f3ed",
        lineHeight: 1.5,
      }}
    >
      <p
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: "16px 24px",
          textAlign: "center",
          fontSize: 12,
          color: "#8a7b6a",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {isJa
          ? "現存する洛中洛外図に未収録の構図（比較用の示意のみ）"
          : "Composition not preserved in extant scrolls (schematic comparison only)"}
      </p>
      {svgMarkersOverlay(svgMarkers)}
    </div>
  ) : hasStrips ? (
    <div
      style={{
        position: "relative",
        width: "100%",
        lineHeight: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row-reverse",
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        {strips.map((strip, i) => {
          const flexW = strip.srcWidth || 1;
          return (
            <img
              key={strip.name || strip.linkId || i}
              src={strip.image}
              alt=""
              style={{
                flex: `${flexW} 1 0`,
                minWidth: 0,
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />
          );
        })}
      </div>
      {svgMarkersOverlay(svgMarkers)}
    </div>
  ) : imageSrc ? (
    <div
      style={{
        position: "relative",
        maxWidth: "100%",
        maxHeight: "min(52vh, 520px)",
        lineHeight: 0,
      }}
    >
      <img
        src={imageSrc}
        alt=""
        style={{
          display: "block",
          maxWidth: "100%",
          maxHeight: "min(52vh, 520px)",
          width: "auto",
          height: "auto",
          objectFit: "contain",
          objectPosition: "center",
        }}
      />
      {svgMarkersOverlay(svgMarkers)}
    </div>
  ) : (
    <div
      style={{
        minHeight: 120,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        color: "#6e6050",
        fontSize: 13,
      }}
    >
      {isJa ? "屏風全体のプレビューなし" : "No full-screen preview"}
    </div>
  );

  const wingCaptionBox = {
    flex: 1,
    minWidth: 0,
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid #d8d0c3",
    background: "rgba(248, 244, 236, 0.92)",
    boxShadow: "0 2px 8px rgba(31, 26, 20, 0.04)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          gap: 12,
        }}
      >
        <div style={wingCaptionBox}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#6e6050",
              marginBottom: 4,
            }}
          >
            {leftTitle}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#1f1a14",
              lineHeight: 1.4,
            }}
          >
            {leftSubtitle}
          </div>
        </div>
        <div style={wingCaptionBox}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#6e6050",
              marginBottom: 4,
            }}
          >
            {rightTitle}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#1f1a14",
              lineHeight: 1.4,
            }}
          >
            {rightSubtitle}
          </div>
        </div>
      </div>
      <div
        style={{
          width: "100%",
          borderRadius: 12,
          border: "1px solid #d8d0c3",
          background: "#faf7f2",
          boxShadow: "0 2px 12px rgba(31, 26, 20, 0.06)",
          overflow: "hidden",
          lineHeight: 0,
        }}
      >
        {viewportBody}
      </div>
    </div>
  );
}