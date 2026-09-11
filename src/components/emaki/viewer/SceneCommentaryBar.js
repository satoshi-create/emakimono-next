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
import GenjiHubLink from "@/components/genji/GenjiHubLink";
import { ChaptersTitle, eraColor } from "@/utils/func";
import {
  connectGenjiChapters,
  getChapterFieldRaw,
} from "@/utils/emakiChapterText";
import { emakiDisplayTitle } from "@/utils/emakiDisplayTitle";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import {
  faBookOpen,
  faList,
  faTimeline,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
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

const EmakiEraTimeline = dynamic(
  () => import("@/components/chronology/EmakiEraTimeline"),
  { ssr: false }
);

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
  // md+（768px以上）横画面で通常表示でも右下フローティングカード化する
  // （全画面＝true 相当のオーバーレイ配置にする。EmakiConteiner 側で算出）
  commentaryFloating = false,
  entryContainerRef,
  quizFab = null,
}) => {
  const { handleToId, orientation } = useContext(AppContext);
  const { locale } = useRouter();
  const { t } = useTranslation("common");

  const { title, titleen, era, eraen } = data;
  const isGenji = typeof titleen === "string" && titleen.includes("genji");
  const emakis = data.emakis || [];

  const filterEkotobas = useMemo(
    () => emakis.filter((item) => item.cat === "ekotoba"),
    [emakis]
  );

  // 段サムネイル: 画像シーンは chapter が空("") のため、直前の ekotoba 章へ出現順で紐付ける
  const chapterThumbMap = useMemo(() => {
    const map = new Map();
    let currentChapter = null;
    let leadingSrc = null; // 先頭が画像の巻用
    emakis.forEach((item) => {
      if (item.cat === "ekotoba") {
        if (currentChapter === null && leadingSrc) {
          map.set(item.chapter, leadingSrc);
        }
        currentChapter = item.chapter;
      } else if (item.cat === "image" && item.src) {
        if (currentChapter === null) {
          if (!leadingSrc) leadingSrc = item.src;
        } else if (!map.has(currentChapter)) {
          map.set(currentChapter, item.src); // 各章の先頭画像を1枚採用
        }
      }
    });
    return map;
  }, [emakis]);

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
  // スマホ横画面は画像隠れ防止のためデフォルトで閉じる
  const [closed, setClosed] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      orientation === "landscape" &&
      window.matchMedia("(max-width: 1023px)").matches
    );
  });
  // バー内スワップ: "commentary"（解説）| "index"（段構成一覧）
  const [viewMode, setViewMode] = useState("commentary");

  // 一覧を開いた時のみ行データ（title / desc / thumb）を生成する
  const indexRows = useMemo(() => {
    if (viewMode !== "index") return [];
    const isEn = locale === "en";
    return filterEkotobas.map((item) => ({
      linkId: item.linkId,
      title: isEn
        ? ChaptersTitle(titleen, title, item.chapter, "titleen", item.genji_chapter)
        : ChaptersTitle(titleen, title, item.chapter, "title", item.genji_chapter),
      desc: stripHtml(
        getChapterFieldRaw(
          titleen,
          title,
          item.chapter,
          isEn ? "descen" : "desc",
          item.desc,
          item.genji_chapter
        )
      ),
      thumb: chapterThumbMap.has(item.chapter)
        ? buildCloudinaryUrl(chapterThumbMap.get(item.chapter), [
            "w_160",
            "f_auto",
            "q_auto:eco",
          ])
        : null,
    }));
  }, [viewMode, filterEkotobas, chapterThumbMap, locale, titleen, title]);
  // 現代文 / 古文 / 解説。詞書ありは現代文デフォルト。段変更でも維持（欠落時のみフォールバック）
  const [textMode, setTextMode] = useState("gendaibun");
  const wrapRef = useRef(null);
  const prevActiveIndexRef = useRef(activeIndex);
  const prevOrientationRef = useRef(orientation);

  // スマホ: 縦→横で閉じる / 横→縦で開く（PC は触らない）
  useEffect(() => {
    if (prevOrientationRef.current === orientation) return;
    prevOrientationRef.current = orientation;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    if (orientation === "landscape") {
      setClosed(true);
      setExpanded(false);
      setViewMode("commentary");
    } else if (orientation === "portrait") {
      setClosed(false);
    }
  }, [orientation]);

  // 段が変わったら段一覧のみ閉じる。展開状態(expanded)は維持し、
  // 次段の解説を開いたまま閲覧できるようにする。
  useEffect(() => {
    if (prevActiveIndexRef.current !== activeIndex) {
      prevActiveIndexRef.current = activeIndex;
      setViewMode("commentary");
    }
  }, [activeIndex]);

  // フローティングカード（全画面 or md+横）のドラッグ＆ドロップ移動。
  // ヘッダー（段タイトル行）を掴んでビューポート内の任意位置へ移動できる。
  // 初期位置は右下固定で、カードのダブルクリックで初期位置へ戻す。
  const cardFloats = isFullscreen || commentaryFloating;
  // 既定位置（右下）からの移動量 px。null は既定位置
  const [cardPos, setCardPos] = useState(null);
  const cardPosRef = useRef(null);
  const [isCardDragging, setIsCardDragging] = useState(false);
  const dragAnchorRef = useRef(null); // {pointerId, startX, startY, baseDx, baseDy, defLeft, defTop, w, h, moved}
  const suppressCardClickRef = useRef(false);

  // コンテナ（entry-container）内に収まるよう境界クランプ
  const clampCardDelta = (dx, dy, anchor) => {
    const c = entryContainerRef?.current;
    if (!c || !anchor) return { x: dx, y: dy };
    const maxX = c.clientWidth - anchor.w - anchor.defLeft;
    const maxY = c.clientHeight - anchor.h - anchor.defTop;
    return {
      x: Math.min(Math.max(dx, -anchor.defLeft), maxX),
      y: Math.min(Math.max(dy, -anchor.defTop), maxY),
    };
  };

  const onCardPointerDown = (e) => {
    if (!cardFloats) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // ドラッグ面は「段タイトル行」（ヘッダー内のハンドル相当）。
    // いいね・共有・閉じる等の操作ボタン上ではドラッグ開始しない
    if (!e.target.closest(`.${styles.titleLine}`)) return;
    if (
      e.target.closest(
        `a, [role='button'], .${styles.titleActions}, button:not(.${styles.titleBtn})`
      )
    ) {
      return;
    }
    const wrap = wrapRef.current;
    const c = entryContainerRef?.current;
    if (!wrap || !c) return;
    const wrapRect = wrap.getBoundingClientRect();
    const cRect = c.getBoundingClientRect();
    const base = cardPosRef.current;
    const baseDx = base ? base.x : 0;
    const baseDy = base ? base.y : 0;
    dragAnchorRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseDx,
      baseDy,
      // 既定位置（DnD 前）のコンテナ左上からの座標
      defLeft: wrapRect.left - cRect.left - baseDx,
      defTop: wrapRect.top - cRect.top - baseDy,
      w: wrapRect.width,
      h: wrapRect.height,
      moved: false,
    };
    // 絵巻本体の横スクロール・パームドラッグが誤発火しないよう伝播を止め、
    // ポインターをカード側で捕捉し続ける
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      /* capture 不可環境では move/up が外れても矩形クランプで復帰する */
    }
  };

  const onCardPointerMove = (e) => {
    const a = dragAnchorRef.current;
    if (!a || a.pointerId !== e.pointerId) return;
    e.stopPropagation();
    const dx = a.baseDx + (e.clientX - a.startX);
    const dy = a.baseDy + (e.clientY - a.startY);
    // 誤タップ対策のしきい値。未満ならドラッグ扱いしない（クリックで展開は維持）
    if (!a.moved && Math.abs(dx - a.baseDx) + Math.abs(dy - a.baseDy) < 6) {
      return;
    }
    if (!a.moved) {
      a.moved = true;
      setIsCardDragging(true);
    }
    if (e.cancelable) e.preventDefault();
    const p = clampCardDelta(dx, dy, a);
    cardPosRef.current = p;
    setCardPos(p);
  };

  const endCardDrag = (e, { suppressClick }) => {
    const a = dragAnchorRef.current;
    if (!a || a.pointerId !== e.pointerId) return;
    e.stopPropagation();
    if (a.moved && suppressClick) {
      // ドラッグ直後の click（展開トグル等）を抑止する
      suppressCardClickRef.current = true;
      setTimeout(() => {
        suppressCardClickRef.current = false;
      }, 0);
    }
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch (err) {
      /* noop */
    }
    dragAnchorRef.current = null;
    setIsCardDragging(false);
  };

  const onCardPointerUp = (e) => endCardDrag(e, { suppressClick: true });
  const onCardPointerCancel = (e) => endCardDrag(e, { suppressClick: false });

  const onCardClickCapture = (e) => {
    if (!suppressCardClickRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressCardClickRef.current = false;
  };

  const onCardDoubleClick = (e) => {
    if (!cardFloats) return;
    e.stopPropagation();
    cardPosRef.current = null;
    setCardPos(null);
  };

  // 一覧表示中の Esc で解説へ戻す
  useEffect(() => {
    if (viewMode !== "index") return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setViewMode("commentary");
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [viewMode]);

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
    const genjiCh = current.genji_chapter;
    const descRaw = getChapterFieldRaw(
      titleen,
      title,
      current.chapter,
      isEn ? "descen" : "desc",
      current.desc,
      genjiCh
    );
    // 現代文 EN は gendaibunen のみ（未整備なら空）
    const gendaibunRaw = getChapterFieldRaw(
      titleen,
      title,
      current.chapter,
      isEn ? "gendaibunen" : "gendaibun",
      isEn ? "" : current.gendaibun,
      genjiCh
    );
    // EN は kobunen のみ（未整備なら空。日本語 kobun へ落とさない）
    const kobunHtml = getChapterFieldRaw(
      titleen,
      title,
      current.chapter,
      isEn ? "kobunen" : "kobun",
      isEn ? "" : current.kobun,
      genjiCh
    );
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
        data-fullscreen={cardFloats ? "true" : "false"}
      >
        {quizFab}
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
      ? ChaptersTitle(
          titleen,
          title,
          current.chapter,
          "titleen",
          current.genji_chapter
        )
      : ChaptersTitle(
          titleen,
          title,
          current.chapter,
          "title",
          current.genji_chapter
        );

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
  // 1モードでもタブを出す（EN で Classical 欠落時も Commentary ラベルを残す）
  const showModeTabs = availableModes.length >= 1;

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
    setViewMode("commentary"); // 選択後は解説ビューへ戻す
  };

  const hasMultipleSections = filterEkotobas.length > 1;

  return (
    <div
      ref={wrapRef}
      className={`${styles.wrap} ${isCardDragging ? styles.dragging : ""}`}
      data-fullscreen={cardFloats ? "true" : "false"}
      style={
        cardFloats && cardPos
          ? { transform: `translate3d(${cardPos.x}px, ${cardPos.y}px, 0)` }
          : undefined
      }
      onDoubleClick={onCardDoubleClick}
    >
      <div
        ref={barRef}
        className={styles.bar}
        data-orientation={orientation}
        data-fullscreen={cardFloats ? "true" : "false"}
        data-expanded={expanded ? "true" : "false"}
        data-text-mode={activeMode}
      >
        <div
          className={styles.header}
          onPointerDown={onCardPointerDown}
          onPointerMove={onCardPointerMove}
          onPointerUp={onCardPointerUp}
          onPointerCancel={onCardPointerCancel}
          onClickCapture={onCardClickCapture}
        >
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
          {viewMode === "index" ? (
            <nav
              className={styles.sectionIndex}
              aria-label={t("viewer.sectionList")}
            >
              {indexRows.map((row, i) => (
                <button
                  key={row.linkId}
                  type="button"
                  className={`${styles.indexItem} ${
                    i === activeIndex ? styles.indexItemActive : ""
                  }`}
                  onClick={() => handleNavigate(i)}
                >
                  {row.thumb ? (
                    <img
                      className={styles.indexThumb}
                      src={row.thumb}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span className={styles.indexThumb} aria-hidden="true" />
                  )}
                  <span className={styles.indexText}>
                    <span className={styles.indexTitle}>{row.title}</span>
                    {row.desc ? (
                      <span className={styles.indexDesc}>{row.desc}</span>
                    ) : null}
                  </span>
                  {i === activeIndex && (
                    <span className={styles.indexCurrent}>
                      {t("viewer.currentSection")}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          ) : (
            <>
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
                    expanded &&
                    activeMode === "kobun" &&
                    chapterTexts.kobunHtml ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: chapterTexts.kobunHtml,
                        }}
                      />
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
            </>
          )}
          {/* ユーティリティはバー下部（タイトル圧迫を避ける） */}
          <div className={styles.utilityActions}>
            {quizFab}
            <div className={styles.utilityActionsEnd}>
            {isGenji && current?.genji_chapter ? (
              <GenjiHubLink
                genjieslug={
                  connectGenjiChapters(current.genji_chapter, "path") ||
                  undefined
                }
                variant="icon"
                sceneTitle={chapterTitle}
              />
            ) : null}
            {hasMultipleSections && (
              <button
                type="button"
                className={`${styles.listBtn} ${
                  viewMode === "index" ? styles.listBtnActive : ""
                }`}
                onClick={() =>
                  setViewMode((v) => (v === "index" ? "commentary" : "index"))
                }
                aria-label={
                  viewMode === "index"
                    ? t("viewer.backToCommentary")
                    : t("viewer.sectionList")
                }
                aria-expanded={viewMode === "index"}
                title={
                  viewMode === "index"
                    ? t("viewer.backToCommentary")
                    : t("viewer.sectionList")
                }
              >
                <FontAwesomeIcon icon={faList} />
              </button>
            )}
            {eraen && (
              <EmakiEraTimeline
                eraen={eraen}
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
                setViewMode("commentary");
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
      </div>
    </div>
  );
};

export default SceneCommentaryBar;
