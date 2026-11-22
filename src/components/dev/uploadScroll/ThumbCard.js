import { useEffect, useRef, useState } from "react";

const ui = {
  btnSmall: {
    background: "#e2e8f0",
    color: "#334155",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: 11,
    cursor: "pointer",
  },
  btnDanger: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: 11,
    cursor: "pointer",
  },
};

function renderSharpenedPreview(img, canvas, percent, zoom) {
  if (!img || !canvas) return;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${Math.round(w * zoom)}px`;
  canvas.style.height = `${Math.round(h * zoom)}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, w, h);
  const amount = Math.max(0, Math.min(100, Number(percent) || 0)) / 100;
  if (amount <= 0 || w < 3 || h < 3) return;
  const imgData = ctx.getImageData(0, 0, w, h);
  const src = imgData.data;
  const copy = new Uint8ClampedArray(src);
  const strength = amount * 1.2;
  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const idx = (row + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const blur =
          (copy[((row - w) + (x - 1)) * 4 + c] +
            2 * copy[((row - w) + x) * 4 + c] +
            copy[((row - w) + (x + 1)) * 4 + c] +
            2 * copy[(row + (x - 1)) * 4 + c] +
            4 * center +
            2 * copy[(row + (x + 1)) * 4 + c] +
            copy[((row + w) + (x - 1)) * 4 + c] +
            2 * copy[((row + w) + x) * 4 + c] +
            copy[((row + w) + (x + 1)) * 4 + c]) /
          16;
        src[idx + c] = center + (center - blur) * strength;
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

export function ThumbCard({ nn, item, index, total, onMove, onRemove, rtl }) {
  const disabledBtn = { opacity: 0.35, cursor: "not-allowed" };
  const [modalOpen, setModalOpen] = useState(false);
  const [testSharpen, setTestSharpen] = useState(0);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!modalOpen) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      renderSharpenedPreview(img, canvasRef.current, testSharpen, zoom);
    };
    img.src = item.preview;
  }, [modalOpen, item.preview]);

  useEffect(() => {
    if (!modalOpen || !imgRef.current) return;
    renderSharpenedPreview(imgRef.current, canvasRef.current, testSharpen, zoom);
  }, [modalOpen, testSharpen, zoom]);

  return (
    <>
      <div
        style={{
          width: 240,
          flexShrink: 0,
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 8,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.preview}
          alt=""
          onClick={() => {
            setTestSharpen(0);
            setZoom(1);
            setModalOpen(true);
          }}
          title="クリックして拡大・シャープネス確認"
          style={{
            display: "block",
            marginBottom: 8,
            width: "100%",
            height: "auto",
            maxHeight: 220,
            borderRadius: 4,
            objectFit: "contain",
            background: "#f8fafc",
            cursor: "zoom-in",
          }}
        />
        <p style={{ margin: 0, textAlign: "center", fontSize: 12, fontFamily: "monospace", color: "#1e3a5f" }}>
          {nn}
          {rtl ? " · RTL表示" : ""}
        </p>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 4 }}>
          <button
            type="button"
            style={{ ...ui.btnSmall, ...(index === 0 ? disabledBtn : {}) }}
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
            title={rtl ? "右へ（序盤へ）" : "前へ"}
          >
            ↑
          </button>
          <button
            type="button"
            style={{ ...ui.btnSmall, ...(index === total - 1 ? disabledBtn : {}) }}
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
            title={rtl ? "左へ（終盤へ）" : "後ろへ"}
          >
            ↓
          </button>
          <button type="button" style={ui.btnDanger} onClick={() => onRemove(index)}>
            ×
          </button>
        </div>
      </div>

      {modalOpen ? (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.85)",
            display: "flex",
            flexDirection: "column",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: "10px 16px",
              marginBottom: 12,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <strong style={{ fontSize: 14, color: "#0f172a" }}>
              プレビュー確認: {nn}（クリック・スクロールで細部確認）
            </strong>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}>
                表示倍率:
                {[0.5, 1, 1.5, 2].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZoom(z)}
                    style={{
                      ...ui.btnSmall,
                      background: zoom === z ? "#0284c7" : "#e2e8f0",
                      color: zoom === z ? "#fff" : "#334155",
                      fontWeight: 700,
                    }}
                  >
                    {Math.round(z * 100)}%
                  </button>
                ))}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}>
                追加シャープネス確認:
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={testSharpen}
                  onChange={(e) => setTestSharpen(Number(e.target.value))}
                />
                <span style={{ fontFamily: "monospace", minWidth: 42 }}>+{testSharpen}%</span>
              </label>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ ...ui.btnDanger, padding: "6px 12px", fontSize: 13, fontWeight: 700 }}
              >
                閉じる
              </button>
            </div>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              overflow: "auto",
              background: "#1e293b",
              borderRadius: 8,
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              padding: 24,
            }}
          >
            <canvas ref={canvasRef} style={{ display: "block", boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }} />
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ThumbCard;