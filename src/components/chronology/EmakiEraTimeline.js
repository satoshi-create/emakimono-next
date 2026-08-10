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

/**
 * 絵巻ページ/時代ページに埋め込む、1時代分の年表。
 * デスクトップ・モバイルともにボタン → モーダルで表示する。
 * eraen に対応する簡易年表が無い時代は、年表ページへのリンクのみ表示する。
 */
const EmakiEraTimeline = ({ eraen, liveSlugs, t }) => {
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

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsModalOpen(true)}
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

      {isModalOpen && (
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
        </div>
      )}
    </>
  );
};

export default EmakiEraTimeline;
