/**
 * SpotPins — 屏風の名所スポットピン（アノテーション）オーバーレイ。
 *
 * 親 section（position: relative）内に x / y%（スライス左上原点）でタグを重ねる。
 * 表示・編集の DOM 整合は維持しつつ、計測・編集 UI・洛中洛外プリセットは spotPins/* へ委譲する。
 */
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/SpotPins.module.css";
import { useRouter } from "next/router";
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import SpotEditOverlay from "./spotPins/SpotEditOverlay";
import SpotPinsEditSaveBar from "./spotPins/SpotPinsEditSaveBar";
import {
  DEFAULT_SPOT_MASTERS,
  getRakuchuSpotKindClass,
} from "./spotPins/rakuchuSpotPreset";
import {
  BADGE_GAP,
  extractSliceImageName,
  getSlugFromPath,
  transformOriginFor,
} from "./spotPins/spotPinsGeometry";
import {
  getAddedSpotsForSlug,
  getPlaceModeEnabled,
  getPlacedSpotIdsForSlug,
  isSpotMarkedDeleted,
  markSpotDeleted,
  mergePendingUpdate,
  registerSliceSpotIds,
  setPlaceModeEnabled,
  subscribeDiscard,
  subscribePendingUpdates,
  subscribePlaceMode,
} from "./spotPins/spotPinsEditStore";
import { useSpotLayout } from "./spotPins/useSpotLayout";

// =============================================================================
// 1. ユーティリティ — スライス画像名・開発ログ（ジオメトリは spotPinsGeometry）
// =============================================================================

const DEBUG_SPOT_ADD = false;

function logDebug(tag, ...args) {
  if (!DEBUG_SPOT_ADD) return;
  const time = performance.now().toFixed(1);
  console.log(`%c[${time}ms][${tag}]`, "color: #3b82f6; font-weight: bold;", ...args);
}

/** layer の親ラッパー内の <img> からスライス識別名を得る */
function getSliceImageNameFromLayer(layerEl) {
  if (!layerEl) return null;
  let el = layerEl;
  let img = null;
  for (let depth = 0; depth < 4 && el; depth += 1) {
    img = el.querySelector("img");
    if (img) break;
    el = el.parentElement;
  }
  const baseHref =
    typeof window !== "undefined" ? window.location.href : "";
  return extractSliceImageName(img, baseHref);
}

// =============================================================================
// 2. SpotPins 本体 — 本番ピン表示と編集モードのオーケストレータ
// =============================================================================

