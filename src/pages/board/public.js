import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect, useState } from "react";
import { createCollabBoard, fetchPublicBoards } from "@/libs/api/ugcApi";

export default function PublicBoardsPage() {
  const router = useRouter();
  const isEn = router.locale === "en";

  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const loadBoards = async () => {
    setLoading(true);
    try {
      const data = await fetchPublicBoards();
      setBoards(Array.isArray(data?.boards) ? data.boards : []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load public boards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const handleCreatePublicBoard = async (e) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const authorName =
        typeof window !== "undefined"
          ? window.localStorage.getItem("emakimono_polaroid_author_v1") || ""
          : "";
      const res = await createCollabBoard({
        title:
          newTitle.trim() ||
          (isEn ? "Public Emaki Gallery Board" : "みんなの公開ポラロイドボード"),
        visibility: "public",
        authorName,
      });
      if (res?.board?.id) {
        router.push(`/board?room=${encodeURIComponent(res.board.id)}`);
      }
    } catch (err) {
      alert(err.message || "公開ボードの作成に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Head>
        <title>
          {isEn
            ? "Public Polaroid Boards | Emakimono"
            : "みんなの公開ポラロイドボード | 横スクロールで楽しむ絵巻物"}
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
            gap: 12,
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
              <Link href="/" passHref>
                <a style={{ fontSize: 13, color: "#4b5563" }}>
                  {isEn ? "← Gallery" : "← 絵巻一覧へ"}
                </a>
              </Link>
              <Link href="/board" passHref>
                <a style={{ fontSize: 13, color: "#4b5563" }}>
                  {isEn ? "My Personal Board" : "個人ボードへ"}
                </a>
              </Link>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              {isEn ? "Public Polaroid Boards" : "みんなの公開ポラロイドボード"}
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
              {isEn
                ? "Browse open community boards and pin your favorite scenes from any scroll."
                : "誰でも自由に閲覧・貼り付けができる公開ギャラリーボードです。"}
            </p>
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
            onSubmit={handleCreatePublicBoard}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              type="text"
              maxLength={80}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={
                isEn
                  ? "New public board theme (e.g. Funny Animals in Choju-giga)"
                  : "新しい公開ボードのテーマ（例: 鳥獣戯画のお気に入り動物集）"
              }
              style={{
                flex: "1 1 260px",
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
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
                ? "+ Create Public Board"
                : "+ 公開ボードを新しく作る"}
            </button>
          </form>
        </section>

        {loading ? (
          <p style={{ color: "#6b7280" }}>
            {isEn ? "Loading boards..." : "公開ボードを読み込み中..."}
          </p>
        ) : error ? (
          <p style={{ color: "#dc2626" }}>{error}</p>
        ) : boards.length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            {isEn
              ? "No public boards yet. Create the first one above!"
              : "まだ公開ボードがありません。上のフォームから最初の公開ボードを作成してみましょう！"}
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {boards.map((b) => (
              <Link href={`/board?room=${encodeURIComponent(b.id)}`} key={b.id} passHref>
                <a
                  style={{
                    display: "block",
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "inherit",
                    textDecoration: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "#ecfdf5",
                      color: "#047857",
                      marginBottom: 8,
                    }}
                  >
                    {isEn ? "PUBLIC BOARD" : "公開ボード"}
                  </div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>
                    {b.title}
                  </h2>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {isEn ? `${b.itemCount} polaroids` : `ポラロイド ${b.itemCount} 枚`}
                  </div>
                </a>
              </Link>
            ))}
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
