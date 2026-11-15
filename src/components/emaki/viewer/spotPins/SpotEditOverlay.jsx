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
  setResizingSpotId: _setResizingSpotId,
  layerRef: _layerRef,
  masterSpots,
  placedSpotIds,
  spotLabel: _spotLabel,
  percentFromPointer,
}) {
  const anchorDraggingRef = useRef(null);
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
              zIndex: 3,
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              anchorDraggingRef.current = {
                spotId: spot.id,
                pointerId: e.pointerId,
                moved: false,
              };
              setDraggingSpotId(spot.id);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (
                anchorDraggingRef.current?.spotId !== spot.id ||
                !anchorDraggingRef.current
              ) {
                return;
              }
              const pos = percentFromPointer(e);
              if (!pos) return;
              anchorDraggingRef.current.moved = true;
              setDragOverrides((prev) => ({
                ...prev,
                [spot.id]: {
                  x: pos.x,
                  y: pos.y,
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
              const pos = percentFromPointer(e);
              if (!pos) return;
              const saveRect =
                dragOverrides[spot.id]?.rect ??
                spot.rect ??
                { w: 24, h: 20 };
              const patch = {
                x: pos.x,
                y: pos.y,
                rect: saveRect,
              };
              if (manualBadgePos) {
                patch.badgePos =
                  dragOverrides[spot.id]?.badgePos ?? spot.badgePos;
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
        style={{
          position: "absolute",
          left: `${currentX}%`,
          top: `${currentY}%`,
          width: `${currentRect.w}%`,
          height: `${currentRect.h}%`,
          transform: "translate(-50%, -50%)",
          border: "1px dashed rgba(225, 17, 17, 0.7)",
          boxSizing: "border-box",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <div
          role="presentation"
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
            transform: `scale(${invZoom})`,
            transformOrigin: "100% 100%",
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            resizingRef.current = {
              spotId: spot.id,
              pointerId: e.pointerId,
              moved: false,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (
              resizingRef.current?.spotId !== spot.id ||
              !resizingRef.current
            ) {
              return;
            }
            const pos = percentFromPointer(e);
            if (!pos) return;
            resizingRef.current.moved = true;
            const mx = pos.x;
            const my = pos.y;
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
            if (!moved) return;
            const pos = percentFromPointer(e);
            if (!pos) return;
            const mx = pos.x;
            const my = pos.y;
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
              x: currentX,
              y: currentY,
              rect: finalRect,
              ...(saveBadgePos ? { badgePos: saveBadgePos } : null),
            });
          }}
          onPointerCancel={(e) => {
            if (resizingRef.current?.spotId === spot.id) {
              e.currentTarget.releasePointerCapture(e.pointerId);
              resizingRef.current = null;
            }
          }}
        />
      </div>
    );
  });

  return (
  <>
    {placeNamePopup}
    {spotAnchorAndConnectors}
    {resizeFrames}
  </>
  );
}