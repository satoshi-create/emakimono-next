import Link from "next/link";

const FALLBACK_UNTITLED = {
  en: "View Community Polaroid Board",
  ja: "みんなのポラロイドボードを見る・貼る",
};

function formatItemCount(count, itemCountLabel, en) {
  if (typeof itemCountLabel === "function") {
    return itemCountLabel(count);
  }
  if (typeof itemCountLabel === "string") {
    return itemCountLabel;
  }
  return en ? ` (${count})` : `（${count}枚）`;
}

function buildBoardLabel(board, en, untitledLabel, itemCountLabel) {
  const untitled = untitledLabel || (en ? FALLBACK_UNTITLED.en : FALLBACK_UNTITLED.ja);
  const base = (board.title && String(board.title).trim()) || untitled;
  const hasCount =
    board.itemCount != null &&
    board.itemCount !== "" &&
    Number.isFinite(Number(board.itemCount));
  const countPart = hasCount
    ? formatItemCount(Number(board.itemCount), itemCountLabel, en)
    : "";
  return `📌 ${base}${countPart} →`;
}

const linkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 14px",
  borderRadius: 999,
  background: "#fffbeb",
  border: "1px solid #d97706",
  color: "#b45309",
  fontSize: 13,
  fontWeight: 700,
  textDecoration: "none",
};

const wrapStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "flex-start",
};

const titleStyle = {
  margin: 0,
  width: "100%",
  fontSize: 13,
  fontWeight: 600,
  color: "rgb(114 114 114)",
};

export function LinkedPublicBoards({
  boards,
  locale,
  title,
  ariaLabel,
  itemCountLabel,
  untitledLabel,
  className,
}) {
  if (!Array.isArray(boards) || boards.length === 0) {
    return null;
  }

  const isJa = locale === "ja";
  const en = !isJa;
  const navLabel =
    ariaLabel ||
    title ||
    (isJa ? "公開ポラロイドボードへのリンク" : "Linked public polaroid boards");

  return (
    <nav aria-label={navLabel} className={className} style={wrapStyle}>
      {title ? <p style={titleStyle}>{title}</p> : null}
      {boards.map((board) => {
        if (!board || typeof board.id !== "string" || !board.id) {
          return null;
        }
        const label = buildBoardLabel(board, en, untitledLabel, itemCountLabel);
        const href = `/board?room=${encodeURIComponent(board.id)}`;
        return (
          <Link key={board.id} href={href} locale={locale} passHref>
            <a style={linkStyle}>{label}</a>
          </Link>
        );
      })}
    </nav>
  );
}