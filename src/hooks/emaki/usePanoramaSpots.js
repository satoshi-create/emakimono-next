/**
 * Panorama spot list: merge data.spots with quiz targets, dedupe by spot id / quizQuestionId.
 */

export function buildPanoramaSpots(data, quizQuestions = []) {
  const byId = new Map();
  const quizQuestionIds = new Set();

  if (Array.isArray(data?.spots)) {
    for (const s of data.spots) {
      if (s?.id == null) continue;
      byId.set(s.id, { ...s, isPanorama: true });
      if (s.quizQuestionId != null) {
        quizQuestionIds.add(s.quizQuestionId);
      }
    }
  }

  const emakisList = Array.isArray(data?.emakis) ? data.emakis : [];
  const imageEntries = [];
  emakisList.forEach((item, emakiIndex) => {
    if (item && item.cat === "image") {
      const w =
        Number.isFinite(Number(item.srcWidth)) && Number(item.srcWidth) > 0
          ? Number(item.srcWidth)
          : 1;
      imageEntries.push({ emakiIndex, item, width: w });
    }
  });

  if (imageEntries.length > 0) {
    const totalFullWidth = imageEntries.reduce((sum, e) => sum + e.width, 0) || 1;
    let accFromRight = 0;

    for (const entry of imageEntries) {
      const spanPct = (entry.width / totalFullWidth) * 100;
      const rightPct = 100 - accFromRight;
      const leftPct = rightPct - spanPct;
      accFromRight += spanPct;

      const spots = entry.item.spots;
      if (!Array.isArray(spots)) continue;

      for (const s of spots) {
        if (s?.id == null || byId.has(s.id)) continue;
        const fullX = leftPct + ((Number(s.x) || 0) / 100) * spanPct;
        const fullRect = s.rect
          ? {
              ...s.rect,
              ...(Number.isFinite(Number(s.rect.w))
                ? { w: (Number(s.rect.w) / 100) * spanPct }
                : {}),
            }
          : s.rect;
        const fullBadgePos =
          s.badgePos && Number.isFinite(Number(s.badgePos.x))
            ? {
                ...s.badgePos,
                x: Math.round((leftPct + (Number(s.badgePos.x) / 100) * spanPct) * 10) / 10,
              }
            : s.badgePos;
        byId.set(s.id, {
          ...s,
          x: Math.round(fullX * 10) / 10,
          ...(fullRect ? { rect: fullRect } : {}),
          ...(fullBadgePos ? { badgePos: fullBadgePos } : {}),
          isPanorama: true,
        });
        if (s.quizQuestionId != null) {
          quizQuestionIds.add(s.quizQuestionId);
        }
      }
    }
  }

  if (Array.isArray(quizQuestions)) {
    for (const q of quizQuestions) {
      const target = q?.target;
      if (!target || typeof target.x !== "number" || typeof target.y !== "number") {
        continue;
      }

      const qSpotId = `quiz_target_${q.id}`;
      if (byId.has(qSpotId) || quizQuestionIds.has(q.id)) {
        continue;
      }

      const order = q.order ?? "";
      const label = q.jumpLabelJa || q.id;

      byId.set(qSpotId, {
        id: qSpotId,
        quizQuestionId: q.id,
        name: `【Q${order}】${label}`,
        x: target.x,
        y: target.y,
        rect: { w: target.w ?? 6, h: target.h ?? 12 },
        scale: target.scale ?? 4.6,
        hidden: true,
        isPanorama: true,
      });
      quizQuestionIds.add(q.id);
    }
  }

  const panoramaSpots = Array.from(byId.values());
  return {
    panoramaSpots,
    hasPanoramaSpots: panoramaSpots.length > 0,
  };
}

export function usePanoramaSpots(data, quizQuestions = []) {
  return buildPanoramaSpots(data, quizQuestions);
}

// =============================================================================
// 3. 純粋計算ロジック（Pure Logic）: 全巻パノラマ座標 ➔ ズーム帯（strip）写像
// =============================================================================
export function mapPanoramaSpotsToStrip(panoramaSpots, allEmakis, stripSlices) {
  if (!Array.isArray(panoramaSpots) || panoramaSpots.length === 0) return [];
  if (!Array.isArray(stripSlices) || stripSlices.length === 0) return panoramaSpots;

  const list = Array.isArray(allEmakis) ? allEmakis : [];
  const imageEntries = [];
  list.forEach((item, emakiIndex) => {
    if (item && item.cat === "image") {
      const w =
        Number.isFinite(Number(item.srcWidth)) && Number(item.srcWidth) > 0
          ? Number(item.srcWidth)
          : 1;
      imageEntries.push({ emakiIndex, src: item.src, width: w });
    }
  });

  if (imageEntries.length === 0) return panoramaSpots;

  const totalFullWidth = imageEntries.reduce((sum, e) => sum + e.width, 0) || 1;

  // row-reverse（右端 index 0 が 100%、左端が 0%）で元インデックス（emakiIndex）ごとの [leftPct, rightPct] を構築
  let accFromRight = 0;
  const boundsByEmakiIndex = new Map();
  const boundsBySrc = new Map();

  for (const entry of imageEntries) {
    const spanPct = (entry.width / totalFullWidth) * 100;
    const rightPct = 100 - accFromRight;
    const leftPct = rightPct - spanPct;
    const bounds = { leftPct, rightPct };
    boundsByEmakiIndex.set(entry.emakiIndex, bounds);
    if (entry.src) boundsBySrc.set(entry.src, bounds);
    accFromRight += spanPct;
  }

  let stripLeftPct = Infinity;
  let stripRightPct = -Infinity;

  for (const s of stripSlices) {
    const keyNum = typeof s.key === "number" ? s.key : Number(s.key);
    const bounds =
      (Number.isFinite(keyNum) && boundsByEmakiIndex.get(keyNum)) ||
      (s.src && boundsBySrc.get(s.src)) ||
      null;
    if (!bounds) continue;
    stripLeftPct = Math.min(stripLeftPct, bounds.leftPct);
    stripRightPct = Math.max(stripRightPct, bounds.rightPct);
  }

  if (!Number.isFinite(stripLeftPct) || !Number.isFinite(stripRightPct)) {
    return panoramaSpots;
  }

  const stripSpanPct = Math.max(0.001, stripRightPct - stripLeftPct);

  return panoramaSpots.map((spot) => ({
    ...spot,
    stripBounds: { leftPct: stripLeftPct, spanPct: stripSpanPct },
    x: ((spot.x - stripLeftPct) / stripSpanPct) * 100,
    rect: spot.rect
      ? {
          ...spot.rect,
          w: spot.rect?.w ? (spot.rect.w / stripSpanPct) * 100 : spot.rect.w,
        }
      : spot.rect,
    badgePos:
      spot.badgePos && Number.isFinite(Number(spot.badgePos.x))
        ? {
            ...spot.badgePos,
            x: ((Number(spot.badgePos.x) - stripLeftPct) / stripSpanPct) * 100,
          }
        : spot.badgePos,
  }));
}

export function unmapStripCoordToPanorama({ x, w }, stripBounds) {
  if (!stripBounds || !Number.isFinite(stripBounds.spanPct)) {
    return { x, w };
  }
  const { leftPct, spanPct } = stripBounds;
  const fullX = leftPct + (x / 100) * spanPct;
  const fullW = Number.isFinite(w) ? (w / 100) * spanPct : w;
  return {
    x: Math.max(0, Math.min(100, Math.round(fullX * 10) / 10)),
    w: Number.isFinite(fullW) ? Math.max(0.5, Math.min(100, Math.round(fullW * 10) / 10)) : fullW,
  };
}