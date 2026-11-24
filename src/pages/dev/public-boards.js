import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getAllHubPages } from "@/libs/hubPages";

const pageStyle = {
  minHeight: "100vh",
  background: "#f4f6f9",
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  color: "#1a1a1a",
  padding: "2rem 1.5rem",
};

const innerStyle = {
  maxWidth: "720px",
  margin: "0 auto",
};

const titleStyle = {
  fontSize: "1.75rem",
  fontWeight: 700,
  margin: "0 0 0.5rem",
};

const subStyle = {
  fontSize: "0.9rem",
  color: "#5a5a5a",
  margin: "0 0 1.5rem",
};

const navRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem 1.25rem",
  marginBottom: "1.5rem",
  fontSize: "0.9rem",
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e6ec",
  borderRadius: "12px",
  padding: "1.25rem 1.35rem",
  marginBottom: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

const cardTitleStyle = {
  fontSize: "1.05rem",
  fontWeight: 600,
  margin: "0 0 0.85rem",
};

const labelStyle = {
  display: "block",
  fontSize: "0.85rem",
  fontWeight: 600,
  marginBottom: "0.35rem",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "0.6rem 0.75rem",
  border: "1px solid #c8ccd4",
  borderRadius: "8px",
  fontSize: "0.95rem",
  marginBottom: "0.85rem",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: "88px",
  resize: "vertical",
};

const linkButtonStyle = {
  display: "inline-block",
  padding: "10px 18px",
  background: "#1e40af",
  color: "#fff",
  borderRadius: "8px",
  textDecoration: "none",
  fontSize: "0.9rem",
  fontWeight: 500,
  border: "none",
  cursor: "pointer",
};

const secondaryLinkStyle = {
  color: "#1e40af",
  textDecoration: "none",
};

const listItemStyle = {
  borderTop: "1px solid #e8ecf0",
  paddingTop: "1rem",
  marginTop: "1rem",
};

const metaStyle = {
  fontSize: "0.8rem",
  color: "#666",
  margin: "0.35rem 0 0.65rem",
};

const errorStyle = {
  fontSize: "0.85rem",
  color: "#b91c1c",
  marginBottom: "0.75rem",
};

const adminKey = process.env.NEXT_PUBLIC_BOARD_ADMIN_KEY || "";

function boardAdminHref(boardId) {
  const base = `/board?room=${encodeURIComponent(boardId)}`;
  if (!adminKey) return base;
  return `${base}&admin=${encodeURIComponent(adminKey)}`;
}

function normalizeBoards(payload) {
  const raw = Array.isArray(payload)
    ? payload
  
    : Array.isArray(payload?.boards)
      ? payload.boards
      : [];
  return raw.filter((b) => b && b.id);
}

function itemCountFor(board) {
  if (typeof board.itemCount === "number") return board.itemCount;
  if (typeof board.itemsCount === "number") return board.itemsCount;
  if (Array.isArray(board.items)) return board.items.length;
  return 0;
}

function apiHeaders(json = true) {
  const headers = {};
  if (json) headers["Content-Type"] = "application/json";
  if (adminKey) headers["x-board-admin-key"] = adminKey;
  return headers;
}

const ODAI_TAG_RE = /<!--odai:([\s\S]*?)-->/;
const HUBS_TAG_RE = /<!--hubs:[\s\S]*?-->/g;
const HUBS_INLINE_RE = /\n?<!--hubs:([^>]*)-->/;

