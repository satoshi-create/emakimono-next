import Head from "next/head";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";

const TYPEEN_MAP = {
  絵巻: "emaki",
  屏風: "byobu",
  鳥瞰図: "birdseye",
};

const emptyScene = () => ({
  title: "",
  titleen: "",
  rangeStart: "1",
  rangeEnd: "1",
  gendaibun: "",
  kobun: "",
  desc: "",
});

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function extFromFile(file) {
  const name = file.name || "";
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  if (m) return m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

const ui = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    color: "#0f172a",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: 15,
    lineHeight: 1.5,
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "24px",
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "20px",
    background: "#fff",
  },
  cardInner: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "12px",
    background: "#f8fafc",
  },
  h1: { margin: 0, fontSize: 24, fontWeight: 700, color: "#1e3a5f" },
  h2: { margin: 0, fontSize: 18, fontWeight: 600, color: "#334155" },
  subtitle: { margin: "8px 0 0", fontSize: 14, color: "#64748b" },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "1px solid #e2e8f0",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  stack: { display: "flex", flexDirection: "column", gap: "16px" },
  label: {
    display: "block",
    marginBottom: 4,
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "8px 10px",
    width: "100%",
    boxSizing: "border-box",
    fontSize: 14,
    background: "#fff",
    color: "#0f172a",
  },
  textarea: {
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "8px 10px",
    width: "100%",
    boxSizing: "border-box",
    fontSize: 14,
    minHeight: 88,
    resize: "vertical",
    background: "#fff",
    color: "#0f172a",
  },
  textareaSm: {
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "8px 10px",
    width: "100%",
    boxSizing: "border-box",
    fontSize: 14,
    minHeight: 64,
    resize: "vertical",
    background: "#fff",
    color: "#0f172a",
  },
  rowBetween: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  btnPrimary: {
    background: "#1e3a5f",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
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
  btnAdd: {
    background: "#fff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: 13,
    cursor: "pointer",
  },
  btnTextDanger: {
    background: "none",
    border: "none",
    color: "#dc2626",
    fontSize: 12,
    cursor: "pointer",
    padding: 0,
  },
  actions: { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  logPanel: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "20px",
    background: "#fff",
    fontSize: 14,
  },
  pre: {
    maxHeight: 256,
    overflow: "auto",
    borderRadius: "6px",
    background: "#0f172a",
    color: "#e2e8f0",
    padding: 12,
    fontSize: 12,
    whiteSpace: "pre-wrap",
    margin: 0,
  },
  preErr: {
    maxHeight: 256,
    overflow: "auto",
    borderRadius: "6px",
    background: "#422006",
    color: "#fde68a",
    padding: 12,
    fontSize: 12,
    whiteSpace: "pre-wrap",
    margin: 0,
  },
};

function dropZoneStyle(isDragging) {
  return {
    border: isDragging ? "2px dashed #3b82f6" : "2px dashed #94a3b8",
    background: isDragging ? "#eff6ff" : "#f8fafc",
    borderRadius: "8px",
    minHeight: 120,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "32px 16px",
    marginBottom: 16,
    cursor: "pointer",
  };
}

function thumbGridStyle(rtlPreview) {
  return {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    flexDirection: rtlPreview ? "row-reverse" : "row",
    justifyContent: rtlPreview ? "flex-end" : "flex-start",
  };
}

// === 1. 状態管理（State） ===

