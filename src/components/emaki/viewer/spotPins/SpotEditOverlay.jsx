/**
 * SpotEditOverlay — 開発時のみの名所編集用オーバーレイ（基準点・枠・新規配置 UI）。
 * SpotPins から isEditMode 専用の DOM／ポインタ処理を切り出し、見た目と z-index を維持する。
 */
import { useRef, useState } from "react";

import SpotPlaceNamePopup from "./SpotPlaceNamePopup";
import { BADGE_GAP, fallbackOffset } from "./spotPinsGeometry";
import {
  mergePendingUpdate,
  registerNewSpot,
  setPlaceModeEnabled,
} from "./spotPinsEditStore";

// =============================================================================
// 1. 定数・開発ログ（SpotPins 本体と同じ挙動）
// =============================================================================

const DEBUG_SPOT_ADD = false;

function logDebug(tag, ...args) {
  if (!DEBUG_SPOT_ADD) return;
  const time = performance.now().toFixed(1);
  console.log(
    `%c[${time}ms][${tag}]`,
    "color: #3b82f6; font-weight: bold;",
    ...args,
  );
}

const RECT_BADGE_GAP = 6;

function resolveCrossSliceTarget(rawX, currentSliceIndex) {
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
  const convertedX = Math.round((rawX + shiftX) * 10) / 10;
  return {
    x: convertedX,
    targetSliceIndex:
      nextSliceIndex !== currentSliceIndex ? nextSliceIndex : undefined,
    shiftX,
  };
}

// =============================================================================
// 2. SpotEditOverlay — 編集専用インタラクション層
// =============================================================================

/**
 * @param {object} props
 * 親 SpotPins から editSlug・座標系・ドラフト状態を受け取り、編集 UI のみ描画する。
 */
