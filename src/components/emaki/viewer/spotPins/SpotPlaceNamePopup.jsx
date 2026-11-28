/**
 * SpotPlaceNamePopup — スポット配置時の「マスター選択 or 手入力」ポップアップ（汎用）。
 *
 * 洛中洛外図以外の絵巻でも再利用できるよう、マスター一覧は Props で受け取る。
 */
import { useEffect, useRef, useState } from "react";
import { isMasterSpotPlaced } from "./spotPinsEditStore";

// =============================================================================
// 1. コンポーネント — 座標・ズーム補正付きダイアログ
// =============================================================================

/**
 * @param {object} props
 * @param {number} props.x — クリック位置 X（スライス幅に対する %）
 * @param {number} props.y — クリック位置 Y（%）
 * @param {number} props.invZoom — ズーム逆倍率（UI を一定サイズに見せる scale）
 * @param {Set<string>} props.placedSpotIds — 既配置 spotId（配置済バッジ用）
 * @param {Array<{ masterId: string, aliasSpotIds?: string[], nameJa: string, nameEn?: string, description?: string, badgeText?: string }>} [props.masterSpots]
 * @param {(payload: { id?: string, name: string, nameen: string, description?: string }) => void} props.onConfirm
 * @param {() => void} props.onCancel
 */
export default function SpotPlaceNamePopup({
  x,
  y,
  invZoom,
  placedSpotIds,
  masterSpots = [],
  onConfirm,
  onCancel,
}) {
  const hasMasters = masterSpots.length > 0;

  // 2. 状態 — masterSpots が空なら最初から手入力モード
  const searchRef = useRef(null);
  const nameInputRef = useRef(null);
  const [mode, setMode] = useState(hasMasters ? "master" : "manual");
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [nameen, setNameen] = useState("");
  const [description, setDescription] = useState("");
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

  // 3. 確定ハンドラ — マスター行クリック / 手入力フォーム
  const pickMaster = (master) => {
    const id = master.aliasSpotIds?.[0] || master.masterId;
    onConfirm({
      id,
      name: master.nameJa,
      nameen: master.nameEn || "",
      description: master.description || "",
    });
  };

  const filteredMasters = masterSpots.filter((master) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      master.nameJa.toLowerCase().includes(q) ||
      (master.nameEn || "").toLowerCase().includes(q) ||
      (master.description || "").toLowerCase().includes(q) ||
      (master.badgeText || "").toLowerCase().includes(q) ||
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
      description: description.trim(),
    });
  };

  // 4. 描画 — モード別 UI（キーボード: Escape キャンセル / Enter 確定）
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
                    {master.badgeText ? (
                      <span
                        style={{
                          display: "inline-block",
                          marginLeft: 6,
                          fontSize: 10,
                          color: "#bbb",
                          fontWeight: 500,
                        }}
                      >
                        {master.badgeText}
                      </span>
                    ) : null}
                    {master.description ? (
                      <span
                        style={{
                          display: "block",
                          color: "#9cc",
                          fontSize: 11,
                          marginTop: 2,
                        }}
                      >
                        {master.description}
                      </span>
                    ) : null}
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
          <textarea
            placeholder="訳・解説（任意）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancel();
            }}
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: 52,
              fontFamily: "inherit",
            }}
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
          {hasMasters ? (
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
          ) : null}
        </>
      )}
    </div>
  );
}