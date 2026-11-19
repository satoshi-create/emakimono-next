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

export function ThumbCard({ nn, item, index, total, onMove, onRemove, rtl }) {
  const disabledBtn = { opacity: 0.35, cursor: "not-allowed" };
  return (
    <div
      style={{
        width: 140,
        flexShrink: 0,
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: 8,
        background: "#fff",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.preview}
        alt=""
        style={{
          display: "block",
          marginBottom: 8,
          height: 80,
          width: "100%",
          borderRadius: 4,
          objectFit: "cover",
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
  );
}

export default ThumbCard;