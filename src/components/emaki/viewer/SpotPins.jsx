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
import { createPortal } from "react-dom";

// 端ピンがスライス境界から離す最低セーフマージン（px）。
// CSS .layer の --spot-edge-inset と同値に保つこと。
const EDGE_MARGIN = 4;
const BADGE_GAP = 10;

// 未測定時のフォールバック（CLS 回避）。原則左上配置、端寄りは反対側へ。
const fallbackOffset = (x, y) => ({
  offsetX:
    x <= 30 ? `calc(0% + ${BADGE_GAP}px)` : `calc(-100% - ${BADGE_GAP}px)`,
  offsetY:
    y <= 30 ? `calc(0% + ${BADGE_GAP}px)` : `calc(-100% - ${BADGE_GAP}px)`,
});

const transformOriginFor = (offsetX, offsetY) =>
  `${String(offsetX).includes("-100%") ? "100%" : "0%"} ${String(offsetY).includes("-100%") ? "100%" : "0%"}`;

const pendingUpdatesBySlug = new Map();
/** @type {Map<string, Array<{ spotId: string, sliceIndex: number, name: string, nameen: string, x: number, y: number, rect: { w: number, h: number }, badgePos: object|null, isNew: true }>>} */
const addedSpotsBySlug = new Map();
/** @type {Map<string, Map<number, string[]>>} */
const sliceSpotIdsBySlug = new Map();
const currentEditSliceRef = { sliceIndex: 0 };
const pendingListeners = new Set();
const discardListeners = new Set();
const placeModeListeners = new Set();
let placeModeEnabled = false;
const editBarHostRef = { taken: false };

const notifyPlaceMode = () => {
  placeModeListeners.forEach((fn) => {
    fn();
  });
};

const setPlaceModeEnabled = (next) => {
  placeModeEnabled = Boolean(next);
  notifyPlaceMode();
};

const getSlugFromPath = () => {
  if (typeof window === "undefined") return "";
  return window.location.pathname.split("/").filter(Boolean).pop() || "";
};

const getPlacedSpotIdsForSlug = (slug) => {
  const ids = new Set();
  const bySlice = sliceSpotIdsBySlug.get(slug);
  if (bySlice) {
    bySlice.forEach((list) => list.forEach((id) => ids.add(id)));
  }
  (addedSpotsBySlug.get(slug) || []).forEach((a) => ids.add(a.spotId));
  return ids;
};

const isMasterSpotPlaced = (master, placedIds) => {
  const keys = [master.masterId, ...(master.aliasSpotIds || [])];
  return keys.some((id) => placedIds.has(id));
};

const notifyPending = () => {
  pendingListeners.forEach((fn) => {
    fn();
  });
};

const mergePendingUpdate = (slug, spotId, patch) => {
  if (!slug || !spotId) return;
  let bySpot = pendingUpdatesBySlug.get(slug);
  if (!bySpot) {
    bySpot = new Map();
    pendingUpdatesBySlug.set(slug, bySpot);
  }
  const prev = bySpot.get(spotId) || {};
  bySpot.set(spotId, { spotId, ...prev, ...patch });
  notifyPending();
};

const clearPendingForSlug = (slug) => {
  if (slug) pendingUpdatesBySlug.delete(slug);
  notifyPending();
};

const registerNewSpot = (
  slug,
  { spotId, sliceIndex, name, nameen, x = 50, y = 50 },
) => {
  if (!slug || !spotId) return;
  const entry = {
    spotId,
    sliceIndex,
    name,
    nameen,
    x,
    y,
    rect: { w: 24, h: 20 },
    badgePos: null,
    isNew: true,
  };
  let list = addedSpotsBySlug.get(slug);
  if (!list) {
    list = [];
    addedSpotsBySlug.set(slug, list);
  }
  list.push(entry);
  mergePendingUpdate(slug, spotId, {
    sliceIndex,
    name,
    nameen,
    x,
    y,
    rect: { w: 24, h: 20 },
    isNew: true,
  });
};

