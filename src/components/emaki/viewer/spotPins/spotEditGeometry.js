import { unmapStripCoordToPanorama } from "@/hooks/emaki/usePanoramaSpots";

export const RECT_BADGE_GAP = 6;

export function round1(v) {
  return Math.round(v * 10) / 10;
}

export function round2(v) {
  return Math.round(v * 100) / 100;
}

export function resolveCrossSliceTarget(rawX, currentSliceIndex) {
  if (!Number.isInteger(currentSliceIndex) || !Number.isFinite(rawX)) {
    return { x: rawX, targetSliceIndex: undefined, shiftX: 0 };
  }
  const sliceDelta = Math.floor(rawX / 100);
  if (sliceDelta === 0) {
    return { x: rawX, targetSliceIndex: undefined, shiftX: 0 };
  }
  const nextSliceIndex = Math.max(0, currentSliceIndex - sliceDelta);
  const actualDelta = currentSliceIndex - nextSliceIndex;
  const shiftX = -actualDelta * 100;
  const convertedX = round1(rawX + shiftX);
  return {
    x: convertedX,
    targetSliceIndex:
      nextSliceIndex !== currentSliceIndex ? nextSliceIndex : undefined,
    shiftX,
  };
}

/**
 * 左上角固定・右下ハンドルがポインタに 1:1 追従するリサイズ。
 */
export function computeBottomRightResize({
  currentX,
  currentY,
  currentW,
  currentH,
  mx,
  my,
  isPanorama,
}) {
  const minW = isPanorama ? 0.3 : 2;
  const minH = 1.5;
  const left = currentX - currentW / 2;
  const top = currentY - currentH / 2;
  const right = Math.max(left + minW, mx);
  const bottom = Math.max(top + minH, my);
  const nextW = round1(right - left);
  const nextH = round1(bottom - top);
  const nextX = round1(left + nextW / 2);
  const nextY = round1(top + nextH / 2);
  return { x: nextX, y: nextY, rect: { w: nextW, h: nextH } };
}

/** stripBounds あり旧パノラマのみ unmap。panels 系は strip % を round2 でそのまま保存 */
export function panoramaStorePatch(px, py, rectObj, spot) {
  if (spot?.stripBounds && Number.isFinite(spot.stripBounds.spanPct)) {
    const unmapped = unmapStripCoordToPanorama(
      { x: px, w: rectObj?.w },
      spot.stripBounds,
    );
    const fullX = Math.max(0, Math.min(100, round1(unmapped.x)));
    const fullY = Math.max(0, Math.min(100, round1(py)));
    const fullRect = rectObj
      ? {
          ...rectObj,
          ...(Number.isFinite(unmapped.w) ? { w: unmapped.w } : {}),
        }
      : undefined;
    return {
      x: fullX,
      y: fullY,
      ...(fullRect ? { rect: fullRect } : {}),
    };
  }
  const rect =
    rectObj != null
      ? { w: round2(rectObj.w), h: round2(rectObj.h) }
      : undefined;
  return {
    x: round2(px),
    y: round2(py),
    ...(rect ? { rect } : {}),
  };
}

/** ストア用 patch（パノラマ%）と表示用 dragOverrides（スライス strip %）を分離 */
export function dragOverrideFromPatch(isPanoramaTarget, px, py, saveRect, patch) {
  return isPanoramaTarget
    ? {
        x: px,
        y: py,
        rect: saveRect,
        ...(patch.badgePos ? { badgePos: patch.badgePos } : {}),
      }
    : patch;
}

export function isPanoramaSpot(spot, isPanoramaView) {
  return Boolean(isPanoramaView || spot.isPanorama || spot.quizQuestionId);
}

export function commonSpotMeta(spot, isPanoramaTarget) {
  return {
    ...(spot.quizQuestionId
      ? { quizQuestionId: spot.quizQuestionId, scale: spot.scale ?? 4.6 }
      : {}),
    ...(isPanoramaTarget && !spot.quizQuestionId ? { isPanorama: true } : {}),
  };
}

/**
 * 移動・リサイズ確定時の patch と dragOverrides を一括生成。
 */
export function buildSpotCommitPayload({
  spot,
  sliceIndex,
  isPanoramaView,
  px,
  py,
  saveRect,
  manualBadgePos,
  badgePosSnapshot,
  mode,
  /** "manual" = 十字ドラッグ時の手動バッジのみ / "ifPresent" = 枠移動・リサイズ */
  badgeCommit = "manual",
}) {
  const isPanoramaTarget = isPanoramaSpot(spot, isPanoramaView);
  const meta = commonSpotMeta(spot, isPanoramaTarget);
  const saveBadgePos = badgePosSnapshot;

  const attachBadge = (patch, resolvedShiftX = 0) => {
    if (!saveBadgePos) return patch;
    if (badgeCommit === "manual" && !manualBadgePos) return patch;
    if (isPanoramaTarget) {
      return { ...patch, badgePos: { x: saveBadgePos.x, y: saveBadgePos.y } };
    }
    return {
      ...patch,
      badgePos: {
        x: round1(saveBadgePos.x + resolvedShiftX),
        y: saveBadgePos.y,
      },
    };
  };

  if (mode === "resize" && !isPanoramaTarget) {
    const patch = attachBadge({ rect: saveRect });
    return {
      patch,
      dragOverride: {
        x: px,
        y: py,
        rect: saveRect,
        ...(patch.badgePos ? { badgePos: patch.badgePos } : {}),
      },
    };
  }

  let patch;
  let shiftX = 0;
  if (isPanoramaTarget) {
    patch = { ...panoramaStorePatch(px, py, saveRect, spot), ...meta };
  } else {
    const spotSliceIndex = Number.isInteger(spot.sliceIndex)
      ? spot.sliceIndex
      : sliceIndex;
    const resolved = resolveCrossSliceTarget(px, spotSliceIndex);
    shiftX = resolved.shiftX;
    patch = {
      x: resolved.x,
      y: py,
      rect: saveRect,
      ...(resolved.targetSliceIndex != null
        ? { targetSliceIndex: resolved.targetSliceIndex }
        : {}),
    };
  }

  patch = attachBadge(patch, shiftX);

  const dragOverride =
    isPanoramaTarget &&
    !(spot?.stripBounds && Number.isFinite(spot.stripBounds.spanPct))
      ? {
          x: round2(px),
          y: round2(py),
          rect: { w: round2(saveRect.w), h: round2(saveRect.h) },
          ...(patch.badgePos ? { badgePos: patch.badgePos } : {}),
        }
      : dragOverrideFromPatch(isPanoramaTarget, px, py, saveRect, patch);

  return { patch, dragOverride };
}