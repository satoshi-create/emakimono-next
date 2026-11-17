/**
 * useSpotPinsEditor — スポット編集モードの状態・ストア購読・合成スポット・ドラッグ／削除。
 * SpotPins から切り出し；振る舞いは spotPinsEditStore 連携をそのまま維持する。
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  getAddedSpotsForSlug,
  getPlaceModeEnabled,
  getQuizOnlyEdit,
  isSpotMarkedDeleted,
  markSpotDeleted,
  mergePendingUpdate,
  registerSliceSpotIds,
  subscribeDiscard,
  subscribePendingUpdates,
  subscribePlaceMode,
  subscribeQuizOnly,
  toggleQuizOnlyEdit,
} from "./spotPinsEditStore";

// =============================================================================
// デバッグスイッチ（検証完了後は false にして一括停止）
// =============================================================================
const DEBUG_SPOT_EDIT_SAVE = true;

function logDebug(tag, ...args) {
  if (!DEBUG_SPOT_EDIT_SAVE) return;
  const time = performance.now().toFixed(1);
  console.log(`%c[${time}ms][${tag}]`, "color: #3b82f6; font-weight: bold;", ...args);
}

export function useSpotPinsEditor({
  isEditMode,
  spots,
  sliceIndex,
  effectiveSliceIndex,
  editSlug,
  sliceImageName,
  zoomScale,
  layerRef,
}) {
  // ---------------------------------------------------------------------------
  // 1. 状態（State）
  // ---------------------------------------------------------------------------

  // 編集ストアの再描画とドラッグ中の一時座標を React 側で保持する（ピンは % 座標）。
  const [dragOverrides, setDragOverrides] = useState({});
  const [draggingSpotId, setDraggingSpotId] = useState(null);
  const [resizingSpotId, setResizingSpotId] = useState(null);
  const draggingRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [, pendingBump] = useState(0);
  // 配置モードはグローバルストアと同期し、ドラフトはレイヤクリックで一度だけ置く。
  const [placeModeOn, setPlaceModeOn] = useState(() => getPlaceModeEnabled());
  const [placeDraft, setPlaceDraft] = useState(null);
  // クイズ専用編集フィルタは外部ストアが正本（複数コンポーネント間で共有）。
  const quizOnlyEdit = useSyncExternalStore(
    subscribeQuizOnly,
    getQuizOnlyEdit,
    getQuizOnlyEdit,
  );

  // ---------------------------------------------------------------------------
  // 2. 同期（Effects / Observer）
  // ---------------------------------------------------------------------------

  // 配置モードの ON/OFF をストアから購読（保存バー等との整合）。
  useEffect(() => {
    if (!isEditMode) return undefined;
    const syncPlace = () => setPlaceModeOn(getPlaceModeEnabled());
    return subscribePlaceMode(syncPlace);
  }, [isEditMode]);

  // 配置モード終了時は未確定ドラフトを破棄（幽霊プレビュー防止）。
  useEffect(() => {
    if (!placeModeOn) setPlaceDraft(null);
  }, [placeModeOn]);

  // ペンディング更新のコミット通知で mergedSpots 等を再計算させる。
  useEffect(() => {
    if (!isEditMode) return undefined;
    const fn = () => pendingBump((n) => n + 1);
    return subscribePendingUpdates(fn);
  }, [isEditMode]);

  // 編集破棄時はドラッグ上書きをクリアし、当該 slug のみ反応。
  useEffect(() => {
    if (!isEditMode) return undefined;
    const fn = (s) => {
      if (s !== editSlug) return;
      logDebug("EDITOR:discardFired", { sliceIndex: effectiveSliceIndex });
      setDragOverrides({});
      pendingBump((n) => n + 1);
    };
    return subscribeDiscard(fn);
  }, [isEditMode, editSlug, effectiveSliceIndex]);

  // スライス上の既存 spotId をストアに登録（追加・削除の差分管理の基準）。
  useEffect(() => {
    if (!editSlug || !Number.isInteger(effectiveSliceIndex)) return;
    registerSliceSpotIds(
      editSlug,
      effectiveSliceIndex,
      (spots || []).map((s) => s.id).filter(Boolean),
    );
  }, [editSlug, effectiveSliceIndex, spots]);

  // ---------------------------------------------------------------------------
  // 3. 計算・ハンドラ（Pure Logic & Handlers）
  // ---------------------------------------------------------------------------

  // 本番 spots にストア由来の追加スポットを合成し、閲覧／編集で異なる hidden・削除フィルタを適用。
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
  ).filter((s) => {
    const passesHidden = !isEditMode
      ? !s.hidden
      : quizOnlyEdit
        ? Boolean(s.hidden)
        : true;
    const passesDeleted =
      !isEditMode ||
      !editSlug ||
      !isSpotMarkedDeleted(editSlug, s.id, sliceImageName);
    return passesHidden && passesDeleted;
  });

  // レイヤ矩形内の client 座標をスライス % に丸める（ドラッグ・配置の共通変換）。
  const percentFromPointer = useCallback(
    (clientX, clientY) => {
      const layer = layerRef.current;
      if (!layer) return null;
      const rect = layer.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      return {
        x: Math.round(Math.min(250, Math.max(-150, x)) * 10) / 10,
        y: Math.round(Math.min(250, Math.max(-150, y)) * 10) / 10,
      };
    },
    [layerRef],
  );

  const percentFromPointerEvent = useCallback(
    (e) => percentFromPointer(e.clientX, e.clientY),
    [percentFromPointer],
  );

  // 配置モード：レイヤ空白クリックでドラフト起点を置く（子要素クリックは無視）。
  const handleLayerPointerDown = useCallback(
    (e) => {
      if (!isEditMode || !placeModeOn || placeDraft) return;
      if (e.target !== e.currentTarget) return;
      e.stopPropagation();
      const pos = percentFromPointerEvent(e);
      if (!pos) return;
      setPlaceDraft({ x: pos.x, y: pos.y });
    },
    [isEditMode, placeModeOn, placeDraft, percentFromPointerEvent],
  );

  const handleDeleteSpot = useCallback(
    (e, spot) => {
      e.stopPropagation();
      e.preventDefault();
      markSpotDeleted(editSlug, {
        spotId: spot.id,
        sliceImageName,
        sliceIndex,
      });
    },
    [editSlug, sliceImageName, sliceIndex],
  );

  const getPinEditHandlers = useCallback(
    (spot) => {
      const onPointerDown = (e) => {
        e.stopPropagation();
        if (!isEditMode) return;
        draggingRef.current = {
          spotId: spot.id,
          pointerId: e.pointerId,
          moved: false,
        };
        setDraggingSpotId(spot.id);
        e.currentTarget.setPointerCapture(e.pointerId);
      };

      const onPointerMove = (e) => {
        if (
          !isEditMode ||
          draggingRef.current?.spotId !== spot.id ||
          !draggingRef.current
        ) {
          return;
        }
        const pos = percentFromPointerEvent(e);
        if (!pos) return;
        draggingRef.current.moved = true;
        const roundedX = pos.x;
        const roundedY = pos.y;
        setDragOverrides((prev) => {
          const saveX = prev[spot.id]?.x ?? spot.x;
          const saveY = prev[spot.id]?.y ?? spot.y;
          const currentRect =
            prev[spot.id]?.rect ??
            spot.rect ??
            { w: 24, h: 20 };
          return {
            ...prev,
            [spot.id]: {
              x: saveX,
              y: saveY,
              ...(currentRect ? { rect: currentRect } : {}),
              badgePos: { x: roundedX, y: roundedY },
            },
          };
        });
      };

      const onPointerUp = (e) => {
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
        const pos = percentFromPointerEvent(e);
        if (!pos) return;
        const saveX = dragOverrides[spot.id]?.x ?? spot.x;
        const saveY = dragOverrides[spot.id]?.y ?? spot.y;
        const saveRect =
          dragOverrides[spot.id]?.rect ??
          spot.rect ??
          { w: 24, h: 20 };
        const roundedX = pos.x;
        const roundedY = pos.y;
        setDragOverrides((prev) => ({
          ...prev,
          [spot.id]: {
            x: saveX,
            y: saveY,
            ...(saveRect ? { rect: saveRect } : {}),
            badgePos: { x: roundedX, y: roundedY },
          },
        }));
        logDebug("EDITOR:dragEnd", {
          spotId: spot.id,
          hidden: spot.hidden,
          x: saveX,
          y: saveY,
          rect: saveRect,
        });
        mergePendingUpdate(editSlug, spot.id, {
          x: saveX,
          y: saveY,
          ...(saveRect ? { rect: saveRect } : {}),
          badgePos: { x: roundedX, y: roundedY },
        });
      };

      const onPointerCancel = (e) => {
        if (draggingRef.current?.spotId === spot.id) {
          e.currentTarget.releasePointerCapture(e.pointerId);
          draggingRef.current = null;
          setDraggingSpotId(null);
        }
      };

      return {
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        handleDeleteSpot,
      };
    },
    [isEditMode, editSlug, dragOverrides, percentFromPointerEvent, handleDeleteSpot],
  );

  // ドラッグまたは配置ドラフト中はピン層を前面に（ズーム下でも操作可能に）。
  const layerNeedsFront =
    draggingSpotId != null || placeDraft != null;

  return {
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
    layerNeedsFront,
    percentFromPointer,
    handleLayerPointerDown,
    getPinEditHandlers,
  };
}