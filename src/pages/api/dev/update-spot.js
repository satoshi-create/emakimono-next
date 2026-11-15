import fs from "fs";
import path from "path";

function clampAndRound(val) {
  const n = Number(val);
  if (Number.isNaN(n)) return null;
  const clamped = Math.min(100, Math.max(0, n));
  return Math.round(clamped * 10) / 10;
}

function clampAndRoundBadge(val) {
  const n = Number(val);
  if (Number.isNaN(n)) return null;
  const clamped = Math.min(250, Math.max(-150, n));
  return Math.round(clamped * 10) / 10;
}

export default function handler(req, res) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Development only" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    slug,
    updates,
    spotId,
    sliceIndex,
    x,
    y,
    rect,
    badgePos,
    name,
    nameen,
    isNew,
  } = req.body ?? {};

  const cleanSlug = decodeURIComponent(String(req.body.slug || "")).trim().replace(/^\/+|\/+$/g, "");
  if (!cleanSlug || !/^[a-zA-Z0-9_-]+$/.test(cleanSlug)) {
    return res.status(400).json({ error: "Invalid slug" });
  }

  const items = Array.isArray(updates)
    ? updates
    : [
        {
          spotId,
          sliceIndex,
          x,
          y,
          rect,
          badgePos,
          name,
          nameen,
          isNew,
        },
      ];

  if (items.length === 0) {
    return res.status(400).json({ error: "No updates" });
  }

  function findSpot(emakis, spotId) {
    for (const emaki of emakis) {
      if (!Array.isArray(emaki?.spots)) continue;
      const found = emaki.spots.find((s) => s && s.id === spotId);
      if (found) return found;
    }
    return null;
  }

  const prepared = [];
  for (const item of items) {
    const id = item?.spotId;
    if (id == null || id === "") {
      return res.status(400).json({ error: "Invalid spotId" });
    }

    const roundedX = clampAndRound(item.x);
    const roundedY = clampAndRound(item.y);
    if (roundedX === null || roundedY === null) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    let roundedRect = null;
    const itemRect = item.rect;
    if (
      itemRect &&
      typeof itemRect === "object" &&
      Number.isFinite(itemRect.w) &&
      Number.isFinite(itemRect.h)
    ) {
      const w =
        Math.round(Math.min(100, Math.max(1, itemRect.w)) * 10) / 10;
      const h =
        Math.round(Math.min(100, Math.max(1, itemRect.h)) * 10) / 10;
      roundedRect = { w, h };
    }

    let roundedBadgePos = null;
    const badgePos = item.badgePos;
    if (
      badgePos &&
      typeof badgePos === "object" &&
      Number.isFinite(badgePos.x) &&
      Number.isFinite(badgePos.y)
    ) {
      const bx = clampAndRoundBadge(badgePos.x);
      const by = clampAndRoundBadge(badgePos.y);
      if (bx !== null && by !== null) {
        roundedBadgePos = { x: bx, y: by };
      }
    }

    const sliceIndexRaw = item?.sliceIndex;
    const normalizedSliceIndex =
      sliceIndexRaw !== undefined &&
      sliceIndexRaw !== null &&
      sliceIndexRaw !== "" &&
      !Number.isNaN(Number(sliceIndexRaw))
        ? Number(sliceIndexRaw)
        : sliceIndexRaw;

    prepared.push({
      spotId: id,
      sliceIndex: normalizedSliceIndex,
      roundedX,
      roundedY,
      roundedRect,
      roundedBadgePos,
      name: item?.name,
      nameen: item?.nameen,
      isNew: item?.isNew === true,
    });
  }

  const scrollsDir = path.join(process.cwd(), "src/data/scroll-metadata/scrolls");
  const candidateFiles = [
    path.join(scrollsDir, `${cleanSlug}.json`),
    path.join(scrollsDir, `${cleanSlug.replace(/-/g, "_")}.json`),
    path.join(scrollsDir, `${cleanSlug.replace(/_/g, "-")}.json`),
  ];
  const filePath = candidateFiles.find((p) => fs.existsSync(p));

  if (!filePath) {
    return res.status(404).json({ error: "Scroll metadata not found", slug: cleanSlug });
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return res.status(500).json({ error: "Failed to parse scroll metadata" });
  }

  const emakis = data.emakis;
  if (!Array.isArray(emakis)) {
    return res.status(400).json({ error: "Invalid metadata" });
  }

  for (const p of prepared) {
    const spot = findSpot(emakis, p.spotId);
    if (spot) {
      spot.x = p.roundedX;
      spot.y = p.roundedY;
      if (p.roundedRect) {
        spot.rect = p.roundedRect;
      }
      if (p.roundedBadgePos) {
        spot.badgePos = p.roundedBadgePos;
      }
      if (p.name != null && p.name !== "") {
        spot.name = p.name;
      }
      if (p.nameen != null && p.nameen !== "") {
        spot.nameen = p.nameen;
      }
      continue;
    }

    const sliceIdx = p.sliceIndex;
    const imageSlices = emakis.filter((item) => item?.cat === "image");
    if (Number.isInteger(sliceIdx) && imageSlices[sliceIdx]) {
      const slice = imageSlices[sliceIdx];
      if (!Array.isArray(slice.spots)) {
        slice.spots = [];
      }
      slice.spots.push({
        id: p.spotId,
        name: p.name || p.spotId,
        ...(p.nameen ? { nameen: p.nameen } : {}),
        x: p.roundedX,
        y: p.roundedY,
        ...(p.roundedRect ? { rect: p.roundedRect } : {}),
        ...(p.roundedBadgePos ? { badgePos: p.roundedBadgePos } : {}),
      });
      continue;
    }

    return res.status(404).json({ error: "Spot not found", spotId: p.spotId });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");

  return res.status(200).json({
    ok: true,
    slug: cleanSlug,
    updatedCount: items.length,
  });
}