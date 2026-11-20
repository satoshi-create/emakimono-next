import {
  readScrollMetadata,
  writeScrollMetadata,
} from "@/libs/scroll-pipeline/scrollMetadataFs";

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
    isPanorama,
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
          isPanorama,
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

  function removeSpotFromEmakis(emakisList, id) {
    for (const item of emakisList) {
      if (item?.cat !== "image" || !Array.isArray(item.spots)) continue;
      item.spots = item.spots.filter((s) => s && s.id !== id);
    }
  }

  const prepared = [];
  for (const item of items) {
    const id = item?.spotId;
    if (id == null || id === "") {
      return res.status(400).json({ error: "Invalid spotId" });
    }

    const isDeleted = item?.deleted === true;
    let roundedX;
    let roundedY;
    if (!isDeleted) {
      roundedX = clampAndRound(item.x);
      roundedY = clampAndRound(item.y);
      if (roundedX === null || roundedY === null) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
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

    const targetSliceIndexRaw = item?.targetSliceIndex;
    const targetSliceIndex =
      targetSliceIndexRaw != null &&
      targetSliceIndexRaw !== "" &&
      Number.isInteger(Number(targetSliceIndexRaw))
        ? Number(targetSliceIndexRaw)
        : undefined;

    prepared.push({
      spotId: id,
      sliceIndex: normalizedSliceIndex,
      sliceImageName: item?.sliceImageName,
      targetSliceIndex,
      roundedX,
      roundedY,
      roundedRect,
      roundedBadgePos,
      name: item?.name,
      nameen: item?.nameen,
      isNew: item?.isNew === true,
      deleted: isDeleted,
      isPanorama: item?.isPanorama === true,
    });
  }

  let filePath;
  let data;
  try {
    const loaded = readScrollMetadata(cleanSlug);
    if (!loaded) {
      return res.status(404).json({ error: "Scroll metadata not found", slug: cleanSlug });
    }
    filePath = loaded.filePath;
    data = loaded.data;
  } catch {
    return res.status(500).json({ error: "Failed to parse scroll metadata" });
  }

  const emakis = data.emakis;
  if (!Array.isArray(emakis)) {
    return res.status(400).json({ error: "Invalid metadata" });
  }

  for (const p of prepared) {
    const usePanorama = Array.isArray(data.spots) || p.isPanorama === true;
    if (usePanorama) {
      data.spots = Array.isArray(data.spots) ? data.spots : [];
      const panoIdx = data.spots.findIndex((s) => s && s.id === p.spotId);

      if (p.deleted === true) {
        if (panoIdx !== -1) {
          data.spots.splice(panoIdx, 1);
        }
        removeSpotFromEmakis(emakis, p.spotId);
        continue;
      }

      if (panoIdx !== -1) {
        const panoSpot = data.spots[panoIdx];
        panoSpot.x = p.roundedX;
        panoSpot.y = p.roundedY;
        if (p.roundedRect) {
          panoSpot.rect = p.roundedRect;
        }
        if (p.roundedBadgePos) {
          panoSpot.badgePos = p.roundedBadgePos;
        }
        if (p.name != null && p.name !== "") {
          panoSpot.name = p.name;
        }
        if (p.nameen != null && p.nameen !== "") {
          panoSpot.nameen = p.nameen;
        }
        continue;
      }

      data.spots.push({
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

    if (p.deleted === true) {
      const sliceIdx = p.sliceIndex;
      const sliceImageName = p.sliceImageName;
      const imageSlices = emakis.filter((item) => item?.cat === "image");
      const hasSliceImageName =
        typeof sliceImageName === "string" && sliceImageName !== "";
      const hasSliceIndex =
        Number.isInteger(sliceIdx) && imageSlices[sliceIdx];
      let slice = null;
      if (hasSliceImageName) {
        const normalizedSliceKey = sliceImageName.replace(/__+/g, "_");
        const trailingSliceKey = sliceImageName.match(/(\d+_\d+__\d+)$/)?.[1];
        const sliceMatchKeys = [
          sliceImageName,
          normalizedSliceKey,
          trailingSliceKey,
        ].filter((key) => typeof key === "string" && key !== "");
        slice = emakis.find((item) => {
          if (item?.cat !== "image") return false;
          return sliceMatchKeys.some(
            (key) =>
              (item.name && item.name.includes(key)) ||
              (item.src && item.src.includes(key))
          );
        });
      }
      if (!slice && hasSliceIndex) {
        slice = imageSlices[sliceIdx];
      }
      if (
        !slice &&
        !hasSliceImageName &&
        !Number.isInteger(sliceIdx)
      ) {
        slice = emakis.find(
          (item) =>
            item?.cat === "image" &&
            Array.isArray(item.spots) &&
            item.spots.some((s) => s && s.id === p.spotId)
        );
      }
      if (slice && Array.isArray(slice.spots)) {
        slice.spots = slice.spots.filter((s) => s && s.id !== p.spotId);
        continue;
      }
      return res.status(404).json({ error: "Spot not found", spotId: p.spotId });
    }

    const spot = findSpot(emakis, p.spotId);
    if (spot) {
      const imageSlices = emakis.filter((item) => item?.cat === "image");
      let currentSlice = null;
      let currentIdx = -1;
      for (const slice of imageSlices) {
        if (!Array.isArray(slice.spots)) continue;
        const idx = slice.spots.findIndex((s) => s && s.id === p.spotId);
        if (idx !== -1) {
          currentSlice = slice;
          currentIdx = idx;
          break;
        }
      }
      const tsi = p.targetSliceIndex;
      if (
        Number.isInteger(tsi) &&
        imageSlices[tsi] &&
        imageSlices[tsi] !== currentSlice &&
        currentSlice &&
        currentIdx !== -1
      ) {
        currentSlice.spots.splice(currentIdx, 1);
        const targetSlice = imageSlices[tsi];
        targetSlice.spots = Array.isArray(targetSlice.spots)
          ? targetSlice.spots
          : [];
        targetSlice.spots.push(spot);
      }
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
    const sliceImageName = p.sliceImageName;
    const imageSlices = emakis.filter((item) => item?.cat === "image");
    let slice = null;
    if (typeof sliceImageName === "string" && sliceImageName !== "") {
      const normalizedSliceKey = sliceImageName.replace(/__+/g, "_");
      const trailingSliceKey = sliceImageName.match(/(\d+_\d+__\d+)$/)?.[1];
      const sliceMatchKeys = [
        sliceImageName,
        normalizedSliceKey,
        trailingSliceKey,
      ].filter((key) => typeof key === "string" && key !== "");
      slice = emakis.find((item) => {
        if (item?.cat !== "image") return false;
        return sliceMatchKeys.some(
          (key) =>
            (item.name && item.name.includes(key)) ||
            (item.src && item.src.includes(key))
        );
      });
    }
    if (!slice && Number.isInteger(sliceIdx) && imageSlices[sliceIdx]) {
      slice = imageSlices[sliceIdx];
    }
    if (slice) {
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

  writeScrollMetadata(filePath, data);

  return res.status(200).json({
    ok: true,
    slug: cleanSlug,
    updatedCount: items.length,
  });
}