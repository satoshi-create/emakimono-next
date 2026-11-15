/**
 * SpotPins — 屏風の名所スポットピン（アノテーション）オーバーレイ。
 *
 * 親 section（position: relative）内に x / y%（スライス左上原点）でタグを重ねる。
 * Phase 1: 本文は持たず、クリックで該当段へスクロール＆コメンタリーバーを追従させる
 * （spots は sync が scenes[].spots を扇 index へ振り分けて各スライスに付与する）。
 *
 * パン操作との競合回避:
 * - 実体を button にし、useEmakiPalmDrag の isInteractive（a, button, [role=button]）に一致させる
 * - onPointerDown でも stopPropagation（親側ハンドラへの伝播を抑止）
 */
import { AppContext } from "@/context/AppContext";
import {
  getSpotVisualKind,
  RAKUCHU_SPOT_MASTERS,
} from "@/data/rakuchu-rakugai/rakuchuMotifMaster";
import styles from "@/styles/SpotPins.module.css";
import { useRouter } from "next/router";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import SpotPlaceNamePopup from "./spotPins/SpotPlaceNamePopup";
import SpotPinsEditSaveBar from "./spotPins/SpotPinsEditSaveBar";
import {
  BADGE_GAP,
  EDGE_MARGIN,
  extractSliceImageName,
  fallbackOffset,
  getSlugFromPath,
  transformOriginFor,
} from "./spotPins/spotPinsGeometry";
import {
  getAddedSpotsForSlug,
  getPlaceModeEnabled,
  getPlacedSpotIdsForSlug,
  mergePendingUpdate,
  registerNewSpot,
  registerSliceSpotIds,
  setPlaceModeEnabled,
  subscribeDiscard,
  subscribePendingUpdates,
  subscribePlaceMode,
} from "./spotPins/spotPinsEditStore";

// =============================================================================
// 1. オーケストレータ層 — スライス画像名解決・開発用ログ（ジオメトリは spotPinsGeometry へ委譲）
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

/** getSpotVisualKind 未使用時の洛中洛外デフォルト見た目 */
function defaultSpotKindClass(spotId, styleTokens) {
  const kind = getSpotVisualKind(spotId);
  if (kind === "power") return styleTokens.pinPower;
  if (kind === "temple") return styleTokens.pinTemple;
  if (kind === "water") return styleTokens.pinWater;
  if (kind === "town") return styleTokens.pinTown;
  return "";
}


// =============================================================================
// 2. SpotPins 本体 — 表示・同期オーケストレータ（ピン DOM / 編集操作は従来どおり）
// =============================================================================

