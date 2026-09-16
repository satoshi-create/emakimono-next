import drawerStyles from "@/styles/GenjiChapterDrawer.module.css";
import { getGenjiChapterDrawer } from "@/utils/connectEmakiText";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 源氏物語絵巻ビューアー用の右スライドイン・ドロワー。
 *
 * 中央モーダル（全面オーバーレイ）を廃止し、絵巻の横スクロールを止めずに
 * 帖の詳細（あらすじ / 完全な現代語訳 / 完全な古文）を読むためのパネル。
 * - 閉じる: ×（右上）/ ESC / ドロワー外クリック
 * - 背面の絵巻スクロールを塞がない（スクロールロック・全面オーバーレイなし）
 * - モバイル（<=767px）は画面下部からのボトムシート（CSS 側で切替）
 */
const GenjiChapterDrawer = ({ genjieslug, href, isOpen, onClose }) => {
  const { locale } = useRouter();
  const { t } = useTranslation("common");
  const isEn = locale === "en";
  const panelRef = useRef(null);
  const [shown, setShown] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");

  const detail = useMemo(
    () => (genjieslug ? getGenjiChapterDrawer(genjieslug, locale) : null),
    [genjieslug, locale]
  );

  // スライドイン: マウント直後に data-open を立てて CSS トランジションを効かせる
  useEffect(() => {
    if (!isOpen) {
      setShown(false);
      return undefined;
    }
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  // ESC / 外側クリックで閉じる。document 側で拾うため背面（絵巻）を塞がない
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    const handlePointerDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !detail || typeof document === "undefined") return null;

  const closeLabel = t("genjiHub.drawerClose", {
    defaultValue: isEn ? "Close" : "閉じる",
  });
  const detailLabel = t("genjiHub.modalDetailLink", {
    defaultValue: isEn ? "Read more details ↗" : "さらに詳細を見る ↗",
  });

  const tabs = [
    {
      id: "summary",
      label: isEn ? "Summary" : "あらすじ",
      body: detail.summary,
      source: "",
    },
    {
      id: "gendaibun",
      label: isEn ? "Modern Japanese" : "現代文",
      body: detail.gendaibun,
      source: detail.sourceGendaibunUrl,
    },
    {
      id: "kobun",
      label: isEn ? "Classical Japanese" : "古文",
      body: detail.kobun,
      source: detail.sourceKobunUrl,
    },
  ].filter((tab) => Boolean(tab.body));
  const current = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return createPortal(
    <aside
      ref={panelRef}
      className={drawerStyles.drawer}
      data-open={shown ? "true" : "false"}
      role="dialog"
      aria-modal="false"
      aria-label={isEn ? detail.titleen : detail.title}
    >
      <header className={drawerStyles.head}>
        <div className={drawerStyles.headText}>
          <h2 className={drawerStyles.title}>
            {isEn ? detail.titleen : detail.title}
          </h2>
          {!isEn && detail.ruby ? (
            <span className={drawerStyles.ruby}>{detail.ruby}</span>
          ) : null}
        </div>
        {detail.chapterCh ? (
          <span className={drawerStyles.badge}>
            {isEn ? `Chapter ${detail.chapterEn}` : `第${detail.chapterCh}帖`}
          </span>
        ) : null}
        <button
          type="button"
          className={drawerStyles.close}
          onClick={onClose}
          aria-label={closeLabel}
          title={closeLabel}
        >
          ✕
        </button>
      </header>

      {(detail.age || detail.mainCharacter) && (
        <div className={drawerStyles.facts}>
          {detail.age ? (
            <span>
              {isEn ? "Age" : "巻立"}:{" "}
              <b className={drawerStyles.factValue}>{detail.age}</b>
            </span>
          ) : null}
          {detail.mainCharacter ? (
            <span>
              {isEn ? "Main character" : "主な人物"}:{" "}
              <b className={drawerStyles.factValue}>{detail.mainCharacter}</b>
            </span>
          ) : null}
        </div>
      )}

      {current && (
        <>
          <div className={drawerStyles.tabs} role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={current.id === tab.id}
                className={`${drawerStyles.tab} ${
                  current.id === tab.id ? drawerStyles.tabActive : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className={drawerStyles.body}>
            <p className={drawerStyles.bodyText}>{current.body}</p>
            {current.source ? (
              <a
                className={drawerStyles.sourceLink}
                href={current.source}
                target="_blank"
                rel="noopener noreferrer"
              >
                {current.id === "kobun"
                  ? isEn
                    ? "Open the classical text (source) ↗"
                    : "出典・底本（古文）を開く ↗"
                  : isEn
                  ? "Open the modern translation (source) ↗"
                  : "出典・底本（現代文）を開く ↗"}
              </a>
            ) : null}
          </div>
        </>
      )}

      <footer className={drawerStyles.foot}>
        <Link href={href}>
          <a className={drawerStyles.detailLink} onClick={onClose}>
            {detailLabel}
          </a>
        </Link>
      </footer>
    </aside>,
    document.body
  );
};

export default GenjiChapterDrawer;
