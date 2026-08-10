import styles from "@/styles/EmakiTimeline.module.css";
import Link from "next/link";

/**
 * 年表内の絵巻リンクチップ。
 * - href（ハブページなど）は常に公開
 * - titleen はビューア公開中（liveSlugs に含まれる）のみリンク化し、未公開は「準備中」表示
 */
const EmakiTimelineChip = ({ link, liveSlugs, comingSoon }) => {
  const isLive = link.href ? true : liveSlugs.includes(link.titleen);
  const href = link.href || `/${link.titleen}`;

  if (!isLive) {
    return (
      <span className={`${styles.chip} ${styles.chipSoon}`}>
        {link.name}
        <span className={styles.soon}>{comingSoon}</span>
      </span>
    );
  }
  return (
    <Link href={href}>
      <a className={styles.chip}>{link.name}</a>
    </Link>
  );
};

export default EmakiTimelineChip;
