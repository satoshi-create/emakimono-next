import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

const DEFAULT_SLUG = "kyoto-birdseye-1947";

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

const slugRowStyle = {
  display: "flex",
  gap: "0.75rem",
  alignItems: "center",
  marginBottom: "1.5rem",
  flexWrap: "wrap",
};

const inputStyle = {
  flex: "1 1 200px",
  minWidth: "180px",
  padding: "0.6rem 0.75rem",
  border: "1px solid #c8ccd4",
  borderRadius: "8px",
  fontSize: "0.95rem",
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
  margin: "0 0 0.5rem",
};

const cardDescStyle = {
  fontSize: "0.85rem",
  color: "#555",
  margin: "0 0 0.85rem",
  lineHeight: 1.5,
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
};

const externalLinkStyle = {
  ...linkButtonStyle,
  background: "#2d6a4f",
};

export default function DevHubPage() {
  const [slug, setSlug] = useState(DEFAULT_SLUG);
  const trimmed = (slug || "").trim() || DEFAULT_SLUG;
  const editSpotsHref = `/${trimmed}?editSpots=1`;
  const ebikiHref = `/${trimmed}?ebikiPicker=1`;

  return (
    <>
      <Head>
        <title>Dev tools — emakimono</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main style={pageStyle}>
        <div style={innerStyle}>
          <h1 style={titleStyle}>開発ツール ハブ</h1>
          <p style={subStyle}>
            本番では表示されません（development のみ）。作品スラッグは下の入力で共有します。
          </p>

          <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            対象作品スラッグ
          </label>
          <div style={slugRowStyle}>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={DEFAULT_SLUG}
              style={inputStyle}
              aria-label="対象作品スラッグ"
            />
          </div>

          <section style={cardStyle}>
            <h2 style={cardTitleStyle}>① 絵巻一発登録・R2アップロード</h2>
            <p style={cardDescStyle}>
              YAML・シーン・画像からメタデータ生成と R2 アップロードまで一括。
            </p>
            <Link href="/dev/upload-scroll">
              <a style={linkButtonStyle}>/dev/upload-scroll を開く</a>
            </Link>
          </section>

          <section style={cardStyle}>
            <h2 style={cardTitleStyle}>
              ② CSV スポットピッカー（旧 tools/spot_picker.html）
            </h2>
            <p style={cardDescStyle}>
              CSV からスポット座標を読み込み、ピン配置を編集します。
            </p>
            <Link href="/dev/spot-picker">
              <a style={linkButtonStyle}>/dev/spot-picker を開く</a>
            </Link>
          </section>

          <section style={cardStyle}>
            <h2 style={cardTitleStyle}>③ ビューア上スポット・クイズ枠編集</h2>
            <p style={cardDescStyle}>
              ビューアで <code>?editSpots=1</code>{" "}
              を付けて表示。スポットとクイズ枠をドラッグで調整し、保存は開発 API
              経由で行います。
            </p>
            <a
              href={editSpotsHref}
              target="_blank"
              rel="noopener noreferrer"
              style={externalLinkStyle}
            >
              {editSpotsHref} を新しいタブで開く
            </a>
          </section>

          <section style={cardStyle}>
            <h2 style={cardTitleStyle}>④ 絵引（Ebiki）座標ピッカー</h2>
            <p style={cardDescStyle}>
              ビューアで <code>?ebikiPicker=1</code>{" "}
              を付けて表示。絵引エリアの座標を拾います。
            </p>
            <a
              href={ebikiHref}
              target="_blank"
              rel="noopener noreferrer"
              style={externalLinkStyle}
            >
              {ebikiHref} を新しいタブで開く
            </a>
          </section>

          <section style={cardStyle}>
            <h2 style={cardTitleStyle}>⑤ 公開ポラロイドボード作成・管理</h2>
            <p style={cardDescStyle}>
              効果測定用の公開ボード（歌合お題・テーマボード）の新規作成と管理を行います。
            </p>
            <Link href="/dev/public-boards">
              <a style={linkButtonStyle}>/dev/public-boards を開く</a>
            </Link>
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