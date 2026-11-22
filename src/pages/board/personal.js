import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect, useState } from "react";
import {
  createPersonalBoard,
  deletePersonalBoard,
  listPersonalBoards,
} from "@/components/emaki/viewer/board/polaroidBoardStorage";

export default function PersonalBoardsPage() {
  const router = useRouter();
  const isEn = router.locale === "en";

  const [boards, setBoards] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const refreshBoards = () => {
    setBoards(listPersonalBoards());
  };

  useEffect(() => {
    refreshBoards();
  }, []);

  const handleCreatePersonalBoard = (e) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const board = createPersonalBoard({
        title: newTitle.trim(),
        description: newDescription.trim(),
      });
      setNewTitle("");
      setNewDescription("");
      if (board?.id) {
        router.push(
          `/board?personal=${encodeURIComponent(board.id)}`,
          undefined,
          { locale: router.locale }
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (e, boardId) => {
    e.preventDefault();
    e.stopPropagation();
    if (boardId === "default") return;
    const ok = window.confirm(
      isEn
        ? "Delete this personal board? Polaroids on it will be removed."
        : "この個人ボードを削除しますか？貼ったポラロイドも消えます。"
    );
    if (!ok) return;
    deletePersonalBoard(boardId);
    refreshBoards();
  };

  return (
    <>
      <Head>
        <title>
          {isEn
            ? "My Personal Polaroid Boards | Emakimono"
            : "自分のポラロイドボード一覧 | 横スクロールで楽しむ絵巻物"}
        </title>
      </Head>
      <main
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "24px 16px 64px",
          fontFamily: "sans-serif",
        }}
      >
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div
                role="tablist"
                aria-label={isEn ? "Board mode switch" : "ボードモード切替"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#f1f5f9",
                  padding: 3,
                  borderRadius: 999,
                  border: "1px solid #cbd5e1",
                }}
              >
                <span
                  role="tab"
                  aria-selected={true}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 12px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    background: "#ffffff",
                    color: "#0f172a",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.12)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span aria-hidden="true">🔒</span>
                  <span>{isEn ? "Personal List" : "個人ボード一覧"}</span>
                </span>

              </div>

              <Link href="/" locale={router.locale} passHref>
                <a style={{ fontSize: 12.5, color: "#64748b", textDecoration: "none" }}>
                  {isEn ? "← Emaki Gallery" : "← 絵巻一覧へ"}
                </a>
              </Link>
            </div>

            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                {isEn ? "My Personal Polaroid Boards" : "自分のポラロイドボード一覧"}
              </h1>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
                {isEn
                  ? "Create themed boards and arrange polaroids from any scroll."
                  : "テーマごとに個人ボードを作り、好きな絵巻のポラロイドを並べられます。"}
              </p>
            </div>
          </div>
        </header>

        <section
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 28,
          }}
        >
          <form
            onSubmit={handleCreatePersonalBoard}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <input
                type="text"
                maxLength={80}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={
                  isEn
                    ? "Board theme (e.g. Favorite frogs in Choju-giga)"
                    : "テーマ名（例: 鳥獣戯画のお気に入り動物集）"
                }
                style={{
                  flex: "1 1 260px",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  background: "#fff",
                }}
              />
              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#111827",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {creating
                  ? isEn
                    ? "Creating..."
                    : "作成中..."
                  : isEn
                  ? "+ Create Personal Board"
                  : "＋ 個人ボードを新しく作る"}
              </button>
            </div>
            <input
              type="text"
              maxLength={240}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder={
                isEn
                  ? "Theme description (optional)"
                  : "テーマの説明（任意）"
              }
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 13,
                background: "#fff",
              }}
            />
          </form>
        </section>

        {boards.length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            {isEn
              ? "No personal boards yet. Create one above!"
              : "まだ個人ボードがありません。上のフォームから作成してみましょう！"}
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {boards.map((b) => {
              const href =
                b.id === "default"
                  ? "/board"
                  : `/board?personal=${encodeURIComponent(b.id)}`;
              return (
                <div
                  key={b.id}
                  style={{
                    position: "relative",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  {b.id !== "default" && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, b.id)}
                      aria-label={isEn ? "Delete board" : "ボードを削除"}
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        zIndex: 1,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        color: "#9ca3af",
                        borderRadius: 6,
                        fontSize: 12,
                        padding: "2px 8px",
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  )}
                  <Link href={href} locale={router.locale} passHref>
                    <a
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: 16,
                        minHeight: 140,
                        color: "inherit",
                        textDecoration: "none",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "inline-block",
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "#f1f5f9",
                            color: "#334155",
                            marginBottom: 8,
                          }}
                        >
                          {isEn ? "PERSONAL" : "個人ボード"}
                        </div>
                        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", paddingRight: 28 }}>
                          {b.title}
                        </h2>
                        {b.description && (
                          <p
                            style={{
                              fontSize: 13,
                              color: "#4b5563",
                              margin: "0 0 10px",
                              lineHeight: 1.45,
                            }}
                          >
                            {b.description}
                          </p>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        <span>
                          {isEn
                            ? `${b.itemCount || 0} polaroids`
                            : `ポラロイド ${b.itemCount || 0}枚`}
                        </span>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>
                          {isEn ? "Open →" : "開く →"}
                        </span>
                      </div>
                    </a>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ja", ["common"])),
    },
  };
}