function SpotPlaceNamePopup({
  x,
  y,
  invZoom,
  placedSpotIds,
  onConfirm,
  onCancel,
}) {
  const searchRef = useRef(null);
  const nameInputRef = useRef(null);
  const [mode, setMode] = useState("master");
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [nameen, setNameen] = useState("");
  const [customId, setCustomId] = useState("");

  useEffect(() => {
    if (mode === "master") searchRef.current?.focus();
    else nameInputRef.current?.focus();
  }, [mode]);

  const shellStyle = {
    position: "absolute",
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(10px, 10px) scale(${invZoom})`,
    transformOrigin: "0 0",
    zIndex: 200,
    pointerEvents: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "8px 10px",
    minWidth: mode === "master" ? 240 : 160,
    background: "rgb(20 20 20 / 0.96)",
    color: "#fff",
    fontSize: 12,
    borderRadius: 8,
    boxShadow: "0 4px 16px rgb(0 0 0 / 0.4)",
    border: "1px solid #666",
  };

  const inputStyle = {
    padding: "4px 6px",
    borderRadius: 4,
    border: "1px solid #666",
    background: "#222",
    color: "#fff",
  };

  const pickMaster = (master) => {
    const id = master.aliasSpotIds?.[0] || master.masterId;
    onConfirm({
      id,
      name: master.nameJa,
      nameen: master.nameEn || "",
    });
  };

  const filteredMasters = RAKUCHU_SPOT_MASTERS.filter((master) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      master.nameJa.toLowerCase().includes(q) ||
      (master.nameEn || "").toLowerCase().includes(q) ||
      master.masterId.toLowerCase().includes(q)
    );
  });

  const onSubmitManual = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const idTrim = customId.trim();
    onConfirm({
      id: idTrim || undefined,
      name: trimmed,
      nameen: nameen.trim(),
    });
  };

  return (
    <div
      role="dialog"
      aria-label={mode === "master" ? "マスターからスポット選択" : "新規スポット名"}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={shellStyle}
    >
      {mode === "master" ? (
        <>
          <input
            ref={searchRef}
            type="search"
            placeholder="絞り込み（日本語・英語・id）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancel();
            }}
            style={inputStyle}
          />
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              maxHeight: 220,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {filteredMasters.map((master) => {
              const placed = isMasterSpotPlaced(master, placedSpotIds);
              return (
                <li key={master.masterId}>
                  <button
                    type="button"
                    onClick={() => pickMaster(master)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "5px 6px",
                      borderRadius: 4,
                      border: "1px solid #444",
                      background: "#2a2a2a",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 12,
                      lineHeight: 1.35,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{master.nameJa}</span>
                    {master.nameEn ? (
                      <span style={{ display: "block", color: "#aaa", fontSize: 11 }}>
                        {master.nameEn}
                      </span>
                    ) : null}
                    {placed ? (
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 2,
                          padding: "1px 5px",
                          fontSize: 10,
                          borderRadius: 4,
                          background: "#444",
                          color: "#ccc",
                        }}
                      >
                        配置済
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => setMode("manual")}
            style={{
              padding: "4px 6px",
              background: "transparent",
              color: "#9cf",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              textAlign: "left",
            }}
          >
            マスターにない個別スポットを手入力 →
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "4px 8px",
              background: "transparent",
              color: "#aaa",
              border: "1px solid #555",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            キャンセル
          </button>
        </>
      ) : (
        <>
          <input
            ref={nameInputRef}
            type="text"
            placeholder="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmitManual();
              if (e.key === "Escape") onCancel();
            }}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="nameen（任意）"
            value={nameen}
            onChange={(e) => setNameen(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmitManual();
              if (e.key === "Escape") onCancel();
            }}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="id（任意・空欄なら自動採番）"
            value={customId}
            onChange={(e) => setCustomId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmitManual();
              if (e.key === "Escape") onCancel();
            }}
            style={inputStyle}
          />
          <button
            type="button"
            disabled={!name.trim()}
            onClick={onSubmitManual}
            style={{
              padding: "5px 8px",
              background: "#54896a",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            確定
          </button>
          <button
            type="button"
            onClick={() => setMode("master")}
            style={{
              padding: "4px 6px",
              background: "transparent",
              color: "#9cf",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              textAlign: "left",
            }}
          >
            ← マスターから選択
          </button>
        </>
      )}
    </div>
  );
}

const discardPendingForSlug = (slug) => {
  clearPendingForSlug(slug);
  if (slug) addedSpotsBySlug.delete(slug);
  discardListeners.forEach((fn) => {
    fn(slug);
  });
};

function SpotPinsEditSaveBar() {
  const router = useRouter();
  const isEditMode =
    process.env.NODE_ENV === "development" && router.query.editSpots === "1";
  const [isHost, setIsHost] = useState(false);
  const [, bump] = useState(0);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [, placeModeBump] = useState(0);

  useEffect(() => {
    if (!isEditMode) return undefined;
    if (editBarHostRef.taken) return undefined;
    editBarHostRef.taken = true;
    setIsHost(true);
    return () => {
      editBarHostRef.taken = false;
    };
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode || !isHost) return undefined;
    const fn = () => bump((n) => n + 1);
    pendingListeners.add(fn);
    return () => pendingListeners.delete(fn);
  }, [isEditMode, isHost]);

  useEffect(() => {
    if (!isEditMode || !isHost) return undefined;
    const fn = () => placeModeBump((n) => n + 1);
    placeModeListeners.add(fn);
    return () => placeModeListeners.delete(fn);
  }, [isEditMode, isHost]);

  useEffect(() => {
    if (!saveStatus) return undefined;
    const t = setTimeout(() => setSaveStatus(null), 4000);
    return () => clearTimeout(t);
  }, [saveStatus]);

  if (!isEditMode || !isHost) return null;

  const slug = getSlugFromPath();
  const bySpot = pendingUpdatesBySlug.get(slug);
  const count = bySpot ? bySpot.size : 0;

  const onSaveAll = () => {
    if (!slug || !bySpot?.size || saving) return;
    const updates = Array.from(bySpot.values());
    const n = updates.length;
    setSaving(true);
    fetch("/api/dev/update-spot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, updates }),
    })
      .then((res) => {
        if (!res.ok) {
          setSaveStatus(`一括保存失敗 (${res.status})`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data === null) return;
        clearPendingForSlug(slug);
        addedSpotsBySlug.delete(slug);
        setSaveStatus(`一括保存完了（${n}件）`);
      })
      .catch(() => setSaveStatus("一括保存失敗"))
      .finally(() => setSaving(false));
  };

  const onDiscard = () => {
    if (saving) return;
    discardPendingForSlug(slug);
    setPlaceModeEnabled(false);
    setSaveStatus(null);
  };

  const onTogglePlaceMode = () => {
    setPlaceModeEnabled(!placeModeEnabled);
  };

  return typeof document !== "undefined"
    ? createPortal(
        <div
      role="toolbar"
      aria-label="スポット編集の一括保存"
      style={{
        position: "fixed",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20000,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: "rgb(20 20 20 / 0.94)",
        color: "#fff",
        fontSize: 13,
        borderRadius: 10,
        boxShadow: "0 4px 20px rgb(0 0 0 / 0.35)",
      }}
    >
      {saveStatus ? (
        <span role="status" aria-live="polite">
          {saveStatus}
        </span>
      ) : (
        <>
          <button
            type="button"
            disabled={saving}
            onClick={onTogglePlaceMode}
            aria-pressed={placeModeEnabled}
            style={{
              padding: "6px 12px",
              background: placeModeEnabled ? "#54896a" : "transparent",
              color: "#fff",
              border: placeModeEnabled
                ? "1px solid #54896a"
                : "1px solid #888",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ＋ クリックで配置（{placeModeEnabled ? "ON" : "OFF"}）
          </button>
          {placeModeEnabled ? (
            <span style={{ fontSize: 12, color: "#ccc", maxWidth: 220 }}>
              絵巻上の追加したい場所をクリックしてください
            </span>
          ) : null}
          <button
            type="button"
            disabled={saving || count === 0}
            onClick={onSaveAll}
            style={{
              padding: "6px 12px",
              background: "#ff8c77",
              color: "#111",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: saving ? "wait" : "pointer",
              opacity: count === 0 ? 0.5 : 1,
            }}
          >
            すべてJSONに保存（{count}件）
          </button>
          <button
            type="button"
            disabled={saving || count === 0}
            onClick={onDiscard}
            style={{
              padding: "6px 12px",
              background: "transparent",
              color: "#ccc",
              border: "1px solid #666",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            変更を破棄
          </button>
        </>
      )}
    </div>,
        document.body,
      )
    : null;
}

const SpotPins = ({ spots, linkId, zoomScale = 1, sliceIndex }) => {
  // chapterToggle はフッターの「段タイトルを非表示」トグル（AppContext 正本）。
  // 屏風では段タイトル枠が無いため、このフラグを名所スポットピンの表示に流用する。
  // SpotPins は spots 保持スライス（＝屏風）にのみ描画されるので通常絵巻に影響しない。
  const { handleToId, chapterToggle } = useContext(AppContext);
  // 英語ロケールでは nameen を優先表示（未設定なら日本語 name へフォールバック）。
  // useLocale は重量データ（staticData / metadata-cache）を引き込むため router を直接参照する。
  const router = useRouter();
  const { locale } = router;
  const isEditMode =
    process.env.NODE_ENV === "development" && router.query.editSpots === "1";
  // 実測用: layer（=スライス幅 W）と各ピン button（=ラベル実幅 w）
  const layerRef = useRef(null);
  const [detectedSliceIndex, setDetectedSliceIndex] = useState(null);
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
  const [placeModeOn, setPlaceModeOn] = useState(placeModeEnabled);
  const [placeDraft, setPlaceDraft] = useState(null);

  useEffect(() => {
    if (Number.isInteger(sliceIndex)) {
      setDetectedSliceIndex(sliceIndex);
      return;
    }
    const layer = layerRef.current;
    if (!layer) return;
    const layers = document.querySelectorAll('[data-spotpins-layer="1"]');
    const idx = Array.from(layers).indexOf(layer);
    if (idx >= 0) setDetectedSliceIndex(idx);
  }, [sliceIndex]);

  const effectiveSliceIndex = Number.isInteger(sliceIndex)
    ? sliceIndex
    : detectedSliceIndex;

  useEffect(() => {
    if (isEditMode && Number.isInteger(effectiveSliceIndex))
      currentEditSliceRef.sliceIndex = effectiveSliceIndex;
  }, [isEditMode, effectiveSliceIndex]);

  useEffect(() => {
    if (!isEditMode) return undefined;
    const syncPlace = () => setPlaceModeOn(placeModeEnabled);
    placeModeListeners.add(syncPlace);
    return () => placeModeListeners.delete(syncPlace);
  }, [isEditMode]);

  useEffect(() => {
    if (!placeModeOn) setPlaceDraft(null);
  }, [placeModeOn]);

  useEffect(() => {
    if (!isEditMode) return undefined;
    const fn = () => pendingBump((n) => n + 1);
    pendingListeners.add(fn);
    return () => pendingListeners.delete(fn);
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) return undefined;
    const slug = getSlugFromPath();
    const fn = (s) => {
      if (s !== slug) return;
      setDragOverrides({});
      pendingBump((n) => n + 1);
    };
    discardListeners.add(fn);
    return () => discardListeners.delete(fn);
  }, [isEditMode]);

  const editSlug = isEditMode ? getSlugFromPath() : "";

  useEffect(() => {
    if (!editSlug || !Number.isInteger(effectiveSliceIndex)) return;
    let bySlice = sliceSpotIdsBySlug.get(editSlug);
    if (!bySlice) {
      bySlice = new Map();
      sliceSpotIdsBySlug.set(editSlug, bySlice);
    }
    bySlice.set(
      effectiveSliceIndex,
      (spots || []).map((s) => s.id).filter(Boolean),
    );
  }, [editSlug, effectiveSliceIndex, spots]);

  const addedForSlice =
    isEditMode && editSlug && Number.isInteger(effectiveSliceIndex)
      ? (addedSpotsBySlug.get(editSlug) || []).filter(
          (a) =>
            Number.isInteger(a.sliceIndex) &&
            a.sliceIndex === effectiveSliceIndex,
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
      {isEditMode ? <SpotPinsEditSaveBar /> : null}
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
            placedSpotIds={getPlacedSpotIdsForSlug(editSlug)}
            onCancel={() => setPlaceDraft(null)}
            onConfirm={({ id, name, nameen }) => {
              const slug = getSlugFromPath();
              if (!slug || !name || !Number.isInteger(effectiveSliceIndex))
                return;
              const spotId = id || `spot-${Date.now()}`;
              registerNewSpot(slug, {
                spotId,
                sliceIndex: effectiveSliceIndex,
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
          const kind = getSpotVisualKind(spot.id);
          const kindClass =
            kind === "power"
              ? styles.pinPower
              : kind === "temple"
                ? styles.pinTemple
                : kind === "water"
                  ? styles.pinWater
                  : styles.pinTown;
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
                mergePendingUpdate(getSlugFromPath(), spot.id, {
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
                        mergePendingUpdate(getSlugFromPath(), spot.id, patch);
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
                    mergePendingUpdate(getSlugFromPath(), spot.id, {
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
