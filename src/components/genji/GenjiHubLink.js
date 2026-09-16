import styles from "@/styles/GenjiHubLink.module.css";
import { faScroll } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

export const HUB_PATH = "/genji/chapters-genji";

/**
 * Link from the emaki viewer to the Tale of Genji hub.
 * Pass `genjieslug`（帖スラグ, e.g. "wakamurasaki"）to deep-link a chapter;
 * omit it to point at the 54-chapter list hub.
 *
 * variant="icon"（コメンタリーバー内）は、段タイトル行でタイトルのすぐ右隣に
 * 「帖ガイド ↗」ピルリンクを置き、該当帖ページ（/genji/[slug]）を別タブで開く。
 */
const GenjiHubLink = ({ genjieslug, variant = "tag", linkClassName }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";
  const href = genjieslug ? `/genji/${genjieslug}` : HUB_PATH;

  const label = t("genjiHub.linkLabel", {
    defaultValue: isEn
      ? "View the Tale of Genji hub"
      : "源氏物語 54帖ハブを見る",
  });
  // 帖ガイド（コメンタリーバー内のピルリンク）: ラベルと遷移先を明示する
  const guideLabel = t("genjiHub.chapterGuide", {
    defaultValue: isEn ? "Chapter guide" : "帖ガイド",
  });
  const guideTitle = t("genjiHub.chapterGuideTitle", {
    defaultValue: isEn
      ? "Full synopsis and notes for this chapter"
      : "帖の全体あらすじ・解説",
  });
  const desc = t("genjiHub.linkDesc", {
    defaultValue: isEn
      ? "Browse all 54 chapters and their illustrated scrolls."
      : "源氏物語54帖と絵巻を横断して鑑賞できます。",
  });

  if (variant === "icon") {
    return (
      <Link href={href}>
        <a
          className={linkClassName || styles.hubIconBtn}
          aria-label={guideTitle}
          title={guideTitle}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.label}>{guideLabel}</span>
          <span aria-hidden="true">↗</span>
        </a>
      </Link>
    );
  }

  const tagClassName = variant === "banner" ? styles.banner : styles.tag;

  return (
    <Link href={href}>
      <a className={tagClassName}>
        <span className={styles.head}>
          <FontAwesomeIcon
            className={styles.icon}
            icon={faScroll}
            aria-hidden="true"
          />
          <span className={styles.label}>{label}</span>
        </span>
        {variant === "banner" && <span className={styles.desc}>{desc}</span>}
      </a>
    </Link>
  );
};

export default GenjiHubLink;