function extractRelatedHubSlugs(rawDesc) {
  const raw = typeof rawDesc === "string" ? rawDesc : "";
  const match = raw.match(HUBS_INLINE_RE);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBoardMeta(rawDesc) {
  const raw = typeof rawDesc === "string" ? rawDesc : "";
  let odai = null;
  const odaiMatch = raw.match(ODAI_TAG_RE);
  if (odaiMatch) {
    try {
      odai = JSON.parse(odaiMatch[1]);
    } catch {
      odai = null;
    }
  }
  const relatedHubSlugs = extractRelatedHubSlugs(raw);
  const cleanDescription = raw.replace(ODAI_TAG_RE, "").replace(HUBS_TAG_RE, "").trim();
  return { cleanDescription, odai, relatedHubSlugs };
}

function serializeBoardDescription(desc, odai, relatedHubSlugs = []) {
  const base = (desc || "").trim();
  const payload = {
    prompt: (odai?.prompt || "").trim(),
    mode: odai?.mode || "coop",
    targetCount: Number(odai?.targetCount) || 0,
    onePerUser: odai?.onePerUser === true,
  };
  if (typeof odai?.sortOrder === "number" && Number.isFinite(odai.sortOrder)) {
    payload.sortOrder = odai.sortOrder;
  }
  const odaiTag = `<!--odai:${JSON.stringify(payload)}-->`;
  const slugs = (relatedHubSlugs || []).map((s) => String(s).trim()).filter(Boolean);
  const hubsTag = slugs.length > 0 ? `\n<!--hubs:${slugs.join(",")}-->` : "";
  if (!base) return `${odaiTag}${hubsTag}`;
  return `${base}\n${odaiTag}${hubsTag}`;
}

function hubLabel(hub) {
  if (!hub) return "";
  return hub.titleJa || hub.titleEn || hub.slug || "";
}

export default function DevPublicBoardsPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [odaiPrompt, setOdaiPrompt] = useState("");
  const [odaiMode, setOdaiMode] = useState("coop");
  const [odaiOnePerUser, setOdaiOnePerUser] = useState(false);
  const [relatedHubSlugs, setRelatedHubSlugs] = useState([]);
  const [hubPick, setHubPick] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [togglingId, setTogglingId] = useState("");
  const [reorderingId, setReorderingId] = useState("");
  const allHubs = getAllHubPages();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadBoards = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/board?includeUnlisted=1", { headers: apiHeaders(false) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP ${res.status}`);
      }
      setBoards(normalizeBoards(data));
    } catch (e) {
      setError(e.message || "一覧の取得に失敗しました");
      setBoards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("テーマ名は必須です");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: apiHeaders(true),
        body: JSON.stringify({
          title: trimmedTitle,
          description: serializeBoardDescription(
            description.trim(),
            {
              prompt: odaiPrompt,
              mode: odaiMode,
              targetCount: 0,
              onePerUser: odaiOnePerUser,
            },
            relatedHubSlugs
          ),
          visibility: "public",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP ${res.status}`);
      }
      setTitle("");
      setDescription("");
      setOdaiPrompt("");
      setOdaiMode("coop");
      setOdaiOnePerUser(false);
      setRelatedHubSlugs([]);
      setHubPick("");
      await loadBoards();
    } catch (err) {
      setError(err.message || "作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMoveBoard(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= boards.length) return;

    const nextList = [...boards];
    const [moved] = nextList.splice(index, 1);
    nextList.splice(targetIndex, 0, moved);

    setReorderingId(moved.id);
    setError("");
    try {
      const updatedList = nextList.map((b, idx) => {
        const meta = parseBoardMeta(b.description);
        const nextDesc = serializeBoardDescription(
          meta.cleanDescription,
          { ...(meta.odai || {}), sortOrder: idx + 1 },
          meta.relatedHubSlugs
        );
        return { ...b, description: nextDesc };
      });

      await Promise.all(
        updatedList.map(async (b, idx) => {
          if (b.description === nextList[idx].description) return;
          const res = await fetch(`/api/board/${encodeURIComponent(b.id)}`, {
            method: "PATCH",
            headers: apiHeaders(true),
            body: JSON.stringify({ description: b.description }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.error || data.message || `HTTP ${res.status}`);
          }
        })
      );

      setBoards(updatedList);
    } catch (err) {
      setError(err.message || "並び順の変更に失敗しました");
    } finally {
      setReorderingId("");
    }
  }

  async function handleToggleVisibility(board) {
    const nextVisibility = board.visibility === "public" ? "unlisted" : "public";
    setTogglingId(board.id);
    setError("");
    try {
      const res = await fetch(`/api/board/${encodeURIComponent(board.id)}`, {
        method: "PATCH",
        headers: apiHeaders(true),
        body: JSON.stringify({ visibility: nextVisibility }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP ${res.status}`);
      }
      setBoards((prev) =>
        prev.map((b) => (b.id === board.id ? { ...b, visibility: nextVisibility } : b))
      );
    } catch (err) {
      setError(err.message || "公開状態の切り替えに失敗しました");
    } finally {
      setTogglingId("");
    }
  }

  async function handleDeleteBoard(board) {
    const label = board.title || board.id;
    if (!window.confirm(`「${label}」をデータベースから完全削除しますか？カードも含め復元できなくなります。`)) {
      return;
    }
    setDeletingId(board.id);
    setError("");
    try {
      const res = await fetch(`/api/board/${encodeURIComponent(board.id)}`, {
        method: "DELETE",
        headers: apiHeaders(false),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP ${res.status}`);
      }
      setBoards((prev) => prev.filter((b) => b.id !== board.id));
    } catch (err) {
      setError(err.message || "削除に失敗しました");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <>
      <Head>
        <title>公開ボード作成 — Dev — emakimono</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main style={pageStyle}>
        <div style={innerStyle}>
          <nav style={navRowStyle}>
            <Link href="/dev">
              <a style={secondaryLinkStyle}>← 開発ツール ハブへ戻る</a>
            </Link>
            <Link href="/board/public">
              <a style={secondaryLinkStyle}>一般向け公開ボード一覧を確認 ↗</a>
            </Link>
          </nav>

          <h1 style={titleStyle}>公開ポラロイドボード（開発用）</h1>
          <p style={subStyle}>
            development のみ。公開ボードを作成し、管理者モードで初期配置できます。
          </p>

          <section style={cardStyle}>
            <h2 style={cardTitleStyle}>新規作成</h2>
            {error ? <p style={errorStyle}>{error}</p> : null}
            <form onSubmit={handleSubmit}>
              <label style={labelStyle} htmlFor="board-title">
                テーマ名（必須・80文字まで）
              </label>
              <input
                id="board-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                required
                style={inputStyle}
                placeholder="例: 春の絵巻コラージュ"
              />
              <label style={labelStyle} htmlFor="board-odai-prompt">
                お題ミッション（任意・120文字まで）
              </label>
              <input
                id="board-odai-prompt"
                type="text"
                value={odaiPrompt}
                onChange={(e) => setOdaiPrompt(e.target.value)}
                maxLength={120}
                style={inputStyle}
                placeholder="例: 一番楽しそうに宴をしている場面を3枚切り抜こう！"
              />
              <div>
                <label style={labelStyle} htmlFor="board-odai-mode">
                  遊び方ルール
                </label>
                <select
                  id="board-odai-mode"
                  value={odaiMode}
                  onChange={(e) => setOdaiMode(e.target.value)}
                  style={inputStyle}
                >
                  <option value="coop">協力コレクション（みんなで目標達成）</option>
                  <option value="utaawase">歌合（左右対決・一首詠み）</option>
                  <option value="unique">かぶり禁止（通な名場面発掘）</option>
                </select>
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  marginBottom: "0.9rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={odaiOnePerUser}
                  onChange={(e) => setOdaiOnePerUser(e.target.checked)}
                />
                お一人様1枚までに制限する（同じユーザーからの複数投稿をブロック）
              </label>
              <label style={labelStyle} htmlFor="board-description">
                テーマの補足説明（任意・200文字まで）
              </label>
              <textarea
                id="board-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                style={textareaStyle}
                placeholder="参加者向けの補足説明"
              />
              <label style={labelStyle} htmlFor="board-related-hub">
                関連ハブ（任意・複数可）
              </label>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                  marginBottom: "0.65rem",
                }}
              >
                <select
                  id="board-related-hub"
                  value={hubPick}
                  onChange={(e) => setHubPick(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 0, flex: "1 1 200px" }}
                >
                  <option value="">ハブを選択…</option>
                  {allHubs
                    .filter((hub) => hub.slug && !relatedHubSlugs.includes(hub.slug))
                    .map((hub) => (
                      <option key={hub.slug} value={hub.slug}>
                        {hubLabel(hub)} ({hub.slug})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  style={{
                    ...linkButtonStyle,
                    padding: "8px 14px",
                    fontSize: "0.85rem",
                  }}
                  disabled={!hubPick}
                  onClick={() => {
                    if (!hubPick || relatedHubSlugs.includes(hubPick)) return;
                    setRelatedHubSlugs((prev) => [...prev, hubPick]);
                    setHubPick("");
                  }}
                >
                  追加
                </button>
              </div>
              {relatedHubSlugs.length > 0 ? (
                <ul
                  style={{
                    listStyle: "none",
                    margin: "0 0 0.85rem",
                    padding: 0,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.4rem",
                  }}
                >
                  {relatedHubSlugs.map((slug) => {
                    const hub = allHubs.find((h) => h.slug === slug);
                    return (
                      <li key={slug}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "4px 8px",
                            background: "#eef2ff",
                            border: "1px solid #c7d2fe",
                            borderRadius: "6px",
                            fontSize: "0.82rem",
                          }}
                        >
                          {hub ? (
                            <Link href={hub.path || `/hub/${slug}`}>
                              <a
                                style={{
                                  color: "#1e40af",
                                  textDecoration: "none",
                                }}
                              >
                                {hubLabel(hub)}
                              </a>
                            </Link>
                          ) : (
                            <span>{slug}</span>
                          )}
                          <button
                            type="button"
                            aria-label={`${slug} を外す`}
                            onClick={() =>
                              setRelatedHubSlugs((prev) =>
                                prev.filter((s) => s !== slug)
                              )
                            }
                            style={{
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              padding: "0 2px",
                              fontSize: "0.9rem",
                              lineHeight: 1,
                              color: "#64748b",
                            }}
                          >
                            ×
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              <button
                type="submit"
                style={linkButtonStyle}
                disabled={submitting}
              >
                {submitting ? "作成中…" : "お題公開ボードを作成"}
              </button>
            </form>
          </section>

          <section style={cardStyle}>
            <h2 style={cardTitleStyle}>作成済み公開ボード</h2>
            {loading ? (
              <p style={metaStyle}>読み込み中…</p>
            ) : boards.length === 0 ? (
              <p style={metaStyle}>まだボードがありません。</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {boards.map((board, index) => {
                  const meta = parseBoardMeta(board.description);
                  const count = itemCountFor(board);
                  const isBusy =
                    Boolean(reorderingId) ||
                    deletingId === board.id ||
                    togglingId === board.id;
                  return (
                    <li key={board.id} style={listItemStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "0.75rem",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span
                              style={{
                                padding: "2px 7px",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                background: "#eef2ff",
                                color: "#3730a3",
                                border: "1px solid #c7d2fe",
                              }}
                            >
                              #{index + 1}
                            </span>
                            <strong style={{ fontSize: "1rem" }}>
                              {board.title || "（無題）"}
                            </strong>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "999px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                background: board.visibility === "public" ? "#dcfce7" : "#f1f5f9",
                                color: board.visibility === "public" ? "#166534" : "#475569",
                                border: `1px solid ${board.visibility === "public" ? "#86efac" : "#cbd5e1"}`,
                              }}
                            >
                              {board.visibility === "public" ? "公開中" : "非公開（編集中）"}
                            </span>
                          </div>
                          {meta.odai?.prompt ? (
                            <div
                              style={{
                                marginTop: "0.4rem",
                                padding: "0.35rem 0.6rem",
                                background: "#fef3c7",
                                border: "1px solid #fcd34d",
                                borderRadius: "6px",
                                fontSize: "0.85rem",
                                color: "#92400e",
                                fontWeight: 600,
                              }}
                            >
                              📜 お題: {meta.odai.prompt}
                              {meta.odai.targetCount > 0
                                ? `（目標 ${count} / ${meta.odai.targetCount}枚）`
                                : ""}
                              {meta.odai.onePerUser ? " · 🔒 1人1枚限定" : ""}
                            </div>
                          ) : null}
                          {meta.cleanDescription ? (
                            <p style={{ ...metaStyle, marginTop: "0.5rem" }}>
                              {meta.cleanDescription}
                            </p>
                          ) : null}
                          {meta.relatedHubSlugs?.length > 0 ? (
                            <p style={{ ...metaStyle, marginTop: "0.35rem" }}>
                              関連ハブ:{" "}
                              {meta.relatedHubSlugs
                                .map((slug) => {
                                  const hub = allHubs.find((h) => h.slug === slug);
                                  return hub ? hubLabel(hub) : slug;
                                })
                                .join(" · ")}
                            </p>
                          ) : null}
                          <p style={metaStyle}>
                            アイテム数: {count} · ID: <code>{board.id}</code>
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => handleMoveBoard(index, -1)}
                            disabled={index === 0 || isBusy}
                            title="優先順位を1つ上げる"
                            aria-label="優先順位を1つ上げる"
                            style={{
                              padding: "6px 9px",
                              background: "#f8fafc",
                              color: index === 0 ? "#94a3b8" : "#334155",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              fontWeight: 700,
                              cursor: index === 0 || isBusy ? "not-allowed" : "pointer",
                            }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveBoard(index, 1)}
                            disabled={index === boards.length - 1 || isBusy}
                            title="優先順位を1つ下げる"
                            aria-label="優先順位を1つ下げる"
                            style={{
                              padding: "6px 9px",
                              background: "#f8fafc",
                              color: index === boards.length - 1 ? "#94a3b8" : "#334155",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              fontWeight: 700,
                              cursor: index === boards.length - 1 || isBusy ? "not-allowed" : "pointer",
                            }}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(board)}
                            disabled={togglingId === board.id || deletingId === board.id}
                            style={{
                              padding: "6px 10px",
                              background: board.visibility === "public" ? "#fef3c7" : "#dbeafe",
                              color: board.visibility === "public" ? "#92400e" : "#1e40af",
                              border: `1px solid ${board.visibility === "public" ? "#fcd34d" : "#93c5fd"}`,
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {togglingId === board.id
                              ? "切替中…"
                              : board.visibility === "public"
                                ? "非公開にする"
                                : "再公開する"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBoard(board)}
                            disabled={deletingId === board.id || togglingId === board.id}
                            title="この公開ボードを完全削除"
                            aria-label="この公開ボードを完全削除"
                            style={{
                              padding: "6px 10px",
                              background: "#fee2e2",
                              color: "#b91c1c",
                              border: "1px solid #fecaca",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {deletingId === board.id ? "削除中…" : "🗑️ 完全削除"}
                          </button>
                        </div>
                      </div>
                      <Link href={boardAdminHref(board.id)}>
                        <a style={linkButtonStyle}>管理者モードで開く</a>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps() {
  if (process.env.NODE_ENV !== "development") {
    return { notFound: true };
  }
  return { props: {} };
}