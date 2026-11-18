/**
 * SpotPinsEditSaveBar — 開発モード（?editSpots=1）時の上部固定一括保存ツールバー。
 * spotPinsEditStore / spotPinsGeometry 経由で slug・pending・配置モードを共有し、
 * 他コンテンツの update API にも apiEndpoint で差し替え可能。
 */
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// =============================================================================
// 1. 編集ストア — pending 件数・配置モード・ホスト排他・API 一括保存
// =============================================================================
import {
  claimEditBarHost,
  discardPendingForSlug,
  getPendingUpdatesForSlug,
  getPlaceModeEnabled,
  releaseEditBarHost,
  savePendingUpdatesToApi,
  setPlaceModeEnabled,
  subscribePendingUpdates,
  subscribePlaceMode,
} from "./spotPinsEditStore";

// =============================================================================
// 2. slug 解決 — pathname 末尾セグメント（props 未指定時のフォールバック）
// =============================================================================
import { getSlugFromPath } from "./spotPinsGeometry";

/**
 * @param {object} props
 * @param {string} [props.slugOverride] 絵巻 slug を明示指定（未指定時は現在 pathname）
 * @param {string} [props.apiEndpoint] 一括保存 POST 先（既定: /api/dev/update-spot）
 * @param {boolean} [props.quizOnlyEdit] クイズ枠のみ編集表示
 * @param {() => void} [props.onToggleQuizOnlyEdit] クイズ枠のみ切替
 */
export default function SpotPinsEditSaveBar({
  slugOverride,
  apiEndpoint = "/api/dev/update-spot",
  quizOnlyEdit = false,
  onToggleQuizOnlyEdit,
}) {
  const router = useRouter();
  const isEditMode =
    process.env.NODE_ENV === "development" && router.query.editSpots === "1";
  const [isHost, setIsHost] = useState(false);
  const [, bump] = useState(0);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [, placeModeBump] = useState(0);

  // 複数 SpotPins インスタンスのうち、ツールバーは1ホストのみ表示
  useEffect(() => {
    if (!isEditMode) return undefined;
    if (!claimEditBarHost()) return undefined;
    setIsHost(true);
    return () => {
      releaseEditBarHost();
      setIsHost(false);
    };
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode || !isHost) return undefined;
    return subscribePendingUpdates(() => bump((n) => n + 1));
  }, [isEditMode, isHost]);

  useEffect(() => {
    if (!isEditMode || !isHost) return undefined;
    return subscribePlaceMode(() => placeModeBump((n) => n + 1));
  }, [isEditMode, isHost]);

  useEffect(() => {
    if (!saveStatus) return undefined;
    const t = setTimeout(() => setSaveStatus(null), 4000);
    return () => clearTimeout(t);
  }, [saveStatus]);

  if (!isEditMode || !isHost) return null;

  const slug =
    slugOverride ??
    getSlugFromPath(
      typeof window !== "undefined" ? window.location.pathname : "",
    );
  const normalizedSlug = String(slug || "").trim().replace(/-/g, "_");
  let bySpot = getPendingUpdatesForSlug(normalizedSlug);
  if (!bySpot?.size && slug) {
    const fallbackBySpot = getPendingUpdatesForSlug(slug);
    if (fallbackBySpot?.size) {
      bySpot = fallbackBySpot;
    }
  }
  const count = bySpot ? bySpot.size : 0;
  const placeModeEnabled = getPlaceModeEnabled();

  const onSaveAll = async () => {
    let pendingBySpot = getPendingUpdatesForSlug(normalizedSlug);
    if (!pendingBySpot?.size && slug) {
      const fallbackBySpot = getPendingUpdatesForSlug(slug);
      if (fallbackBySpot?.size) {
        pendingBySpot = fallbackBySpot;
      }
    }
    const saveCount = pendingBySpot ? pendingBySpot.size : 0;
    if (!slug || !pendingBySpot?.size || saving) return;
    const n = saveCount;
    setSaving(true);
    const result = await savePendingUpdatesToApi(normalizedSlug, apiEndpoint);
    if (result.ok) {
      setSaveStatus(`すべて保存完了（JSON・クイズTS、${n}件）`);
    } else if (result.status) {
      setSaveStatus(`すべて保存失敗 (${result.status})`);
    } else {
      setSaveStatus("すべて保存失敗");
    }
    setSaving(false);
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
          aria-label="スポット編集のすべて保存（JSON・クイズTS）"
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
              {onToggleQuizOnlyEdit && (
                <button
                  type="button"
                  onClick={onToggleQuizOnlyEdit}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    backgroundColor: quizOnlyEdit
                      ? "#2563eb"
                      : "rgba(255,255,255,0.12)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.25)",
                    cursor: "pointer",
                  }}
                >
                  {quizOnlyEdit ? "クイズ枠のみ: ON" : "クイズ枠のみ: OFF"}
                </button>
              )}
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
                すべて保存（{count}件）
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