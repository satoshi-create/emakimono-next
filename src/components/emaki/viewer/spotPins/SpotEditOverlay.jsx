/**
 * SpotEditOverlay — 開発時のみの名所編集用オーバーレイ（基準点・枠・新規配置 UI）。
 */
import SpotPlaceNamePopup from "./SpotPlaceNamePopup";
import { BADGE_GAP, fallbackOffset } from "./spotPinsGeometry";
import { registerNewSpot, setPlaceModeEnabled } from "./spotPinsEditStore";
import { RECT_BADGE_GAP } from "./spotEditGeometry";
import { useSpotDragResize } from "./useSpotDragResize";

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
  imageSliceCount,
}) {
  const {
    makeAnchorHandlers,
    makeRectFrameHandlers,
    makeResizeHandlers,
  } = useSpotDragResize({
    editSlug,
    sliceIndex,
    isPanorama,
    percentFromPointer,
    dragOverrides,
    setDragOverrides,
    setResizingSpotId,
  });

  const stopBubble = {
    onMouseDown: (e) => e.stopPropagation(),
    onTouchStart: (e) => e.stopPropagation(),
  };

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
          const { id, name, nameen, description } = item;
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
            ...(description ? { description } : {}),
            x: placeDraft.x,
            y: placeDraft.y,
            isPanorama,
            imageSliceCount,
          });
          setPlaceDraft(null);
          setPlaceModeEnabled(false);
        }}
      />
    ) : null;

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
      const { w: rw, h: rh } = currentRect;
      const flipX = currentX - rw / 2 < 10;
      const flipY = currentY - rh / 2 < 10;
      guideX = flipX ? RECT_BADGE_GAP : -RECT_BADGE_GAP;
      guideY = flipY ? RECT_BADGE_GAP : -RECT_BADGE_GAP;
    } else {
      const measured = fallbackOffset(currentX, currentY);
      guideX = measured.guideX ?? -BADGE_GAP;
      guideY = measured.guideY ?? -BADGE_GAP;
    }

    const anchorHandlers = makeAnchorHandlers(spot, { manualBadgePos });

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
            {...anchorHandlers}
            {...stopBubble}
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

  const resizeFrames = (mergedSpots || []).map((spot) => {
    const currentX = dragOverrides[spot.id]?.x ?? spot.x;
    const currentY = dragOverrides[spot.id]?.y ?? spot.y;
    const currentRect =
      dragOverrides[spot.id]?.rect ?? spot.rect ?? { w: 24, h: 20 };
    const frameHandlers = makeRectFrameHandlers(spot);
    const resizeHandlers = makeResizeHandlers(spot, {
      currentX,
      currentY,
      currentRect,
    });

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
        {...frameHandlers}
        {...stopBubble}
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
        {spot.quizQuestionId && spot.name && (
          <div
            style={{
              position: "absolute",
              top: 2,
              left: 2,
              right: 2,
              padding: "2px 6px",
              backgroundColor: "rgba(220, 38, 38, 0.88)",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: 700,
              lineHeight: 1.3,
              borderRadius: "3px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              pointerEvents: "none",
              userSelect: "none",
            }}
            title={spot.name}
          >
            {spot.name}
          </div>
        )}
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
          {...resizeHandlers}
          {...stopBubble}
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