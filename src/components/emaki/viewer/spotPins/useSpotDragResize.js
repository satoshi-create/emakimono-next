import { useCallback, useRef, useState } from "react";

import { mergePendingUpdate } from "./spotPinsEditStore";
import {
  buildSpotCommitPayload,
  computeBottomRightResize,
  isPanoramaSpot,
} from "./spotEditGeometry";

const DEFAULT_RECT = { w: 24, h: 20 };

function readPointerPercent(percentFromPointer, clientX, clientY) {
  const pos = percentFromPointer(clientX, clientY);
  if (!pos) return null;
  const px = Number.isFinite(pos.x) ? pos.x : pos.percentX;
  const py = Number.isFinite(pos.y) ? pos.y : pos.percentY;
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
  return { px, py };
}

/**
 * 名所編集の移動・リサイズ用ポインタ操作（保存は commitSpotTransform に集約）。
 */
export function useSpotDragResize({
  editSlug,
  sliceIndex,
  isPanorama,
  percentFromPointer,
  dragOverrides,
  setDragOverrides,
  setResizingSpotId,
}) {
  const anchorDraggingRef = useRef(null);
  const rectFrameDraggingRef = useRef(null);
  const resizingRef = useRef(null);
  const [, setDraggingSpotId] = useState(null);

  const spotRect = useCallback(
    (spot) =>
      dragOverrides[spot.id]?.rect ?? spot.rect ?? DEFAULT_RECT,
    [dragOverrides],
  );

  const spotXY = useCallback(
    (spot) => ({
      x: dragOverrides[spot.id]?.x ?? spot.x,
      y: dragOverrides[spot.id]?.y ?? spot.y,
    }),
    [dragOverrides],
  );

  const commitSpotTransform = useCallback(
    (spot, { px, py, saveRect, mode, manualBadgePos, badgeCommit }) => {
      const badgePosSnapshot =
        dragOverrides[spot.id]?.badgePos ?? spot.badgePos ?? null;
      const { patch, dragOverride } = buildSpotCommitPayload({
        spot,
        sliceIndex,
        isPanoramaView: isPanorama,
        px,
        py,
        saveRect,
        manualBadgePos: Boolean(manualBadgePos),
        badgePosSnapshot,
        mode,
        badgeCommit: badgeCommit ?? "manual",
      });
      setDragOverrides((prev) => ({
        ...prev,
        [spot.id]: {
          ...prev[spot.id],
          ...dragOverride,
        },
      }));
      mergePendingUpdate(editSlug, spot.id, patch);
    },
    [dragOverrides, editSlug, isPanorama, setDragOverrides, sliceIndex],
  );

  const releaseDrag = useCallback(
    (ref, e, onEnd) => {
      if (!ref.current) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      const moved = ref.current.moved;
      const spotId = ref.current.spotId;
      ref.current = null;
      setDraggingSpotId(null);
      if (moved) onEnd();
      return { moved, spotId };
    },
    [],
  );

  const captureMoveDrag = useCallback(
    (ref, spot, e, apply) => {
      if (ref.current?.spotId !== spot.id || !ref.current) return;
      const p = readPointerPercent(percentFromPointer, e.clientX, e.clientY);
      if (!p) return;
      const grab = ref.current;
      const px = p.px - (grab.offsetX ?? 0);
      const py = p.py - (grab.offsetY ?? 0);
      grab.moved = true;
      apply(px, py);
    },
    [percentFromPointer],
  );

  const startMoveDrag = useCallback(
    (ref, spot, e) => {
      const p = readPointerPercent(percentFromPointer, e.clientX, e.clientY);
      const { x: startX, y: startY } = spotXY(spot);
      ref.current = {
        spotId: spot.id,
        pointerId: e.pointerId,
        moved: false,
        offsetX: p ? p.px - startX : 0,
        offsetY: p ? p.py - startY : 0,
      };
      setDraggingSpotId(spot.id);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [percentFromPointer, spotXY],
  );

  const cancelDrag = useCallback((ref, spot, e) => {
    if (ref.current?.spotId === spot.id) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      ref.current = null;
      setDraggingSpotId(null);
    }
  }, []);

  const makeAnchorHandlers = useCallback(
    (spot, { manualBadgePos }) => ({
      onPointerDown: (e) => {
        e.stopPropagation();
        e.preventDefault();
        startMoveDrag(anchorDraggingRef, spot, e);
      },
      onPointerMove: (e) => {
        captureMoveDrag(anchorDraggingRef, spot, e, (px, py) => {
          const saveRect = spotRect(spot);
          setDragOverrides((prev) => ({
            ...prev,
            [spot.id]: {
              x: px,
              y: py,
              rect: saveRect,
              ...(manualBadgePos
                ? { badgePos: prev[spot.id]?.badgePos ?? spot.badgePos }
                : null),
            },
          }));
        });
      },
      onPointerUp: (e) => {
        if (anchorDraggingRef.current?.spotId !== spot.id) return;
        const offsets = {
          offsetX: anchorDraggingRef.current.offsetX,
          offsetY: anchorDraggingRef.current.offsetY,
        };
        releaseDrag(anchorDraggingRef, e, () => {
          const p = readPointerPercent(
            percentFromPointer,
            e.clientX,
            e.clientY,
          );
          if (!p) return;
          commitSpotTransform(spot, {
            px: p.px - (offsets.offsetX ?? 0),
            py: p.py - (offsets.offsetY ?? 0),
            saveRect: spotRect(spot),
            mode: "move",
            manualBadgePos,
            badgeCommit: "manual",
          });
        });
      },
      onPointerCancel: (e) => cancelDrag(anchorDraggingRef, spot, e),
    }),
    [
      cancelDrag,
      captureMoveDrag,
      commitSpotTransform,
      percentFromPointer,
      releaseDrag,
      setDragOverrides,
      spotRect,
      startMoveDrag,
    ],
  );

  const makeRectFrameHandlers = useCallback(
    (spot) => ({
      onPointerDown: (e) => {
        e.stopPropagation();
        e.preventDefault();
        startMoveDrag(rectFrameDraggingRef, spot, e);
      },
      onPointerMove: (e) => {
        captureMoveDrag(rectFrameDraggingRef, spot, e, (px, py) => {
          const saveRect = spotRect(spot);
          const badge = dragOverrides[spot.id]?.badgePos ?? spot.badgePos;
          setDragOverrides((prev) => ({
            ...prev,
            [spot.id]: {
              x: px,
              y: py,
              rect: saveRect,
              ...(badge ? { badgePos: badge } : null),
            },
          }));
        });
      },
      onPointerUp: (e) => {
        if (rectFrameDraggingRef.current?.spotId !== spot.id) return;
        const offsets = {
          offsetX: rectFrameDraggingRef.current.offsetX,
          offsetY: rectFrameDraggingRef.current.offsetY,
        };
        releaseDrag(rectFrameDraggingRef, e, () => {
          const p = readPointerPercent(
            percentFromPointer,
            e.clientX,
            e.clientY,
          );
          if (!p) return;
          const px = p.px - (offsets.offsetX ?? 0);
          const py = p.py - (offsets.offsetY ?? 0);
          commitSpotTransform(spot, {
            px,
            py,
            saveRect: spotRect(spot),
            mode: "move",
            manualBadgePos: Boolean(
              dragOverrides[spot.id]?.badgePos ?? spot.badgePos,
            ),
            badgeCommit: "ifPresent",
          });
        });
      },
      onPointerCancel: (e) => cancelDrag(rectFrameDraggingRef, spot, e),
    }),
    [
      cancelDrag,
      captureMoveDrag,
      commitSpotTransform,
      dragOverrides,
      percentFromPointer,
      releaseDrag,
      setDragOverrides,
      spotRect,
      startMoveDrag,
    ],
  );

  const makeResizeHandlers = useCallback(
    (spot, layout) => {
      const pano = isPanoramaSpot(spot, isPanorama);
      return {
        onPointerDown: (e) => {
          e.stopPropagation();
          e.preventDefault();
          setResizingSpotId?.(spot.id);
          resizingRef.current = {
            spotId: spot.id,
            pointerId: e.pointerId,
            moved: false,
            startX: layout.currentX,
            startY: layout.currentY,
            startW: layout.currentRect.w,
            startH: layout.currentRect.h,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        },
        onPointerMove: (e) => {
          if (resizingRef.current?.spotId !== spot.id || !resizingRef.current) {
            return;
          }
          e.stopPropagation();
          const p = readPointerPercent(
            percentFromPointer,
            e.clientX,
            e.clientY,
          );
          if (!p) return;
          resizingRef.current.moved = true;
          const start = resizingRef.current;
          const next = computeBottomRightResize({
            currentX: start.startX,
            currentY: start.startY,
            currentW: start.startW,
            currentH: start.startH,
            mx: p.px,
            my: p.py,
            isPanorama: pano,
          });
          const badge = dragOverrides[spot.id]?.badgePos ?? spot.badgePos;
          setDragOverrides((prev) => ({
            ...prev,
            [spot.id]: {
              x: next.x,
              y: next.y,
              rect: next.rect,
              ...(badge ? { badgePos: badge } : null),
            },
          }));
        },
        onPointerUp: (e) => {
          if (resizingRef.current?.spotId !== spot.id) return;
          e.currentTarget.releasePointerCapture(e.pointerId);
          const moved = resizingRef.current.moved;
          const start = resizingRef.current;
          resizingRef.current = null;
          setResizingSpotId?.(null);
          if (!moved) return;
          const p = readPointerPercent(
            percentFromPointer,
            e.clientX,
            e.clientY,
          );
          if (!p) return;
          const next = computeBottomRightResize({
            currentX: start.startX,
            currentY: start.startY,
            currentW: start.startW,
            currentH: start.startH,
            mx: p.px,
            my: p.py,
            isPanorama: pano,
          });
          commitSpotTransform(spot, {
            px: next.x,
            py: next.y,
            saveRect: next.rect,
            mode: "resize",
            manualBadgePos: Boolean(
              dragOverrides[spot.id]?.badgePos ?? spot.badgePos,
            ),
            badgeCommit: "ifPresent",
          });
        },
        onPointerCancel: (e) => {
          if (resizingRef.current?.spotId === spot.id) {
            e.currentTarget.releasePointerCapture(e.pointerId);
            resizingRef.current = null;
            setResizingSpotId?.(null);
          }
        },
      };
    },
    [
      commitSpotTransform,
      dragOverrides,
      isPanorama,
      percentFromPointer,
      setDragOverrides,
      setResizingSpotId,
    ],
  );

  return {
    makeAnchorHandlers,
    makeRectFrameHandlers,
    makeResizeHandlers,
    spotRect,
    spotXY,
  };
}