const SpotPins = ({
  spots,
  linkId,
  zoomScale = 1,
  sliceIndex,
  masterSpots = RAKUCHU_SPOT_MASTERS,
  getSpotKindClass,
  slugOverride,
  apiEndpoint = "/api/dev/update-spot",
}) => {
  // chapterToggle はフッターの「段タイトルを非表示」トグル（AppContext 正本）。
  // 屏風では段タイトル枠が無いため、このフラグを名所スポットピンの表示に流用する。
  // SpotPins は spots 保持スライス（＝屏風）にのみ描画されるので通常絵巻に影響しない。
  const { handleToId, chapterToggle } = useContext(AppContext);
  // 英語ロケールでは nameen を優先表示（未設定なら日本語 name へフォールバック）。
  // useLocale は重量データ（staticData / metadata-cache）を引き込むため router を直接参照する。
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
  // 実測用: layer（=スライス幅 W）と各ピン button（=ラベル実幅 w）
  const layerRef = useRef(null);
  const [sliceImageName, setSliceImageName] = useState(null);
  const pinRefs = useRef(new Map());
  const [offsetById, setOffsetById] = useState({});
  const offsetRef = useRef({});
  const [dragOverrides, setDragOverrides] = useState({});
  const [draggingSpotId, setDraggingSpotId] = useState(null);
  const draggingRef = useRef(null);
  const anchorDraggingRef = useRef(null);
  const resizingRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [, pendingBump] = useState(0);
  const [placeModeOn, setPlaceModeOn] = useState(() => getPlaceModeEnabled());
  const [placeDraft, setPlaceDraft] = useState(null);

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
  const mergedSpots = [
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
  ];

  // 実測 px ベース: 基準点 (X,Y) の左上にバッジを置き、端ではみ出すときだけ反対側へ退避。
  const measure = useCallback(() => {
    const layer = layerRef.current;
    const W = layer ? layer.clientWidth : 0;
    const H = layer ? layer.clientHeight : 0;
    if (!W || !H) return;
    const next = {};
    const prev = offsetRef.current;
    (mergedSpots || []).forEach((spot) => {
      const sx = dragOverrides[spot.id]?.x ?? spot.x;
      const sy = dragOverrides[spot.id]?.y ?? spot.y;
      const el = pinRefs.current.get(spot.id);
      const w = el ? el.offsetWidth : 0;
      const h = el ? el.offsetHeight : 0;
      if (!w || !h) {
        const fb = prev[spot.id] ?? fallbackOffset(sx, sy);
        next[spot.id] = {
          ...fb,
          guideX: -BADGE_GAP,
          guideY: -BADGE_GAP,
        };
        return;
      }
      const X = (W * sx) / 100;
      const Y = (H * sy) / 100;
      let offsetX = `calc(-100% - ${BADGE_GAP}px)`;
      if (X - w - BADGE_GAP < EDGE_MARGIN) {
        offsetX = `calc(0% + ${BADGE_GAP}px)`;
      }
      let offsetY = `calc(-100% - ${BADGE_GAP}px)`;
      if (Y - h - BADGE_GAP < EDGE_MARGIN) {
        offsetY = `calc(0% + ${BADGE_GAP}px)`;
      }
      const guideX = offsetX.startsWith("calc(-100%")
        ? -BADGE_GAP
        : w + BADGE_GAP;
      const guideY = offsetY.startsWith("calc(-100%")
        ? -BADGE_GAP
        : h + BADGE_GAP;
      next[spot.id] = { offsetX, offsetY, guideX, guideY };
    });
    const changed =
      Object.keys(next).length !== Object.keys(prev).length ||
      Object.keys(next).some((k) => {
        const a = prev[k];
        const b = next[k];
        return (
          !a ||
          !b ||
          a.offsetX !== b.offsetX ||
          a.offsetY !== b.offsetY
        );
      });
    offsetRef.current = next;
    if (changed) setOffsetById(next);
  }, [mergedSpots, dragOverrides]);

  useLayoutEffect(() => {
    measure();
    const layer = layerRef.current;
    if (!layer || typeof ResizeObserver === "undefined") return undefined;
    // リサイズ・回転・全画面切替（スライス幅の変化）で再測定
    const ro = new ResizeObserver(() => measure());
    ro.observe(layer);
    // Web フォント確定でラベル幅が変わるケースを拾う
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => measure()).catch(() => {});
    }
    return () => ro.disconnect();
    // locale 変更（JA/EN でラベル幅が変わる）でも再測定する
  }, [measure, locale]);

  if (
    !mergedSpots.length &&
    !(isEditMode && (placeModeOn || placeDraft != null))
  ) {
    return null;
  }

  const spotLabel = (spot) =>
    locale === "en" && spot.nameen ? spot.nameen : spot.name;

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

  const goToScene = (e) => {
    e.stopPropagation();
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (typeof handleToId === "function") handleToId(linkId);
  };

  const invZoom = 1 / (zoomScale || 1);
  const layerNeedsFront =
    draggingSpotId != null ||
    resizingRef.current?.spotId != null ||
    anchorDraggingRef.current?.spotId != null;
  return (
    <>
      {isEditMode ? (
        <SpotPinsEditSaveBar
          slugOverride={slugOverride}
          apiEndpoint={apiEndpoint}
        />
      ) : null}
      {/* chapterToggle=false（段タイトル非表示）でピンをフェードアウト＋操作不可にする。 */}
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
        {placeDraft ? (
          <SpotPlaceNamePopup
            x={placeDraft.x}
            y={placeDraft.y}
            invZoom={invZoom}
            masterSpots={masterSpots}
            placedSpotIds={getPlacedSpotIdsForSlug(editSlug)}
            onCancel={() => setPlaceDraft(null)}
            onConfirm={(item) => {
              const { id, name, nameen } = item;
              logDebug("ADD_MASTER_SPOT", {
                slug: resolveSlug(),
                sliceIndexProp: sliceIndex,
                sliceImageName,
                item,
              });
              const slug = resolveSlug();
              if (!slug || !name || !sliceImageName) return;
              const spotId = id || `spot-${Date.now()}`;
              registerNewSpot(slug, {
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
              pendingBump((n) => n + 1);
            }}
          />
        ) : null}
        {mergedSpots.map((spot) => {
          const label = spotLabel(spot);
          const kindClass =
            getSpotKindClass === null
              ? ""
              : typeof getSpotKindClass === "function"
                ? getSpotKindClass(spot, styles) || ""
                : defaultSpotKindClass(spot.id, styles);
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
          const manualBadgePos = Boolean(
            dragOverrides[spot.id]?.badgePos ?? spot.badgePos,
          );
          const RECT_BADGE_GAP = 6;
          let offsetX;
          let offsetY;
          let guideX = -BADGE_GAP;
          let guideY = -BADGE_GAP;
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
            guideX = flipX ? RECT_BADGE_GAP : -RECT_BADGE_GAP;
            guideY = flipY ? RECT_BADGE_GAP : -RECT_BADGE_GAP;
          } else {
            const measured =
              offsetById[spot.id] ?? fallbackOffset(currentX, currentY);
            offsetX = measured.offsetX;
            offsetY = measured.offsetY;
            guideX = measured.guideX ?? -BADGE_GAP;
            guideY = measured.guideY ?? -BADGE_GAP;
          }
          const isDragging = draggingSpotId === spot.id;
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
              onClick={goToScene}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.label}>{label}</span>
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
                {isEditMode ? (
                  <>
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
                        mergePendingUpdate(resolveSlug(), spot.id, patch);
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
                  </>
                ) : null}
                {!useBadgePos ? pinButton : null}
              </div>
              {useBadgePos ? pinButton : null}
              {isEditMode && useBadgePos ? (
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
        })}
        {isEditMode &&
          (mergedSpots || []).map((spot) => {
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
                        Math.round(Math.abs(mx - currentX) * 2 * 10) / 10
                      )
                    );
                    const h = Math.max(
                      4,
                      Math.min(
                        250,
                        Math.round(Math.abs(my - currentY) * 2 * 10) / 10
                      )
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
                        Math.round(Math.abs(mx - currentX) * 2 * 10) / 10
                      )
                    );
                    const finalH = Math.max(
                      4,
                      Math.min(
                        250,
                        Math.round(Math.abs(my - currentY) * 2 * 10) / 10
                      )
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
                    mergePendingUpdate(resolveSlug(), spot.id, {
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
          })}
      </div>
    </>
  );
};

export default SpotPins;
