/**
 * ボトムコメントバー: ビューア最下部に常駐するシーン解説バー。
 *
 * 段タイトル＋本文を1つのバーにまとめて表示する。詞書あり（kobun）では
 * デフォルトは現代文。タブ順は現代文 → 古文 → 解説。詞書なしは解説のみ。
 *
 * 再生中も段タイトル・本文は liveSceneIndex に追従する（EmakiConteiner から渡される）。
 *
 * GA: 旧 ModalDesc の scene_modal_open イベントを、シート展開時に移行。
 * 関連: EmakiConteiner.js / emakiChapterText.js
 */
import * as gtag from "@/libs/api/gtag";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/SceneCommentaryBar.module.css";
import SceneLikeButton from "@/components/emaki/viewer/SceneLikeButton";
import ShareButtons from "@/components/emaki/viewer/ShareButtons";
import EmakiEraTimeline from "@/components/chronology/EmakiEraTimeline";
import { ChaptersTitle, eraColor, useLocaleData } from "@/utils/func";
import { getChapterFieldRaw } from "@/utils/emakiChapterText";
import { emakiDisplayTitle } from "@/utils/emakiDisplayTitle";
import { getLiveSlugs } from "@/utils/getLiveSlugs";
import {
  faBookOpen,
  faList,
  faTimeline,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import parse from "html-react-parser";
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

const TEXT_MODES = ["gendaibun", "kobun", "desc"];

const stripHtml = (html) =>
  (html || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();

const SceneCommentaryBar = ({
  data,
  navIndex,
  isFullscreen = false,
  entryContainerRef,
}) => {
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
  // 現代文 / 古文 / 解説。詞書ありは現代文デフォルト。段変更でも維持（欠落時のみフォールバック）
  const [textMode, setTextMode] = useState("gendaibun");
  const wrapRef = useRef(null);
  const prevActiveIndexRef = useRef(activeIndex);

  // 段が変わったら展開シート・段一覧を閉じる（再生中の自動追従含む）
  useEffect(() => {
    if (prevActiveIndexRef.current !== activeIndex) {
      prevActiveIndexRef.current = activeIndex;
      setExpanded(false);
      setListOpen(false);
    }
  }, [activeIndex]);

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
      const c =
        entryContainerRef?.current ?? el.closest(".entry-container");
      if (c) {
        c.style.setProperty("--commentary-bar-full-h", `${h}px`);
      }
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded, closed, textMode, entryContainerRef]);

  const current = filterEkotobas[activeIndex];

  // 章テキスト（ロケール別フィールド）。hooks は early return より前に置く。
  const chapterTexts = useMemo(() => {
    if (!current) {
      return { desc: "", gendaibun: "", kobun: "", kobunHtml: "" };
    }
    const isEn = locale === "en";
    const descRaw = getChapterFieldRaw(
      titleen,
      title,
      current.chapter,
      isEn ? "descen" : "desc",
      current.desc
    );
    const gendaibunRaw =
      getChapterFieldRaw(
        titleen,
        title,
        current.chapter,
        isEn ? "gendaibunen" : "gendaibun",
        current.gendaibun
      ) ||
      (isEn
        ? getChapterFieldRaw(
            titleen,
            title,
            current.chapter,
            "gendaibun",
            current.gendaibun
          )
        : "");
    const kobunHtml =
      getChapterFieldRaw(
        titleen,
        title,
        current.chapter,
        isEn ? "kobunen" : "kobun",
        current.kobun
      ) ||
      (isEn
        ? getChapterFieldRaw(
            titleen,
            title,
            current.chapter,
            "kobun",
            current.kobun
          )
        : "");
    return {
      desc: stripHtml(descRaw),
      gendaibun: stripHtml(gendaibunRaw),
      kobun: stripHtml(kobunHtml),
      kobunHtml,
    };
  }, [current, locale, titleen, title]);

  // 現代文・古文は詞書原文（kobun）がある段だけ。詞書なし巻の場面描写 gendaibun はタブに出さない。
  const availableModes = useMemo(
    () =>
      TEXT_MODES.filter((mode) => {
        if (mode === "desc") return chapterTexts.desc.length > 0;
        if (mode === "gendaibun")
          return (
            chapterTexts.kobun.length > 0 && chapterTexts.gendaibun.length > 0
          );
        return chapterTexts.kobun.length > 0;
      }),
    [chapterTexts]
  );

  // 現モードが欠落したら availableModes 先頭へ（現代文 → 古文 → 解説）
  useEffect(() => {
    if (availableModes.length === 0) return;
    if (!availableModes.includes(textMode)) {
      setTextMode(availableModes[0]);
    }
  }, [availableModes, textMode]);

  if (!current) return null;

  const shareTitle =
    locale === "en"
      ? emakiDisplayTitle(data, locale)
      : `${title ?? ""}`.trim();

  // ×で閉じ: 小さな「解説を表示」ボタンのみ（再生中も再表示可能）
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

  const activeMode = availableModes.includes(textMode)
    ? textMode
    : availableModes[0] || "desc";
  const plainBody =
    activeMode === "desc"
      ? chapterTexts.desc
      : activeMode === "gendaibun"
        ? chapterTexts.gendaibun
        : chapterTexts.kobun;
  const hasBody = plainBody.length > 0;
  const splitAt =
    locale === "en" ? plainBody.search(/\.\s/) : plainBody.indexOf("。");
  const hasRest = hasBody && splitAt >= 0 && splitAt < plainBody.length - 1;
  const previewText = hasRest ? plainBody.slice(0, splitAt + 1) : plainBody;
  const showModeTabs = availableModes.length >= 2;

  const accent = eraColor(era) || "#8a6d3b";
  const seeMoreLabel = t("viewer.seeMore", {
    defaultValue: locale === "en" ? "See details" : "詳細をみる",
  });

  const toggleExpanded = () => {
    const next = !expanded;
    if (next) {
      gtag.event("scene_modal_open", {
        emaki_title: title,
        emaki_id: titleen,
        scene_index: current.linkId,
        scene_chapter: current.chapter,
        text_mode: activeMode,
      });
    }
    setExpanded(next);
  };

  const handleTextMode = (mode) => {
    if (mode === activeMode) return;
    setTextMode(mode);
    setExpanded(false);
    gtag.event("scene_text_mode_change", {
      emaki_title: title,
      emaki_id: titleen,
      scene_index: current.linkId,
      scene_chapter: current.chapter,
      text_mode: mode,
    });
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
        data-text-mode={activeMode}
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
          {showModeTabs && (
            <div
              className={styles.modeTabs}
              role="tablist"
              aria-label={t("viewer.textMode.label")}
              onClick={(e) => e.stopPropagation()}
            >
              {availableModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={mode === activeMode}
                  className={`${styles.modeTab} ${
                    mode === activeMode ? styles.modeTabActive : ""
                  }`}
                  onClick={() => handleTextMode(mode)}
                >
                  {t(`viewer.textMode.${mode}`)}
                </button>
              ))}
            </div>
          )}
          {/* 本文。タップで開閉。古文の展開時は ruby HTML を描画 */}
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
            <span
              className={`${styles.bodyText} ${
                activeMode === "kobun" ? styles.bodyTextClassical : ""
              }`}
            >
              {hasBody ? (
                expanded && activeMode === "kobun" && chapterTexts.kobunHtml ? (
                  parse(chapterTexts.kobunHtml)
                ) : expanded ? (
                  plainBody
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
              ) : null}
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
