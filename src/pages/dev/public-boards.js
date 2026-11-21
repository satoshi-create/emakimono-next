import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

export default function DevPublicBoardsPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadBoards = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/board", { headers: apiHeaders(false) });
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
          description: description.trim() || undefined,
          visibility: "public",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP ${res.status}`);
      }
      setTitle("");
      setDescription("");
      await loadBoards();
    } catch (err) {
      setError(err.message || "作成に失敗しました");
    } finally {
      setSubmitting(false);
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
              <label style={labelStyle} htmlFor="board-description">
                テーマの説明（任意・240文字まで）
              </label>
              <textarea
                id="board-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={240}
                style={textareaStyle}
                placeholder="参加者向けの短い説明"
              />
              <button
                type="submit"
                style={linkButtonStyle}
                disabled={submitting}
              >
                {submitting ? "作成中…" : "公開ボードを作成"}
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
                {boards.map((board) => (
                  <li key={board.id} style={listItemStyle}>
                    <strong style={{ fontSize: "1rem" }}>
                      {board.title || "（無題）"}
                    </strong>
                    {board.description ? (
                      <p style={{ ...metaStyle, marginTop: "0.5rem" }}>
                        {board.description}
                      </p>
                    ) : null}
                    <p style={metaStyle}>
                      アイテム数: {itemCountFor(board)} · ID:{" "}
                      <code>{board.id}</code>
                    </p>
                    <Link href={boardAdminHref(board.id)}>
                      <a style={linkButtonStyle}>管理者モードで開く</a>
                    </Link>
                  </li>
                ))}
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