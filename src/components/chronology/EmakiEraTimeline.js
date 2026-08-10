import EmakiTimelineSimple from "@/components/chronology/EmakiTimelineSimple";
import {
  en as enTimelineSimple,
  ja as jaTimelineSimple,
} from "@/data/chronology/emakiTimelineSimple";
import styles from "@/styles/EmakiEraTimeline.module.css";
import { eraColor } from "@/utils/func";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 絵巻ページ/時代ページに埋め込む、1時代分の年表。
 * デスクトップ・モバイルともにボタン → モーダルで表示する。
 * eraen に対応する簡易年表が無い時代は、年表ページへのリンクのみ表示する。
 *
 * trigger（render-prop）を渡すと、トリガーボタンを差し替えられる。
 * 引数: trigger(open, era) — open はモーダルを開く関数（時代データが無い場合は null）
 */
const EmakiEraTimeline = ({ eraen, liveSlugs, t, trigger }) => {
  const { locale } = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const source = locale === "en" ? enTimelineSimple : jaTimelineSimple;
  const rows = source.length ? source : jaTimelineSimple;
  const era = rows.find((row) => row.eraen === eraen);

  // モーダル表示中は背景スクロールを止める
  useEffect(() => {
    if (!isModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isModalOpen]);

  if (!era) {
    // 時代データが無い場合は年表ページへのリンクを表示
    // trigger 指定時は、リンク用のトリガーとして open=null を渡す
    if (trigger) {
      return trigger(null, null);
    }
    return (
      <div className={styles.fallback}>
        <Link href="/timeline">
          <a className={styles.fullLink}>
            <span>{t("timeline.viewFull")}</span>
            <span aria-hidden>→</span>
          </a>
        </Link>
      </div>
    );
  }

  const color = eraColor(era.era);
  const open = () => setIsModalOpen(true);

  return (
    <>
      {trigger ? (
        trigger(open, era)
      ) : (
        <button
          type="button"
          className={styles.trigger}
          onClick={open}
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
        >
          <span className={styles.summaryBadge} style={{ background: color }}>
            {era.era}
          </span>
          <span className={styles.summaryTitle}>{t("timeline.embedTitle")}</span>
          <span className={styles.chevron} aria-hidden>
            ▾
          </span>
        </button>
      )}

      {/* モーダルは body 直下に portal 描画する。
          解説バー等の backdrop-filter が position:fixed の基準（containing block）を
          変えてモーダルをずらすのを防ぐため、常に viewport 基準で表示する */}
      {isModalOpen &&
        createPortal(
          <div className={styles.modalOverlay}>
            <div
              className={styles.modalBackdrop}
              onClick={() => setIsModalOpen(false)}
              aria-hidden
            />
            <div
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-label={t("timeline.embedTitle")}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  <span className={styles.summaryBadge} style={{ background: color }}>
                    {era.era}
                  </span>
                  <span className={styles.modalPeriod}>{era.period}</span>
                </h3>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={() => setIsModalOpen(false)}
                  aria-label={t("timeline.close")}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <EmakiTimelineSimple rows={[era]} liveSlugs={liveSlugs} t={t} />
                <Link href="/timeline">
                  <a
                    className={styles.modalFullLink}
                    onClick={() => setIsModalOpen(false)}
                  >
                    <span>{t("timeline.viewFull")}</span>
                    <span aria-hidden>→</span>
                  </a>
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default EmakiEraTimeline;