const SpotPins = ({
  spots,
  linkId,
  zoomScale = 1,
  sliceIndex,
  masterSpots = DEFAULT_SPOT_MASTERS,
  getSpotKindClass = getRakuchuSpotKindClass,
  slugOverride,
  apiEndpoint = "/api/dev/update-spot",
  onSelectSpot,
  selectedSpotId,
}) => {
  const { handleToId, chapterToggle } = useContext(AppContext);
  const router = useRouter();
  const { locale } = router;

  const resolveSlug = useCallback(() => {
    if (slugOverride) return slugOverride;
    if (typeof window !== "undefined") {
      return getSlugFromPath(window.location.pathname);
    }
    return getSlugFromPath(String(router.asPath || "").split("?")[0]);
  }, [slugOverride, router.asPath]);

  const isEditMode =
    process.env.NODE_ENV === "development" && router.query.editSpots === "1";

  const layerRef = useRef(null);
  const [sliceImageName, setSliceImageName] = useState(null);
  const pinRefs = useRef(new Map());
  const [dragOverrides, setDragOverrides] = useState({});
  const [draggingSpotId, setDraggingSpotId] = useState(null);
  const [resizingSpotId, setResizingSpotId] = useState(null);
  const draggingRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [, pendingBump] = useState(0);
  const [placeModeOn, setPlaceModeOn] = useState(() => getPlaceModeEnabled());
  const [placeDraft, setPlaceDraft] = useState(null);

  // ---------------------------------------------------------------------------
  // 3. 同期 — スライス名・編集ストア・配置モード
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const name = getSliceImageNameFromLayer(layer);
    if (name) setSliceImageName(name);
  }, [sliceIndex, spots]);

  const effectiveSliceIndex = Number.isInteger(sliceIndex) ? sliceIndex : null;

  useEffect(() => {
    if (!isEditMode) return undefined;
    const syncPlace = () => setPlaceModeOn(getPlaceModeEnabled());
    return subscribePlaceMode(syncPlace);
  }, [isEditMode]);

  useEffect(() => {
    if (!placeModeOn) setPlaceDraft(null);
  }, [placeModeOn]);

  useEffect(() => {
    if (!isEditMode) return undefined;
    const fn = () => pendingBump((n) => n + 1);
    return subscribePendingUpdates(fn);
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) return undefined;
    const fn = (s) => {
      if (s !== resolveSlug()) return;
      setDragOverrides({});
      pendingBump((n) => n + 1);
    };
    return subscribeDiscard(fn);
  }, [isEditMode, resolveSlug]);

  const editSlug = isEditMode ? resolveSlug() : "";

  useEffect(() => {
    if (!editSlug || !Number.isInteger(effectiveSliceIndex)) return;
    registerSliceSpotIds(
      editSlug,
      effectiveSliceIndex,
      (spots || []).map((s) => s.id).filter(Boolean),
    );
  }, [editSlug, effectiveSliceIndex, spots]);

  const addedForSlice =
    isEditMode && editSlug && sliceImageName
      ? getAddedSpotsForSlug(editSlug).filter(
          (a) => a.sliceImageName && a.sliceImageName === sliceImageName,
        )
      : [];

  const mergedSpots = (
    [
      ...(spots || []),
      ...addedForSlice.map((a) => ({
        id: a.spotId,
        name: a.name,
        nameen: a.nameen,
        x: a.x,
        y: a.y,
        rect: a.rect,
        badgePos: a.badgePos ?? null,
      })),
    ]
  ).filter(
    (s) =>
      !isEditMode ||
      !editSlug ||
      !isSpotMarkedDeleted(editSlug, s.id, sliceImageName),
  );

  const spotLabel = useCallback(
    (spot) => (locale === "en" && spot.nameen ? spot.nameen : spot.name),
    [locale],
  );

  const { offsets: offsetById } = useSpotLayout({
    layerRef,
    badgeRefs: pinRefs,
    mergedSpots,
    dragOverrides,
    spotLabel,
    locale,
  });

  if (
    !mergedSpots.length &&
    !(isEditMode && (placeModeOn || placeDraft != null))
  ) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // 4. 座標・ナビ — ポインタ % 変換と段スクロール
  // ---------------------------------------------------------------------------

  const percentFromPointer = (e) => {
    const layer = layerRef.current;
    if (!layer) return null;
    const rect = layer.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.round(Math.min(250, Math.max(-150, x)) * 10) / 10,
      y: Math.round(Math.min(250, Math.max(-150, y)) * 10) / 10,
    };
  };

  const goToScene = (e, spot) => {
    e.stopPropagation();
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (typeof handleToId === "function") handleToId(linkId);
    onSelectSpot?.(spot);
  };

  const invZoom = 1 / (zoomScale || 1);
  const layerNeedsFront = draggingSpotId != null || resizingSpotId != null;

  // ---------------------------------------------------------------------------
  // 5. 描画 — レイヤ・ピンボタン・編集オーバーレイ
  // ---------------------------------------------------------------------------

  return (
    <>
      {isEditMode ? (
        <SpotPinsEditSaveBar
          slugOverride={slugOverride}
          apiEndpoint={apiEndpoint}
        />
      ) : null}
      <div
        ref={layerRef}
        data-spotpins-layer="1"
        className={`${styles.layer}${chapterToggle ? "" : ` ${styles.hidden}`}`}
        style={{
          ...(isEditMode ? { overflow: "visible" } : null),
          ...(layerNeedsFront ? { zIndex: 50 } : null),
          ...(isEditMode && placeModeOn
            ? { pointerEvents: "auto", cursor: "crosshair" }
            : null),
        }}
        onPointerDown={(e) => {
          if (!isEditMode || !placeModeOn || placeDraft) return;
          if (e.target !== e.currentTarget) return;
          e.stopPropagation();
          const pos = percentFromPointer(e);
          if (!pos) return;
          setPlaceDraft({ x: pos.x, y: pos.y });
        }}
      >
        {mergedSpots.map((spot) => {
          const label = spotLabel(spot);
          const kindClass =
            getSpotKindClass === null
              ? ""
              : typeof getSpotKindClass === "function"
                ? getSpotKindClass(spot, styles) || ""
                : "";
          const currentX = dragOverrides[spot.id]?.x ?? spot.x;
          const currentY = dragOverrides[spot.id]?.y ?? spot.y;
          const currentRect =
            dragOverrides[spot.id]?.rect ?? spot.rect ?? { w: 24, h: 20 };
          const hasSpotRect = Boolean(
            dragOverrides[spot.id]?.rect ?? spot.rect,
          );
          const currentBadgePos =
            dragOverrides[spot.id]?.badgePos ?? spot.badgePos ?? null;
          const useBadgePos = Boolean(currentBadgePos);
          const RECT_BADGE_GAP = 6;
          let offsetX;
          let offsetY;
          if (hasSpotRect) {
            const rw = currentRect.w;
            const rh = currentRect.h;
            const flipX = currentX - rw / 2 < 10;
            const flipY = currentY - rh / 2 < 10;
            if (flipX) {
              offsetX = `calc(${rw / 2}% + ${RECT_BADGE_GAP}px)`;
            } else {
              offsetX = `calc(-${rw / 2}% - 100% - ${RECT_BADGE_GAP}px)`;
            }
            if (flipY) {
              offsetY = `calc(${rh / 2}% + ${RECT_BADGE_GAP}px)`;
            } else {
              offsetY = `calc(-${rh / 2}% - 100% - ${RECT_BADGE_GAP}px)`;
            }
          } else {
            const measured =
              offsetById[spot.id] ??
              {
                offsetX: `calc(-100% - ${BADGE_GAP}px)`,
                offsetY: `calc(-100% - ${BADGE_GAP}px)`,
              };
            offsetX = measured.offsetX;
            offsetY = measured.offsetY;
          }
          const isDragging = draggingSpotId === spot.id;
          const isSelected =
            !isEditMode &&
            selectedSpotId != null &&
            String(selectedSpotId) === String(spot.id);
          const pinButton = (
            <button
              ref={(el) => {
                if (el) pinRefs.current.set(spot.id, el);
                else pinRefs.current.delete(spot.id);
              }}
              type="button"
              className={`${styles.pin} ${kindClass}`}
              style={{
                ...(useBadgePos
                  ? {
                      position: "absolute",
                      left: `${currentBadgePos.x}%`,
                      top: `${currentBadgePos.y}%`,
                      transform: `translate(-50%, -50%) scale(${invZoom})`,
                      transformOrigin: "center center",
                    }
                  : {
                      left: 0,
                      top: 0,
                      transform: `translate(${offsetX}, ${offsetY}) scale(${invZoom})`,
                      transformOrigin: transformOriginFor(offsetX, offsetY),
                    }),
                ...(isEditMode
                  ? {
                      cursor: isDragging ? "grabbing" : "grab",
                      touchAction: "none",
                    }
                  : null),
                ...(isSelected
                  ? {
                      boxShadow: "0 0 0 2px #ff8c77, 0 2px 10px rgba(255, 140, 119, 0.45)",
                      filter: "brightness(1.08)",
                    }
                  : null),
              }}
              title={label}
              aria-label={label}
              draggable={false}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (!isEditMode) return;
                draggingRef.current = {
                  spotId: spot.id,
                  pointerId: e.pointerId,
                  moved: false,
                };
                setDraggingSpotId(spot.id);
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (
                  !isEditMode ||
                  draggingRef.current?.spotId !== spot.id ||
                  !draggingRef.current
                ) {
                  return;
                }
                const pos = percentFromPointer(e);
                if (!pos) return;
                draggingRef.current.moved = true;
                setDragOverrides((prev) => ({
                  ...prev,
                  [spot.id]: {
                    x: prev[spot.id]?.x ?? spot.x,
                    y: prev[spot.id]?.y ?? spot.y,
                    rect:
                      prev[spot.id]?.rect ??
                      spot.rect ??
                      { w: 24, h: 20 },
                    badgePos: { x: pos.x, y: pos.y },
                  },
                }));
              }}
              onPointerUp={(e) => {
                if (
                  !isEditMode ||
                  draggingRef.current?.spotId !== spot.id ||
                  !draggingRef.current
                ) {
                  return;
                }
                e.currentTarget.releasePointerCapture(e.pointerId);
                const moved = draggingRef.current.moved;
                draggingRef.current = null;
                setDraggingSpotId(null);
                if (!moved) return;
                suppressClickRef.current = true;
                const pos = percentFromPointer(e);
                if (!pos) return;
                const saveX = dragOverrides[spot.id]?.x ?? spot.x;
                const saveY = dragOverrides[spot.id]?.y ?? spot.y;
                const saveRect =
                  dragOverrides[spot.id]?.rect ??
                  spot.rect ??
                  { w: 24, h: 20 };
                const nextBadgePos = { x: pos.x, y: pos.y };
                setDragOverrides((prev) => ({
                  ...prev,
                  [spot.id]: {
                    x: saveX,
                    y: saveY,
                    rect: saveRect,
                    badgePos: nextBadgePos,
                  },
                }));
                mergePendingUpdate(resolveSlug(), spot.id, {
                  x: saveX,
                  y: saveY,
                  rect: saveRect,
                  badgePos: nextBadgePos,
                });
              }}
              onPointerCancel={(e) => {
                if (draggingRef.current?.spotId === spot.id) {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  draggingRef.current = null;
                  setDraggingSpotId(null);
                }
              }}
              onClick={(e) => goToScene(e, spot)}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.label}>{label}</span>
              {isEditMode ? (
                <span
                  role="button"
                  aria-label="削除"
                  style={{
                    marginLeft: 4,
                    padding: "0 4px",
                    fontSize: 12,
                    lineHeight: 1,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    markSpotDeleted(resolveSlug(), {
                      spotId: spot.id,
                      sliceImageName,
                      sliceIndex,
                    });
                  }}
                >
                  ×
                </span>
              ) : null}
            </button>
          );
          return (
            <div key={spot.id} style={{ display: "contents" }}>
              <div
                style={{
                  position: "absolute",
                  left: `${currentX}%`,
                  top: `${currentY}%`,
                }}
              >
                {!useBadgePos ? pinButton : null}
              </div>
              {useBadgePos ? pinButton : null}
            </div>
          );
        })}
        {isEditMode ? (
          <SpotEditOverlay
            editSlug={editSlug}
            sliceIndex={sliceIndex}
            sliceImageName={sliceImageName}
            invZoom={invZoom}
            placeDraft={placeDraft}
            setPlaceDraft={setPlaceDraft}
            mergedSpots={mergedSpots}
            dragOverrides={dragOverrides}
            setDragOverrides={setDragOverrides}
            layerRef={layerRef}
            masterSpots={masterSpots}
            placedSpotIds={getPlacedSpotIdsForSlug(editSlug)}
            percentFromPointer={percentFromPointer}
            resizingSpotId={resizingSpotId}
            setResizingSpotId={setResizingSpotId}
          />
        ) : null}
      </div>
    </>
  );
};

export default SpotPins;