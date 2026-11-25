import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { fetchPublicBoards } from "@/libs/api/ugcApi";

export default function PublicBoardsPage() {
  const router = useRouter();
  const isJa = router.locale === "ja";

  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <>
      <Head>
        <title>
          {isJa
            ? "みんなの公開ポラロイドボード | 横スクロールで楽しむ絵巻物"
            : "Public Polaroid Boards | Emakimono"}
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
              {/* 共通2モード切替セグメントスイッチ */}
              <div
                role="tablist"
                aria-label={isJa ? "ボードモード切替" : "Board mode switch"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#f1f5f9",
                  padding: 3,
                  borderRadius: 999,
                  border: "1px solid #cbd5e1",
                }}
              >
                <Link href="/board/personal" locale={router.locale} passHref>
                  <a
                    role="tab"
                    aria-selected={false}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "5px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#64748b",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span aria-hidden="true">🔒</span>
                    <span>{isJa ? "個人ボード一覧" : "Personal List"}</span>
                  </a>
                </Link>

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
                    background: "#dcfce7",
                    color: "#166534",
                    boxShadow: "0 1px 3px rgba(22, 101, 52, 0.14)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span aria-hidden="true">🌐</span>
                  <span>{isJa ? "公開ボード一覧" : "Public List"}</span>
                </span>
              </div>

              <Link href="/" locale={router.locale} passHref>
                <a style={{ fontSize: 12.5, color: "#64748b", textDecoration: "none" }}>
                  {isJa ? "← 絵巻一覧へ" : "← Emaki Gallery"}
                </a>
              </Link>
            </div>

            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                {isJa ? "みんなの公開ポラロイドボード" : "Public Polaroid Boards"}
              </h1>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
                {isJa
                  ? "誰でも自由に閲覧・貼り付けができる公開ギャラリーボードです。"
                  : "Browse open community boards and pin your favorite scenes from any scroll."}
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <p style={{ color: "#6b7280" }}>
            {isJa ? "公開ボードを読み込み中..." : "Loading boards..."}
          </p>
        ) : error ? (
          <p style={{ color: "#dc2626" }}>{error}</p>
        ) : boards.length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            {isJa
              ? "まだ公開ボードがありません。"
              : "No public boards yet."}
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
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "inherit",
                    textDecoration: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
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
                        background: "#ecfdf5",
                        color: "#047857",
                        marginBottom: 8,
                      }}
                    >
                      {isJa ? "公開ボード" : "PUBLIC BOARD"}
                    </div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>
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
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {isJa ? `ポラロイド ${b.itemCount} 枚` : `${b.itemCount} polaroids`}
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

export async function getServerSideProps() {
  return { notFound: true };
}
