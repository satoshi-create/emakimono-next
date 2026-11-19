/**
 * SpotPins — 屏風の名所スポットピン（アノテーション）オーバーレイ。
 *
 * 親 section（position: relative）内に x / y%（スライス左上原点）でタグを重ねる。
 * 表示・編集の DOM 整合は維持しつつ、計測・編集 UI・洛中洛外プリセットは spotPins/* へ委譲する。
 */
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/SpotPins.module.css";
import { useRouter } from "next/router";
import SceneLikeButton from "@/components/emaki/viewer/SceneLikeButton";
import { BYOBU_SPOT_LIKE_INDEX_OFFSET } from "@/components/emaki/commentary/useByobuSpotCommentary";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
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
import { getPlacedSpotIdsForSlug } from "./spotPins/spotPinsEditStore";
import { useSpotLayout } from "./spotPins/useSpotLayout";
import { useSpotPinsEditor } from "./spotPins/useSpotPinsEditor";

// =============================================================================
// 1. ユーティリティ — スライス画像名・開発ログ（ジオメトリは spotPinsGeometry）
// =============================================================================

const DEBUG_SPOT_ADD = false;
const QUIZ_EDIT_ACCENT = "#2563eb";

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
  data,
  ebikiPickerEnabled = false,
  masterSpots = DEFAULT_SPOT_MASTERS,
  getSpotKindClass = getRakuchuSpotKindClass,
  slugOverride,
  apiEndpoint = "/api/dev/update-spot",
  onSelectSpot,
  selectedSpotId,
  isPanorama = false,
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

  const spotLikeIndexById = useMemo(() => {
    const emakis = data?.emakis;
    if (!Array.isArray(emakis)) return {};
    /** @type {Record<string, number>} */
    const map = {};
    let globalSpotIndex = 0;
    emakis.forEach((slice) => {
      if (slice?.cat !== "image" || !Array.isArray(slice.spots)) return;
      slice.spots.forEach((spot) => {
        if (!spot?.id) return;
        const id = String(spot.id);
        map[id] = BYOBU_SPOT_LIKE_INDEX_OFFSET + globalSpotIndex;
        globalSpotIndex += 1;
      });
    });
    return map;
  }, [data?.emakis]);

  const emakiId = data?.titleen;
  const emakiTitle = data?.title;

  // 1. 状態（State）
  const layerRef = useRef(null);
  const [sliceImageName, setSliceImageName] = useState(null);
  const pinRefs = useRef(new Map());
  const suppressClickRef = useRef(false);

  // 2. 同期（Effects / Observer）
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const name = getSliceImageNameFromLayer(layer);
    if (name) setSliceImageName(name);
  }, [sliceIndex, spots]);

  const effectiveSliceIndex = Number.isInteger(sliceIndex) ? sliceIndex : null;
  const editSlug = isEditMode ? resolveSlug() : "";

  const {
    mergedSpots,
    quizOnlyEdit,
    toggleQuizOnlyEdit,
    placeModeOn,
    placeDraft,
    setPlaceDraft,
    dragOverrides,
    setDragOverrides,
    draggingSpotId,
    resizingSpotId,
    setResizingSpotId,
    layerNeedsFront: layerNeedsFrontFromEditor,
    percentFromPointer,
    handleLayerPointerDown,
    getPinEditHandlers,
  } = useSpotPinsEditor({
    isEditMode,
    spots,
    sliceIndex,
    effectiveSliceIndex,
    editSlug,
    sliceImageName,
    zoomScale,
    layerRef,
  });

  const layerNeedsFront =
    Boolean(layerNeedsFrontFromEditor) || resizingSpotId != null;

  // 3. 計算（Pure Logic）
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

  const layoutOffsets = offsetById;

  if (!mergedSpots.length && !isEditMode) {
    return null;
  }

  // 4. UI表示（View）
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

  return (
    <>
      {isEditMode ? (
        <SpotPinsEditSaveBar
          slugOverride={slugOverride}
          apiEndpoint={apiEndpoint}
          quizOnlyEdit={quizOnlyEdit}
          onToggleQuizOnlyEdit={toggleQuizOnlyEdit}
        />
      ) : null}
      <div
        ref={layerRef}
        data-spotpins-layer="1"
        className={`${styles.layer}${chapterToggle ? "" : ` ${styles.hidden}`}`}
        style={{
          ...(isEditMode ? { overflow: "visible" } : null),
          zIndex: isPanorama ? 55 : isEditMode ? 50 : 20,
          ...(isEditMode && placeModeOn
            ? { pointerEvents: "auto", cursor: "crosshair" }
            : null),
        }}
        onPointerDown={handleLayerPointerDown}
      >
        {mergedSpots.map((spot) => {
          if (spot.quizQuestionId) {
            return <div key={spot.id} style={{ display: "contents" }} />;
          }
          const pinEditHandlers = isEditMode ? getPinEditHandlers(spot) : null;
          const isQuizHiddenSpot = isEditMode && spot.hidden === true;
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
              layoutOffsets[spot.id] ??
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
            <div
              role="button"
              tabIndex={0}
              ref={(el) => {
                if (el) pinRefs.current.set(spot.id, el);
                else pinRefs.current.delete(spot.id);
              }}
              className={`${styles.pin} ${kindClass}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.currentTarget.click();
                }
              }}
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
                      ...(isQuizHiddenSpot
                        ? {
                            boxShadow:
                              "0 0 0 2px #2563eb, 0 2px 10px rgba(37, 99, 235, 0.35)",
                          }
                        : null),
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
              onPointerDown={pinEditHandlers?.onPointerDown}
              onPointerMove={pinEditHandlers?.onPointerMove}
              onPointerUp={pinEditHandlers?.onPointerUp}
              onPointerCancel={pinEditHandlers?.onPointerCancel}
              onClick={(e) => goToScene(e, spot)}
            >
              <span
                className={styles.dot}
                aria-hidden="true"
                style={
                  isQuizHiddenSpot
                    ? {
                        backgroundColor: QUIZ_EDIT_ACCENT,
                        borderColor: QUIZ_EDIT_ACCENT,
                      }
                    : undefined
                }
              />
              <span className={styles.label}>{label}</span>
              {!ebikiPickerEnabled &&
              !isEditMode &&
              emakiId &&
              spotLikeIndexById[String(spot.id)] != null ? (
                <>
                  <span className={styles.likeDivider} aria-hidden="true" />
                  <span
                    className={styles.likeSlot}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    <SceneLikeButton
                      titleen={emakiId}
                      title={emakiTitle}
                      chapter={
                        locale === "en"
                          ? spot.nameen || spot.name
                          : spot.name
                      }
                      index={spotLikeIndexById[String(spot.id)]}
                      variant="bar"
                    />
                  </span>
                </>
              ) : null}
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
                  onClick={(e) => pinEditHandlers?.handleDeleteSpot(e, spot)}
                >
                  ×
                </span>
              ) : null}
            </div>
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
            isPanorama={isPanorama}
          />
        ) : null}
      </div>
    </>
  );
};

export default SpotPins;