function DevUploadScrollPage() {
  const [scrollId, setScrollId] = useState("kyoto-birdseye-1947");
  const [metaId, setMetaId] = useState("107");
  const [title, setTitle] = useState("");
  const [titleen, setTitleen] = useState("");
  const [author, setAuthor] = useState("");
  const [authoren, setAuthoren] = useState("");
  const [era, setEra] = useState("");
  const [eraen, setEraen] = useState("");
  const [type, setType] = useState("鳥瞰図");
  const [typeen, setTypeen] = useState("birdseye");
  const [desc, setDesc] = useState("");
  const [descen, setDescen] = useState("");
  const [sourceCollection, setSourceCollection] = useState("");
  const [sourceImageUrl, setSourceImageUrl] = useState("");
  const [sourceLicense, setSourceLicense] = useState("");

  const [imageItems, setImageItems] = useState([]);
  const [rtlPreview, setRtlPreview] = useState(true);
  const [scenes, setScenes] = useState([emptyScene()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultLog, setResultLog] = useState(null);

  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const previewOrder = useMemo(
    () => (rtlPreview ? [...imageItems].reverse() : imageItems),
    [imageItems, rtlPreview]
  );

  const addFiles = useCallback((fileList) => {
    const files = Array.from(fileList || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;
    const next = files.map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setImageItems((prev) => [...prev, ...next]);
  }, []);

  const removeImage = (index) => {
    setImageItems((prev) => {
      const item = prev[index];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const moveImage = (index, delta) => {
    const next = index + delta;
    if (next < 0 || next >= imageItems.length) return;
    setImageItems((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  };

  const updateScene = (index, field, value) => {
    setScenes((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const onTypeChange = (value) => {
    setType(value);
    if (TYPEEN_MAP[value]) setTypeen(TYPEEN_MAP[value]);
  };

  // === 2. 画像変換・API送信ハンドラ ===

  const buildMetadata = () => ({
    id: Number(metaId) || 0,
    title,
    titleen,
    author,
    authoren,
    era,
    eraen,
    type,
    typeen,
    desc,
    descen,
    sourceCollection,
    sourceImageUrl,
    sourceLicense,
    thumb: "",
    thumb2: "",
    backgroundImage: "",
    video: "",
    encodeUrl: "",
    favorite: false,
    kotobagaki: false,
    sceneText: true,
    readMore: false,
    volume_num: 1,
    folder: "emakimono",
  });

  const buildScenesPayload = () =>
    scenes.map((s, i) => {
      const start = Number(s.rangeStart) || 1;
      const end = Number(s.rangeEnd) || start;
      const textParts = [s.kobun, s.gendaibun, s.desc].filter(Boolean);
      return {
        id: i + 1,
        title: s.title,
        titleen: s.titleen,
        range: [Math.min(start, end), Math.max(start, end)],
        text: textParts.join("\n\n"),
        gendaibun: s.gendaibun,
        kobun: s.kobun,
        desc: s.desc,
      };
    });

  const submitUpload = async (dryRun) => {
    if (!scrollId.trim()) {
      setResultLog({ error: "scrollId を入力してください" });
      return;
    }
    if (imageItems.length < 1) {
      setResultLog({ error: "画像を1枚以上追加してください" });
      return;
    }

    setIsSubmitting(true);
    setResultLog(null);

    try {
      const images = await Promise.all(
        imageItems.map(async (item) => ({
          base64: await fileToDataUrl(item.file),
          ext: extFromFile(item.file),
        }))
      );

      const res = await fetch("/api/dev/upload-scroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scrollId: scrollId.trim(),
          metadata: buildMetadata(),
          scenes: buildScenesPayload(),
          images,
          dryRun,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResultLog({
          error: data.error || `HTTP ${res.status}`,
          exitCode: data.exitCode,
          stderr: data.stderr,
          stdout: data.stdout,
        });
        return;
      }

      setResultLog({
        ok: data.ok,
        exitCode: data.exitCode,
        stdout: data.stdout,
        stderr: data.stderr,
        titleen: data.titleen,
        dryRun,
      });
    } catch (err) {
      setResultLog({
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const btnDisabled = { opacity: 0.5, cursor: "not-allowed" };

  // === 3. UI表示（View） ===

  return (
    <>
      <Head>
        <title>Dev — Scroll Upload</title>
        <meta name="robots" content="noindex" />
      </Head>
      <style jsx global>{`
        @media (max-width: 640px) {
          .upload-scroll-grid2 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={ui.page}>
        <div style={ui.container}>
          <header style={ui.header}>
            <h1 style={ui.h1}>絵巻一発登録（開発専用）</h1>
            <p style={ui.subtitle}>
              R2アップロード &amp; scroll_config / JSON 同期 — NODE_ENV=development のみ
            </p>
          </header>

          <section style={ui.card}>
            <h2 style={{ ...ui.h2, marginBottom: 16 }}>作品メタ情報</h2>
            <div className="upload-scroll-grid2" style={ui.grid2}>
              <Field label="scroll_id">
                <input
                  style={ui.input}
                  value={scrollId}
                  onChange={(e) => setScrollId(e.target.value)}
                  placeholder="kyoto-birdseye-1947"
                />
              </Field>
              <Field label="id（数値）">
                <input
                  style={ui.input}
                  value={metaId}
                  onChange={(e) => setMetaId(e.target.value)}
                  type="number"
                />
              </Field>
              <Field label="title">
                <input style={ui.input} value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field label="titleen（スラッグ）">
                <input style={ui.input} value={titleen} onChange={(e) => setTitleen(e.target.value)} />
              </Field>
              <Field label="author">
                <input style={ui.input} value={author} onChange={(e) => setAuthor(e.target.value)} />
              </Field>
              <Field label="authoren">
                <input style={ui.input} value={authoren} onChange={(e) => setAuthoren(e.target.value)} />
              </Field>
              <Field label="era">
                <input style={ui.input} value={era} onChange={(e) => setEra(e.target.value)} />
              </Field>
              <Field label="eraen">
                <input style={ui.input} value={eraen} onChange={(e) => setEraen(e.target.value)} />
              </Field>
              <Field label="type">
                <select style={ui.input} value={type} onChange={(e) => onTypeChange(e.target.value)}>
                  <option value="絵巻">絵巻</option>
                  <option value="屏風">屏風</option>
                  <option value="鳥瞰図">鳥瞰図</option>
                </select>
              </Field>
              <Field label="typeen">
                <input style={ui.input} value={typeen} onChange={(e) => setTypeen(e.target.value)} />
              </Field>
            </div>
            <div style={{ ...ui.stack, marginTop: 16 }}>
              <Field label="desc（日本語）">
                <textarea style={ui.textarea} value={desc} onChange={(e) => setDesc(e.target.value)} />
              </Field>
              <Field label="descen">
                <textarea style={ui.textarea} value={descen} onChange={(e) => setDescen(e.target.value)} />
              </Field>
              <Field label="sourceCollection">
                <input
                  style={ui.input}
                  value={sourceCollection}
                  onChange={(e) => setSourceCollection(e.target.value)}
                />
              </Field>
              <Field label="sourceImageUrl">
                <input
                  style={ui.input}
                  value={sourceImageUrl}
                  onChange={(e) => setSourceImageUrl(e.target.value)}
                />
              </Field>
              <Field label="sourceLicense">
                <input
                  style={ui.input}
                  value={sourceLicense}
                  onChange={(e) => setSourceLicense(e.target.value)}
                />
              </Field>
            </div>
          </section>

          <section style={ui.card}>
            <div style={ui.rowBetween}>
              <h2 style={ui.h2}>画像（連番 {String(imageItems.length).padStart(2, "0")} 枚）</h2>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#475569" }}>
                <input
                  type="checkbox"
                  checked={rtlPreview}
                  onChange={(e) => setRtlPreview(e.target.checked)}
                />
                RTL プレビュー（右→左）
              </label>
            </div>

            <div
              role="button"
              tabIndex={0}
              style={dropZoneStyle(isDragging)}
              onDragEnter={(e) => {
                e.preventDefault();
                dragCounterRef.current += 1;
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                dragCounterRef.current -= 1;
                if (dragCounterRef.current <= 0) {
                  dragCounterRef.current = 0;
                  setIsDragging(false);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                dragCounterRef.current = 0;
                setIsDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>
                ドラッグ＆ドロップ、またはクリックで画像を追加
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
                複数選択可 · 保存順が連番 01, 02, … になります
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <div style={thumbGridStyle(rtlPreview)}>
              {previewOrder.map((item) => {
                const index = imageItems.indexOf(item);
                const nn = String(index + 1).padStart(2, "0");
                return (
                  <ThumbCard
                    key={item.key}
                    nn={nn}
                    item={item}
                    index={index}
                    total={imageItems.length}
                    onMove={moveImage}
                    onRemove={removeImage}
                    rtl={rtlPreview}
                  />
                );
              })}
            </div>
          </section>

          <section style={ui.card}>
            <div style={ui.rowBetween}>
              <h2 style={ui.h2}>段（scenes）</h2>
              <button type="button" style={ui.btnAdd} onClick={() => setScenes((prev) => [...prev, emptyScene()])}>
                + 段を追加
              </button>
            </div>
            {scenes.map((scene, i) => (
              <div key={i} style={ui.cardInner}>
                <div style={{ ...ui.rowBetween, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1e3a5f" }}>段 {i + 1}</span>
                  {scenes.length > 1 && (
                    <button
                      type="button"
                      style={ui.btnTextDanger}
                      onClick={() => setScenes((prev) => prev.filter((_, j) => j !== i))}
                    >
                      削除
                    </button>
                  )}
                </div>
                <div className="upload-scroll-grid2" style={ui.grid2}>
                  <Field label="title">
                    <input
                      style={ui.input}
                      value={scene.title}
                      onChange={(e) => updateScene(i, "title", e.target.value)}
                    />
                  </Field>
                  <Field label="titleen">
                    <input
                      style={ui.input}
                      value={scene.titleen}
                      onChange={(e) => updateScene(i, "titleen", e.target.value)}
                    />
                  </Field>
                  <Field label="rangeStart">
                    <input
                      style={ui.input}
                      type="number"
                      min={1}
                      value={scene.rangeStart}
                      onChange={(e) => updateScene(i, "rangeStart", e.target.value)}
                    />
                  </Field>
                  <Field label="rangeEnd">
                    <input
                      style={ui.input}
                      type="number"
                      min={1}
                      value={scene.rangeEnd}
                      onChange={(e) => updateScene(i, "rangeEnd", e.target.value)}
                    />
                  </Field>
                </div>
                <div style={{ ...ui.stack, marginTop: 12 }}>
                  <Field label="kobun（詞書原文）">
                    <textarea
                      style={{ ...ui.textareaSm, fontFamily: "serif" }}
                      value={scene.kobun}
                      onChange={(e) => updateScene(i, "kobun", e.target.value)}
                    />
                  </Field>
                  <Field label="gendaibun（現代語訳）">
                    <textarea
                      style={ui.textareaSm}
                      value={scene.gendaibun}
                      onChange={(e) => updateScene(i, "gendaibun", e.target.value)}
                    />
                  </Field>
                  <Field label="desc（解説）">
                    <textarea
                      style={ui.textareaSm}
                      value={scene.desc}
                      onChange={(e) => updateScene(i, "desc", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </section>

          <section style={ui.actions}>
            <button
              type="button"
              disabled={isSubmitting}
              style={{ ...ui.btnSecondary, ...(isSubmitting ? btnDisabled : {}) }}
              onClick={() => submitUpload(true)}
            >
              {isSubmitting ? "実行中…" : "Preflight / Dry Run（検証のみ）"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              style={{ ...ui.btnPrimary, ...(isSubmitting ? btnDisabled : {}) }}
              onClick={() => submitUpload(false)}
            >
              {isSubmitting ? "実行中…" : "R2アップロード ＆ 本番JSON同期を実行"}
            </button>
          </section>

          {resultLog && (
            <section style={ui.logPanel}>
              {resultLog.error && (
                <p style={{ margin: "0 0 12px", fontWeight: 600, color: "#dc2626" }}>
                  エラー: {resultLog.error}
                </p>
              )}
              {resultLog.ok != null && (
                <p
                  style={{
                    margin: "0 0 12px",
                    fontWeight: 600,
                    color: resultLog.ok ? "#059669" : "#d97706",
                  }}
                >
                  exitCode: {resultLog.exitCode} {resultLog.dryRun ? "(dry-run)" : ""}
                </p>
              )}
              {resultLog.titleen && resultLog.ok && (
                <p style={{ margin: "0 0 12px" }}>
                  公開ページ:{" "}
                  <Link
                    href={`/${resultLog.titleen}`}
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                  >
                    /{resultLog.titleen}
                  </Link>
                </p>
              )}
              {resultLog.stdout && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b" }}>stdout</p>
                  <pre style={ui.pre}>{resultLog.stdout}</pre>
                </div>
              )}
              {resultLog.stderr && (
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b" }}>stderr</p>
                  <pre style={ui.preErr}>{resultLog.stderr}</pre>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={ui.label}>{label}</label>
      {children}
    </div>
  );
}

function ThumbCard({ nn, item, index, total, onMove, onRemove, rtl }) {
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

export default DevUploadScrollPage;

export async function getServerSideProps() {
  if (process.env.NODE_ENV !== "development") {
    return { notFound: true };
  }
  return { props: {} };
}