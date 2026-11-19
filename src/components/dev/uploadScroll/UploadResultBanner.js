import { formatUploadTimestamp } from "@/lib/dev/uploadScroll/yamlValidator";

const ui = {
  btnSecondary: {
    background: "#fff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
};

export function UploadResultBanner({
  lastSuccessResult,
  onDismiss,
  onCopyUrl,
  urlCopyMessage,
}) {
  if (!lastSuccessResult) return null;

  return (
    <section
      style={{
        position: "relative",
        marginBottom: 20,
        padding: "16px 18px",
        borderRadius: 10,
        border: "1px solid #86efac",
        background: "#ecfdf5",
        color: "#065f46",
      }}
      aria-live="polite"
    >
      <button
        type="button"
        aria-label="完了バナーを閉じる"
        onClick={onDismiss}
        style={{
          position: "absolute",
          top: 10,
          right: 12,
          border: "none",
          background: "transparent",
          color: "#047857",
          fontSize: 20,
          lineHeight: 1,
          cursor: "pointer",
          padding: 4,
        }}
      >
        ×
      </button>
      <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700 }}>
        <span
          style={{
            display: "inline-block",
            padding: "3px 8px",
            borderRadius: 6,
            background: "#059669",
            color: "#fff",
            marginRight: 8,
          }}
        >
          {lastSuccessResult.mode === "local"
            ? "[ローカル先行検証完了（R2未アップロード）]"
            : "[Cloudflare R2 本番同期完了]"}
        </span>
      </p>
      <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600 }}>
        {lastSuccessResult.title || "（タイトル未設定）"}
      </p>
      <p style={{ margin: "0 0 10px", fontSize: 13, color: "#047857" }}>
        titleen: <code style={{ fontFamily: "monospace" }}>{lastSuccessResult.titleen || "—"}</code>
        {" · "}
        実行: {formatUploadTimestamp(lastSuccessResult.timestamp)}
      </p>
      {lastSuccessResult.viewerUrl ? (
        <div style={{ marginBottom: 10 }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#065f46" }}>
            同期先 URL
          </p>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 13,
              fontFamily: "monospace",
              wordBreak: "break-all",
            }}
          >
            {lastSuccessResult.viewerUrl}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <a
              href={
                lastSuccessResult.viewerUrl.startsWith("/")
                  ? lastSuccessResult.viewerUrl
                  : lastSuccessResult.viewerUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#047857",
                textDecoration: "underline",
              }}
            >
              作品ページを開く（別タブ）
            </a>
            <button
              type="button"
              style={{
                ...ui.btnSecondary,
                padding: "6px 12px",
                fontSize: 13,
              }}
              onClick={() => onCopyUrl(lastSuccessResult.viewerUrl)}
            >
              URLをコピー
            </button>
            {urlCopyMessage ? (
              <span style={{ fontSize: 12, color: "#059669" }}>{urlCopyMessage}</span>
            ) : null}
          </div>
        </div>
      ) : null}
      {lastSuccessResult.mode === "local" ? (
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#047857" }}>
          ローカル表示に問題がなければ、下の「② Cloudflare R2 へ本番アップロード ＆ 同期」を実行してください。
        </p>
      ) : null}
    </section>
  );
}