import { RAKUCHU_SPOT_MASTERS } from "@/data/rakuchu-rakugai/rakuchuMotifMaster";

export function getMotifVisual(motifVisuals, masterId, titleen) {
  const entry = motifVisuals?.[masterId]?.[titleen];
  if (!entry?.image) return null;
  const x = typeof entry.x === "number" ? entry.x : 50;
  const y = typeof entry.y === "number" ? entry.y : 50;
  const scene =
    typeof entry.scene === "number"
      ? entry.scene
      : typeof entry.sceneIndex === "number"
        ? entry.sceneIndex
        : undefined;

  return {
    image: entry.image,
    x,
    y,
    scene,
  };
}

export function wingSceneHref(wingSpec, visual) {
  if (!wingSpec?.titleen) return undefined;
  const scene = visual?.scene;
  return scene != null ? `/${wingSpec.titleen}?scene=${scene}` : `/${wingSpec.titleen}`;
}

export function getMotifByMasterId(masterId) {
  return RAKUCHU_SPOT_MASTERS.find((m) => m.masterId === masterId) || null;
}