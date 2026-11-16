"use client";

export { RakuchuCompositionSection } from "./RakuchuCompositionSection";
export { RakuchuMotifSection } from "./RakuchuMotifSection";
export { MotifPanoramaFrame } from "./MotifPanoramaFrame";
export { MotifCropCard } from "./MotifCropCard";
export { SpotPinLabel } from "./SpotPinLabel";
export { buildNamedSpotPin, SPOT_KIND_THEME } from "./spotPinTheme";
export { getMotifVisual, wingSceneHref, getMotifByMasterId } from "./wingLinks";
export {
  FORM_TAB_IDS,
  FORM_PANORAMA,
  SCROLL_EDITIONS,
} from "./rakuchuScrollConstants";

import { RakuchuCompositionSection } from "./RakuchuCompositionSection";
import { RakuchuMotifSection } from "./RakuchuMotifSection";

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