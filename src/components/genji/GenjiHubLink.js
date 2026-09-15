import styles from "@/styles/GenjiHubLink.module.css";
import barStyles from "@/styles/SceneCommentaryBar.module.css";
import { getGenjiChapterDigest } from "@/utils/connectEmakiText";
import { faScroll } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export const HUB_PATH = "/genji/chapters-genji";

/** 帖ダイジェストモーダル本体。絵巻を背景に残したまま表示する（遷移しない）。 */
const GenjiChapterModal = ({ digest, href, onClose }) => {
  const { locale } = useRouter();
  const { t } = useTranslation("common");
  const isEn = locale === "en";

  const modalTitle = t("genjiHub.modalTitle", {
    defaultValue: isEn ? "Chapter digest" : "各帖ダイジェスト",
  });
  const closeLabel = t("genjiHub.modalClose", {
    defaultValue: isEn ? "Close" : "閉じる",
  });
  const detailLabel = t("genjiHub.modalDetailLink", {
    defaultValue: isEn ? "Read more details ↗" : "さらに詳細を見る ↗",
  });

  return (
    <div
      className={barStyles.genjiModalOverlay}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={barStyles.genjiModal}
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={barStyles.genjiModalHead}>
          <span className={barStyles.genjiModalTitle}>
            {isEn ? digest.titleen : digest.title}
          </span>
          {digest.chapterCh ? (
            <span className={barStyles.genjiModalBadge}>
              {isEn ? `Chapter ${digest.chapterEn}` : `第${digest.chapterCh}帖`}
            </span>
          ) : null}
          <button
            type="button"
            className={barStyles.genjiModalClose}
            onClick={onClose}
            aria-label={closeLabel}
            title={closeLabel}
          >
            ✕
          </button>
        </div>
        {!isEn && digest.ruby ? (
          <span className={barStyles.genjiModalRuby}>{digest.ruby}</span>
        ) : null}
        {(digest.age || digest.mainCharacter) && (
          <div className={barStyles.genjiModalFacts}>
            {digest.age ? (
              <span>
                {isEn ? "Age" : "巻立"}:{" "}
                <b className={barStyles.genjiModalFactValue}>{digest.age}</b>
              </span>
            ) : null}
            {digest.mainCharacter ? (
              <span>
                {isEn ? "Main character" : "主な人物"}:{" "}
                <b className={barStyles.genjiModalFactValue}>
                  {digest.mainCharacter}
                </b>
              </span>
            ) : null}
          </div>
        )}
        {digest.summary ? (
          <p className={barStyles.genjiModalSummary}>{digest.summary}</p>
        ) : null}
        <Link href={href}>
          <a className={barStyles.genjiModalDetailLink} onClick={onClose}>
            {detailLabel}
          </a>
        </Link>
      </div>
    </div>
  );
};

/**
 * Link from the emaki viewer to the Tale of Genji hub.
 * Pass `genjieslug`（帖スラグ, e.g. "wakamurasaki"）to deep-link a chapter;
 * omit it to point at the 54-chapter list hub.
 * variant="icon"（コメンタリーバー内）は直接遷移せず、帖ダイジェストのモーダルを開く。
 */
const GenjiHubLink = ({ genjieslug, variant = "tag", sceneTitle }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const isEn = locale === "en";
  const href = genjieslug ? `/genji/${genjieslug}` : HUB_PATH;

  const cleanSceneTitle =
    typeof sceneTitle === "string" ? sceneTitle.trim() : "";

  const label = t("genjiHub.linkLabel", {
    defaultValue: isEn
      ? "View the Tale of Genji hub"
      : "源氏物語 54帖ハブを見る",
  });
  // ツールチップ: 遷移先と現在のシーン名を明示する
  const tooltip = cleanSceneTitle
    ? isEn
      ? `View "${cleanSceneTitle}" in The Tale of Genji Hub`
      : `「${cleanSceneTitle}」の源氏物語54帖ハブを開く`
    : label;
  const desc = t("genjiHub.linkDesc", {
    defaultValue: isEn
      ? "Browse all 54 chapters and their illustrated scrolls."
      : "源氏物語54帖と絵巻を横断して鑑賞できます。",
  });

  // アイコン: 絵巻を鑑賞したまま各帖の概要を読めるよう、モーダルで表示する
  const [modalOpen, setModalOpen] = useState(false);
  const digest = useMemo(
    () => (genjieslug ? getGenjiChapterDigest(genjieslug, locale) : null),
    [genjieslug, locale]
  );

  // モーダル表示中: Esc で閉じる / 背面（絵巻）のスクロールを停止
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.documentElement.classList.add("open");
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.documentElement.classList.remove("open");
    };
  }, [modalOpen]);

  if (variant === "icon") {
    return (
      <>
        <Link href={href}>
          <a
            className={styles.hubIconBtn}
            aria-label={tooltip}
            title={tooltip}
            aria-haspopup="dialog"
            onClick={(e) => {
              // 帖データが引けないときは従来どおり詳細ページへ遷移させる
              if (!digest) return;
              e.preventDefault();
              e.stopPropagation();
              setModalOpen(true);
            }}
          >
            <FontAwesomeIcon
              className={styles.icon}
              icon={faScroll}
              aria-hidden="true"
            />
          </a>
        </Link>
        {modalOpen && digest && typeof document !== "undefined"
          ? createPortal(
              <GenjiChapterModal
                digest={digest}
                href={href}
                onClose={() => setModalOpen(false)}
              />,
              document.body
            )
          : null}
      </>
    );
  }

  const className = variant === "banner" ? styles.banner : styles.tag;

  return (
    <Link href={href}>
      <a className={className}>
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