export default function SpotEditOverlay({
  editSlug,
  sliceIndex,
  sliceImageName,
  invZoom,
  placeDraft,
  setPlaceDraft,
  mergedSpots,
  dragOverrides,
  setDragOverrides,
  resizingSpotId: _resizingSpotId,
  setResizingSpotId,
  layerRef: _layerRef,
  masterSpots,
  placedSpotIds,
  spotLabel: _spotLabel,
  percentFromPointer,
  isPanorama = false,
}) {
  const anchorDraggingRef = useRef(null);
  const rectFrameDraggingRef = useRef(null);
  const resizingRef = useRef(null);
  const [, setDraggingSpotId] = useState(null);

  // ---------------------------------------------------------------------------
  // 3. 新規名所配置ポップアップ（placeDraft 確定 → registerNewSpot）
  // ---------------------------------------------------------------------------

  const placeNamePopup =
    placeDraft != null ? (
      <SpotPlaceNamePopup
        x={placeDraft.x}
        y={placeDraft.y}
        invZoom={invZoom}
        masterSpots={masterSpots}
        placedSpotIds={placedSpotIds}
        onCancel={() => setPlaceDraft(null)}
        onConfirm={(item) => {
          const { id, name, nameen } = item;
          logDebug("ADD_MASTER_SPOT", {
            slug: editSlug,
            sliceIndexProp: sliceIndex,
            sliceImageName,
            item,
          });
          if (!editSlug || !name || !sliceImageName) return;
          const spotId = id || `spot-${Date.now()}`;
          registerNewSpot(editSlug, {
            spotId,
            ...(Number.isInteger(sliceIndex) ? { sliceIndex } : {}),
            sliceImageName,
            name,
            nameen,
            x: placeDraft.x,
            y: placeDraft.y,
          });
          setPlaceDraft(null);
          setPlaceModeEnabled(false);
        }}
      />
    ) : null;

  // ---------------------------------------------------------------------------
  // 4. 各スポット — 基準点十字・破線コネクタ（バッジ非手動配置時）
  // ---------------------------------------------------------------------------

  const spotAnchorAndConnectors = (mergedSpots || []).map((spot) => {
    const currentX = dragOverrides[spot.id]?.x ?? spot.x;
    const currentY = dragOverrides[spot.id]?.y ?? spot.y;
    const currentRect =
      dragOverrides[spot.id]?.rect ?? spot.rect ?? { w: 24, h: 20 };
    const hasSpotRect = Boolean(dragOverrides[spot.id]?.rect ?? spot.rect);
    const currentBadgePos =
      dragOverrides[spot.id]?.badgePos ?? spot.badgePos ?? null;
    const useBadgePos = Boolean(currentBadgePos);
    const manualBadgePos = Boolean(
      dragOverrides[spot.id]?.badgePos ?? spot.badgePos,
    );

    let guideX = -BADGE_GAP;
    let guideY = -BADGE_GAP;
    if (hasSpotRect) {
      const rw = currentRect.w;
      const rh = currentRect.h;
      const flipX = currentX - rw / 2 < 10;
      const flipY = currentY - rh / 2 < 10;
      guideX = flipX ? RECT_BADGE_GAP : -RECT_BADGE_GAP;
      guideY = flipY ? RECT_BADGE_GAP : -RECT_BADGE_GAP;
    } else {
      const measured = fallbackOffset(currentX, currentY);
      guideX = measured.guideX ?? -BADGE_GAP;
      guideY = measured.guideY ?? -BADGE_GAP;
    }

    return (
      <div key={`spot-edit-anchor-${spot.id}`} style={{ display: "contents" }}>
        <div
          style={{
            position: "absolute",
            left: `${currentX}%`,
            top: `${currentY}%`,
          }}
        >
          <div
            aria-hidden="true"
            role="button"
            tabIndex={-1}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 20,
              height: 20,
              marginLeft: -10,
              marginTop: -10,
              cursor: "move",
              pointerEvents: "auto",
              touchAction: "none",
              zIndex: 50,
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              anchorDraggingRef.current = {
                spotId: spot.id,
                pointerId: e.pointerId,
                moved: false,
              };
              setDraggingSpotId(spot.id);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onPointerMove={(e) => {
              if (
                anchorDraggingRef.current?.spotId !== spot.id ||
                !anchorDraggingRef.current
              ) {
                return;
              }
              const pos = percentFromPointer(e.clientX, e.clientY);
              if (!pos) return;
              const px = Number.isFinite(pos.x) ? pos.x : pos.percentX;
              const py = Number.isFinite(pos.y) ? pos.y : pos.percentY;
              if (!Number.isFinite(px) || !Number.isFinite(py)) return;
              anchorDraggingRef.current.moved = true;
              setDragOverrides((prev) => ({
                ...prev,
                [spot.id]: {
                  x: px,
                  y: py,
                  rect:
                    prev[spot.id]?.rect ??
                    spot.rect ??
                    { w: 24, h: 20 },
                  ...(manualBadgePos
                    ? {
                        badgePos:
                          prev[spot.id]?.badgePos ?? spot.badgePos,
                      }
                    : null),
                },
              }));
            }}
            onPointerUp={(e) => {
              if (
                anchorDraggingRef.current?.spotId !== spot.id ||
                !anchorDraggingRef.current
              ) {
                return;
              }
              e.currentTarget.releasePointerCapture(e.pointerId);
              const moved = anchorDraggingRef.current.moved;
              anchorDraggingRef.current = null;
              setDraggingSpotId(null);
              if (!moved) return;
              const pos = percentFromPointer(e.clientX, e.clientY);
              if (!pos) return;
              const px = Number.isFinite(pos.x) ? pos.x : pos.percentX;
              const py = Number.isFinite(pos.y) ? pos.y : pos.percentY;
              if (!Number.isFinite(px) || !Number.isFinite(py)) return;
              const saveRect =
                dragOverrides[spot.id]?.rect ??
                spot.rect ??
                { w: 24, h: 20 };
              const isPanoramaTarget = Boolean(
                isPanorama || spot.isPanorama || spot.quizQuestionId,
              );
              const commonMeta = {
                ...(spot.quizQuestionId
                  ? { quizQuestionId: spot.quizQuestionId, scale: spot.scale ?? 4.6 }
                  : {}),
                ...(isPanoramaTarget && !spot.quizQuestionId
                  ? { isPanorama: true }
                  : {}),
              };
              let patch;
              if (isPanoramaTarget) {
                patch = {
                  x: Math.round(px * 10) / 10,
                  y: Math.round(py * 10) / 10,
                  rect: saveRect,
                  ...commonMeta,
                };
                if (manualBadgePos) {
                  const baseBadge =
                    dragOverrides[spot.id]?.badgePos ?? spot.badgePos;
                  patch.badgePos = { x: baseBadge.x, y: baseBadge.y };
                }
              } else {
                const spotSliceIndex = Number.isInteger(spot.sliceIndex)
                  ? spot.sliceIndex
                  : sliceIndex;
                const resolved = resolveCrossSliceTarget(px, spotSliceIndex);
                patch = {
                  x: resolved.x,
                  y: py,
                  rect: saveRect,
                  ...(resolved.targetSliceIndex != null
                    ? { targetSliceIndex: resolved.targetSliceIndex }
                    : {}),
                };
                if (manualBadgePos) {
                  const baseBadge =
                    dragOverrides[spot.id]?.badgePos ?? spot.badgePos;
                  patch.badgePos = {
                    x: Math.round((baseBadge.x + resolved.shiftX) * 10) / 10,
                    y: baseBadge.y,
                  };
                }
              }
              setDragOverrides((prev) => ({
                ...prev,
                [spot.id]: {
                  ...patch,
                },
              }));
              mergePendingUpdate(editSlug, spot.id, patch);
            }}
            onPointerCancel={(e) => {
              if (anchorDraggingRef.current?.spotId === spot.id) {
                e.currentTarget.releasePointerCapture(e.pointerId);
                anchorDraggingRef.current = null;
                setDraggingSpotId(null);
              }
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                width: 1,
                height: 20,
                background: "#e11",
                transform: "translateX(-50%)",
              }}
            />
            <span
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                height: 1,
                width: 20,
                background: "#e11",
                transform: "translateY(-50%)",
              }}
            />
          </div>
          {useBadgePos ? null : (
            <svg
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                overflow: "visible",
                pointerEvents: "none",
                zIndex: 1,
              }}
              width={1}
              height={1}
            >
              <line
                x1={0}
                y1={0}
                x2={guideX}
                y2={guideY}
                stroke="rgba(225, 17, 17, 0.55)"
                strokeWidth={1}
              />
            </svg>
          )}
        </div>
        {useBadgePos ? (
          <svg
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              overflow: "visible",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <line
              x1={`${currentX}%`}
              y1={`${currentY}%`}
              x2={`${currentBadgePos.x}%`}
              y2={`${currentBadgePos.y}%`}
              stroke="rgba(225, 17, 17, 0.55)"
              strokeWidth={1}
            />
          </svg>
        ) : null}
      </div>
    );
  });

  // ---------------------------------------------------------------------------
  // 5. リサイズ枠（破線 rect）と右下ドラッグハンドル
  // ---------------------------------------------------------------------------

  const resizeFrames = (mergedSpots || []).map((spot) => {
    const currentX = dragOverrides[spot.id]?.x ?? spot.x;
    const currentY = dragOverrides[spot.id]?.y ?? spot.y;
    const currentRect =
      dragOverrides[spot.id]?.rect ?? spot.rect ?? { w: 24, h: 20 };

    return (
      <div
        key={`spot-edit-rect-${spot.id}`}
        aria-hidden="true"
        role="button"
        tabIndex={-1}
        style={{
          position: "absolute",
          left: `${currentX}%`,
          top: `${currentY}%`,
          width: `${currentRect.w}%`,
          height: `${currentRect.h}%`,
          transform: "translate(-50%, -50%)",
          boxSizing: "border-box",
          pointerEvents: "auto",
          cursor: "move",
          touchAction: "none",
          zIndex: 40,
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          rectFrameDraggingRef.current = {
            spotId: spot.id,
            pointerId: e.pointerId,
            moved: false,
          };
          setDraggingSpotId(spot.id);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onPointerMove={(e) => {
          if (
            rectFrameDraggingRef.current?.spotId !== spot.id ||
            !rectFrameDraggingRef.current
          ) {
            return;
          }
          const pos = percentFromPointer(e.clientX, e.clientY);
          if (!pos) return;
          const px = Number.isFinite(pos.x) ? pos.x : pos.percentX;
          const py = Number.isFinite(pos.y) ? pos.y : pos.percentY;
          if (!Number.isFinite(px) || !Number.isFinite(py)) return;
          rectFrameDraggingRef.current.moved = true;
          const saveRect =
            dragOverrides[spot.id]?.rect ??
            spot.rect ??
            { w: 24, h: 20 };
          setDragOverrides((prev) => ({
            ...prev,
            [spot.id]: {
              x: px,
              y: py,
              rect: saveRect,
              ...(prev[spot.id]?.badgePos || spot.badgePos
                ? {
                    badgePos: prev[spot.id]?.badgePos ?? spot.badgePos,
                  }
                : null),
            },
          }));
        }}
        onPointerUp={(e) => {
          if (
            rectFrameDraggingRef.current?.spotId !== spot.id ||
            !rectFrameDraggingRef.current
          ) {
            return;
          }
          e.currentTarget.releasePointerCapture(e.pointerId);
          const moved = rectFrameDraggingRef.current.moved;
          rectFrameDraggingRef.current = null;
          setDraggingSpotId(null);
          if (!moved) return;
          const pos = percentFromPointer(e.clientX, e.clientY);
          if (!pos) return;
          const px = Number.isFinite(pos.x) ? pos.x : pos.percentX;
          const py = Number.isFinite(pos.y) ? pos.y : pos.percentY;
          if (!Number.isFinite(px) || !Number.isFinite(py)) return;
          const saveRect =
            dragOverrides[spot.id]?.rect ??
            spot.rect ??
            { w: 24, h: 20 };
          const isPanoramaTarget = Boolean(
            isPanorama || spot.isPanorama || spot.quizQuestionId,
          );
          const commonMeta = {
            ...(spot.quizQuestionId
              ? { quizQuestionId: spot.quizQuestionId, scale: spot.scale ?? 4.6 }
              : {}),
            ...(isPanoramaTarget && !spot.quizQuestionId
              ? { isPanorama: true }
              : {}),
          };
          let patch;
          const saveBadgePos =
            dragOverrides[spot.id]?.badgePos ?? spot.badgePos;
          if (isPanoramaTarget) {
            patch = {
              x: Math.round(px * 10) / 10,
              y: Math.round(py * 10) / 10,
              rect: saveRect,
              ...commonMeta,
            };
            if (saveBadgePos) {
              patch.badgePos = { x: saveBadgePos.x, y: saveBadgePos.y };
            }
          } else {
            const spotSliceIndex = Number.isInteger(spot.sliceIndex)
              ? spot.sliceIndex
              : sliceIndex;
            const resolved = resolveCrossSliceTarget(px, spotSliceIndex);
            patch = {
              x: resolved.x,
              y: py,
              rect: saveRect,
              ...(resolved.targetSliceIndex != null
                ? { targetSliceIndex: resolved.targetSliceIndex }
                : {}),
            };
            if (saveBadgePos) {
              patch.badgePos = {
                x: Math.round((saveBadgePos.x + resolved.shiftX) * 10) / 10,
                y: saveBadgePos.y,
              };
            }
          }
          setDragOverrides((prev) => ({
            ...prev,
            [spot.id]: patch,
          }));
          mergePendingUpdate(editSlug, spot.id, patch);
        }}
        onPointerCancel={(e) => {
          if (rectFrameDraggingRef.current?.spotId === spot.id) {
            e.currentTarget.releasePointerCapture(e.pointerId);
            rectFrameDraggingRef.current = null;
            setDraggingSpotId(null);
          }
        }}
      >
        <svg
          width="100%"
          height="100%"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="none"
            stroke="rgba(225, 17, 17, 0.75)"
            strokeWidth="1"
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div
          role="button"
          tabIndex={-1}
          style={{
            position: "absolute",
            right: -6,
            bottom: -6,
            width: 12,
            height: 12,
            background: "#e11",
            cursor: "nwse-resize",
            pointerEvents: "auto",
            touchAction: "none",
            zIndex: 60,
            transform: `scale(${invZoom})`,
            transformOrigin: "100% 100%",
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setResizingSpotId?.(spot.id);
            resizingRef.current = {
              spotId: spot.id,
              pointerId: e.pointerId,
              moved: false,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onPointerMove={(e) => {
            if (
              resizingRef.current?.spotId !== spot.id ||
              !resizingRef.current
            ) {
              return;
            }
            e.stopPropagation();
            const pos = percentFromPointer(e.clientX, e.clientY);
            if (!pos) return;
            const px = Number.isFinite(pos.x) ? pos.x : pos.percentX;
            const py = Number.isFinite(pos.y) ? pos.y : pos.percentY;
            if (!Number.isFinite(px) || !Number.isFinite(py)) return;
            resizingRef.current.moved = true;
            const mx = px;
            const my = py;
            const w = Math.max(
              4,
              Math.min(
                250,
                Math.round(Math.abs(mx - currentX) * 2 * 10) / 10,
              ),
            );
            const h = Math.max(
              4,
              Math.min(
                250,
                Math.round(Math.abs(my - currentY) * 2 * 10) / 10,
              ),
            );
            setDragOverrides((prev) => ({
              ...prev,
              [spot.id]: {
                x: prev[spot.id]?.x ?? spot.x,
                y: prev[spot.id]?.y ?? spot.y,
                rect: { w, h },
                ...(prev[spot.id]?.badgePos || spot.badgePos
                  ? {
                      badgePos:
                        prev[spot.id]?.badgePos ?? spot.badgePos,
                    }
                  : null),
              },
            }));
          }}
          onPointerUp={(e) => {
            if (
              resizingRef.current?.spotId !== spot.id ||
              !resizingRef.current
            ) {
              return;
            }
            e.currentTarget.releasePointerCapture(e.pointerId);
            const moved = resizingRef.current.moved;
            resizingRef.current = null;
            setResizingSpotId?.(null);
            if (!moved) return;
            const pos = percentFromPointer(e.clientX, e.clientY);
            if (!pos) return;
            const px = Number.isFinite(pos.x) ? pos.x : pos.percentX;
            const py = Number.isFinite(pos.y) ? pos.y : pos.percentY;
            if (!Number.isFinite(px) || !Number.isFinite(py)) return;
            const mx = px;
            const my = py;
            const finalW = Math.max(
              4,
              Math.min(
                250,
                Math.round(Math.abs(mx - currentX) * 2 * 10) / 10,
              ),
            );
            const finalH = Math.max(
              4,
              Math.min(
                250,
                Math.round(Math.abs(my - currentY) * 2 * 10) / 10,
              ),
            );
            const finalRect = { w: finalW, h: finalH };
            const saveBadgePos =
              dragOverrides[spot.id]?.badgePos ?? spot.badgePos;
            setDragOverrides((prev) => ({
              ...prev,
              [spot.id]: {
                x: prev[spot.id]?.x ?? spot.x,
                y: prev[spot.id]?.y ?? spot.y,
                rect: finalRect,
                ...(saveBadgePos ? { badgePos: saveBadgePos } : null),
              },
            }));
            mergePendingUpdate(editSlug, spot.id, {
              rect: finalRect,
              ...(saveBadgePos ? { badgePos: saveBadgePos } : null),
            });
          }}
          onPointerCancel={(e) => {
            if (resizingRef.current?.spotId === spot.id) {
              e.currentTarget.releasePointerCapture(e.pointerId);
              resizingRef.current = null;
              setResizingSpotId?.(null);
            }
          }}
        />
      </div>
    );
  });

  return (
  <>
    {placeNamePopup}
    {resizeFrames}
    {spotAnchorAndConnectors}
  </>
  );
}