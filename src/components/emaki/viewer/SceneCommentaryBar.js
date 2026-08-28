/**
 * ボトムコメントバー: ビューア最下部に常駐するシーン解説バー。
 *
 * 段タイトル＋解説文を1つのバーにまとめて表示する。折りたたみ時は冒頭文と
 * 「…詳細をみる」を表示し、タップで同じバー内に全文（冒頭＋続き）を
 * 1段落のまま展開する。絵巻画像の上部は常に残るため、絵巻と解説を
 * 見比べながら鑑賞できる。
 *
 * 表示制御はアイドル時のUI非表示（isUIVisible）とは独立している。
 * バーは常時表示され、×アイコンで閉じた場合は「解説を表示」ボタンのみを
 * 残す（再表示はそのボタンから）。
 *
 * GA: 旧 ModalDesc の scene_modal_open イベントを、シート展開時に移行。
 * 関連: EmakiConteiner.js（組み込み先）, func.js（ChaptersTitle/Gendaibun/Desc）
 */
import * as gtag from "@/libs/api/gtag";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/SceneCommentaryBar.module.css";
import SceneLikeButton from "@/components/emaki/viewer/SceneLikeButton";
import ShareButtons from "@/components/emaki/viewer/ShareButtons";
import EmakiEraTimeline from "@/components/chronology/EmakiEraTimeline";
import {
  ChaptersGendaibun,
  ChaptersTitle,
  eraColor,
  getChapterDescRaw,
  useLocaleData,
} from "@/utils/func";
import { emakiDisplayTitle } from "@/utils/emakiDisplayTitle";
import { getLiveSlugs } from "@/utils/getLiveSlugs";
import {
  faBookOpen,
  faList,
  faTimeline,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "next-i18next";

const SceneCommentaryBar = ({ data, navIndex, isFullscreen = false }) => {
  const { handleToId, orientation } = useContext(AppContext);
  const { locale } = useRouter();
  const { t } = useTranslation("common");

  const { title, titleen, era, eraen } = data;
  const emakis = data.emakis || [];
  const { t: alldata } = useLocaleData();
  const liveSlugs = getLiveSlugs(alldata);

  const filterEkotobas = useMemo(
    () => emakis.filter((item) => item.cat === "ekotoba"),
    [emakis]
  );

  // 現在の段: navIndex（スクロール検出のセクションID）以前で最後のekotoba
  const activeIndex = useMemo(() => {
    if (filterEkotobas.length === 0) return -1;
    let current = 0;
    filterEkotobas.forEach((item, i) => {
      if (item.linkId <= navIndex) current = i;
    });
    return current;
  }, [filterEkotobas, navIndex]);

  const [expanded, setExpanded] = useState(false);
  // バー自体を閉じる状態（×アイコンで操作）。アイドル時のUI非表示（isUIVisible）とは独立
  const [closed, setClosed] = useState(false);
  // 段一覧ポップオーバーの開閉（解説文の展開（expanded）とは独立）
  const [listOpen, setListOpen] = useState(false);
  const wrapRef = useRef(null);

  // 段一覧を開いている間は、外側クリック / Esc で閉じる
  useEffect(() => {
    if (!listOpen) return;
    const handlePointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setListOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setListOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [listOpen]);

  // 実バー高さ（折りたたみ時は header のみ、展開時は全文ぶん、閉じた時は再表示ボタン分）を
  // 親の entry-container に --commentary-bar-full-h として反映する。
  // バーが縦に伸びたり閉じたりしても、Navigation / PositionIndicator / 全画面ボタン等の
  // 下部UIがバーに隠れず、常にバーの上に持ち上がるようにする。
  //
  // useLayoutEffect を使い「ペイント前」に変数を更新することで、
  // 展開/折りたたみ時に下部UIが一度下がってから跳ね上がる中間フレームを防ぐ。
  const barRef = useRef(null);
  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      // バーを .wrap で包んでも、下部UIの持ち上げ量は entry-container に
      // 設定する必要があるため、closest で基準要素を特定する
      const containerEl = el.closest(".entry-container");
      if (containerEl) {
        containerEl.style.setProperty("--commentary-bar-full-h", `${h}px`);
      }
    };
  // ペイント前に同期計測（expanded / closed 変化時も effect が再実行されるため、
  // 高さが反映された状態で変数が更新される）
  update();
  if (typeof ResizeObserver === "undefined") return;
  const ro = new ResizeObserver(update);
  ro.observe(el);
  return () => ro.disconnect();
  }, [expanded, closed]);

  const current = filterEkotobas[activeIndex];

  if (!current) return null;

  const shareTitle =
    locale === "en"
      ? emakiDisplayTitle(data, locale)
      : `${title ?? ""}`.trim();

  // ×で閉じられた場合: バー本体の代わりに、小さな「解説を表示」ボタンのみを表示する。
  // 閉じ状態はアイドル時のUI非表示（isUIVisible）とは独立しているため、
  // ナビメニューのみが従来どおり非表示になる。
  if (closed) {
    const showLabel = t("viewer.showCommentary", {
      defaultValue: locale === "en" ? "Show commentary" : "解説を表示",
    });
    return (
      <div
        ref={barRef}
        className={styles.reopenBar}
        data-orientation={orientation}
        data-fullscreen={isFullscreen ? "true" : "false"}
      >
        <button
          type="button"
          className={styles.reopenBtn}
          onClick={() => setClosed(false)}
          aria-label={showLabel}
        >
          <FontAwesomeIcon icon={faBookOpen} />
          <span>{showLabel}</span>
        </button>
      </div>
    );
  }

  const chapterTitle =
    locale === "en"
      ? ChaptersTitle(titleen, title, current.chapter, "titleen")
      : ChaptersTitle(titleen, title, current.chapter, "title");

  const gendaibunBody = ChaptersGendaibun(
    titleen,
    title,
    current.chapter,
    current.gendaibun
  );

  // 解説文の生テキスト（HTMLタグ除去）。desc を正本とし、未整備の段は現代文にフォールバック。
  const rawCommentary = (
    getChapterDescRaw(
      titleen,
      title,
      current.chapter,
      locale === "en" ? "descen" : "desc",
      current.desc
    ) || ""
  )
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();

  // 冒頭文と続きに分割する。タップで「続き」を同じバー内に展開して表示する。
  // 例) バー: 「これは、…の姿です。…詳細をみる」 → 展開: 「肌には血色が宿り、…」
  const hasDesc = rawCommentary.length > 0;
  const splitAt =
    locale === "en"
      ? rawCommentary.search(/\.\s/)
      : rawCommentary.indexOf("。");
  const hasRest = hasDesc && splitAt >= 0 && splitAt < rawCommentary.length - 1;
  const previewText = hasRest
    ? rawCommentary.slice(0, splitAt + 1)
    : rawCommentary;
  // desc が無い段は現代文（gendaibun）を全文表示する（分割しない）
  const fallbackBody = hasDesc ? null : gendaibunBody;

  const accent = eraColor(era) || "#8a6d3b";
  // 翻訳キー未解決時（開発サーバーキャッシュ等）でも正しい文言を表示する
  const seeMoreLabel = t("viewer.seeMore", {
    defaultValue: locale === "en" ? "See details" : "詳細をみる",
  });

  const toggleExpanded = () => {
    const next = !expanded;
    if (next) {
      // GA4: 解説シートを開いた時にイベント送信（旧 ModalDesc から移行）
      gtag.event("scene_modal_open", {
        emaki_title: title,
        emaki_id: titleen,
        scene_index: current.linkId,
        scene_chapter: current.chapter,
      });
    }
    setExpanded(next);
  };

  const handleNavigate = (ekotobaIndex) => {
    const target = filterEkotobas[ekotobaIndex];
    if (!target) return;
    handleToId(target.linkId);
    setListOpen(false); // 選択後はポップオーバーを閉じる
  };

  const hasMultipleSections = filterEkotobas.length > 1;

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      data-fullscreen={isFullscreen ? "true" : "false"}
    >
      <div
        ref={barRef}
        className={styles.bar}
        data-orientation={orientation}
        data-fullscreen={isFullscreen ? "true" : "false"}
        data-expanded={expanded ? "true" : "false"}
      >
        <div className={styles.header}>
          {/* 段タイトル行: タイトル隣はいいね・共有のみ */}
          <div className={styles.titleLine}>
            <button
              type="button"
              className={styles.titleBtn}
              onClick={toggleExpanded}
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? t("viewer.closeDetails")
                  : t("viewer.seeDetailsOfSection")
              }
            >
              <span className={styles.title} style={{ color: accent }}>
                {chapterTitle}
              </span>
            </button>
            <div
              className={styles.titleActions}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <SceneLikeButton
                titleen={titleen}
                title={title}
                chapter={current.chapter}
                index={current.linkId}
                variant="bar"
              />
              <ShareButtons
                variant="share"
                navIndex={current.linkId}
                emakiId={titleen}
                shareTitle={shareTitle}
              />
            </div>
          </div>
          {/* 解説文。タップで開閉 */}
          <button
            type="button"
            className={styles.body}
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-label={
              expanded
                ? t("viewer.closeDetails")
                : t("viewer.seeDetailsOfSection")
            }
          >
            <span className={styles.gendaibun}>
              {hasDesc ? (
                expanded ? (
                  rawCommentary
                ) : (
                  <>
                    {previewText}
                    {hasRest && (
                      <span className={styles.moreHint}>
                        …{seeMoreLabel}
                      </span>
                    )}
                  </>
                )
              ) : (
                fallbackBody
              )}
            </span>
          </button>
          {/* ユーティリティはバー下部（タイトル圧迫を避ける） */}
          <div className={styles.utilityActions}>
            {hasMultipleSections && (
              <button
                type="button"
                className={`${styles.listBtn} ${
                  listOpen ? styles.listBtnActive : ""
                }`}
                onClick={() => setListOpen((v) => !v)}
                aria-label={t("viewer.sectionList")}
                aria-expanded={listOpen}
                title={t("viewer.sectionList")}
              >
                <FontAwesomeIcon icon={faList} />
              </button>
            )}
            {eraen && (
              <EmakiEraTimeline
                eraen={eraen}
                liveSlugs={liveSlugs}
                t={t}
                trigger={(open) =>
                  open ? (
                    <button
                      type="button"
                      className={styles.timelineBtn}
                      onClick={open}
                      aria-haspopup="dialog"
                      aria-label={t("timeline.embedTitle")}
                      title={t("timeline.embedTitle")}
                    >
                      <FontAwesomeIcon icon={faTimeline} />
                    </button>
                  ) : (
                    <Link href="/timeline">
                      <a
                        className={styles.timelineBtn}
                        aria-label={t("timeline.embedTitle")}
                        title={t("timeline.embedTitle")}
                      >
                        <FontAwesomeIcon icon={faTimeline} />
                      </a>
                    </Link>
                  )
                }
              />
            )}
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => {
                setListOpen(false);
                setClosed(true);
              }}
              aria-label={t("viewer.closeCommentaryBar", {
                defaultValue:
                  locale === "en"
                    ? "Close commentary bar"
                    : "解説バーを閉じる",
              })}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>
      </div>
      {/* 段一覧はバー内に置かず、バー直上に浮かぶポップオーバーとして表示する
          （解説文の展開とは独立して、アイコンクリックでのみ開く） */}
      {listOpen && hasMultipleSections && (
        <nav className={styles.sceneList} aria-label={t("viewer.sectionList")}>
          {filterEkotobas.map((item, i) => (
            <button
              key={item.linkId}
              type="button"
              className={`${styles.sceneItem} ${
                i === activeIndex ? styles.sceneItemActive : ""
              }`}
              onClick={() => handleNavigate(i)}
            >
              <span className={styles.sceneNum}>{i + 1}</span>
              <span className={styles.sceneTitle}>
                {locale === "en"
                  ? ChaptersTitle(titleen, title, item.chapter, "titleen")
                  : ChaptersTitle(titleen, title, item.chapter, "title")}
              </span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default SceneCommentaryBar;
