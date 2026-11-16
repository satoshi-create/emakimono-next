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
import FolkloreDetailSheet from "@/components/emaki/folklore/FolkloreDetailSheet";
import FolkloreSceneList from "@/components/emaki/folklore/FolkloreSceneList";
import CommentaryExploreView from "@/components/emaki/commentary/CommentaryExploreView";
import CommentaryTextView from "@/components/emaki/commentary/CommentaryTextView";
import CommentarySectionIndex from "@/components/emaki/commentary/CommentarySectionIndex";
import FolkloreToggleButton from "@/components/emaki/folklore/FolkloreToggleButton";
import SceneLikeButton from "@/components/emaki/viewer/SceneLikeButton";
import ShareButtons from "@/components/emaki/viewer/ShareButtons";
import GenjiHubLink from "@/components/genji/GenjiHubLink";
import KusouzuHubLink from "@/components/emaki/kusouzu/KusouzuHubLink";
import useFolkloreForScroll from "@/hooks/emaki/useFolkloreForScroll";
import { ChaptersTitle, eraColor } from "@/utils/func";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import {
  connectGenjiChapters,
  getChapterCustomData,
  getChapterFieldRaw,
} from "@/utils/emakiChapterText";
import { resolveReferenceUrl } from "@/utils/amazonUrl";
import { getMotifDefinition, findRelatedScenesByMotif } from "@/utils/motifNetwork";
import { emakiDisplayTitle } from "@/utils/emakiDisplayTitle";
import { isByobuScroll } from "@/utils/isByobuScroll";
import { getMasterByRawSpotId } from "@/data/rakuchu-rakugai/rakuchuMotifMaster";
import {
  SCROLL_EDITIONS,
  SCROLL_PILL_LABELS,
} from "@/components/rakuchu-rakugai/rakuchuScrollConstants";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import { resolveEbikiScrollTarget } from "@/utils/resolveQuizJump";
import { triggerEbikiSpotlight } from "@/utils/triggerEbikiSpotlight";
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

const TEXT_MODES = ["gendaibun", "kobun", "desc", "tansaku"];

const BYOBU_CATEGORY_JA = {
  power: "権力・城郭",
  temple: "寺社",
  town: "町並み・祭礼・河川",
  court: "公家・御所",
};

const BYOBU_TEXT_LINK = {
  padding: 0,
  border: "none",
  background: "transparent",
  color: "var(--clr-link, #065fd4)",
  fontSize: "inherit",
  fontWeight: 500,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
  cursor: "pointer",
  lineHeight: 1.5,
};

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
  isPlayMode = false,
  onIdlePauseChange,
  onIdleActivity,
  openPolaroidModal,
  selectedSpot = null,
  onClearSelectedSpot,
  allSpots = [],
  onSelectSpot,
}) => {
  const { handleToId, orientation } = useContext(AppContext);
  const router = useRouter();
  const { locale } = router;
  const { t } = useTranslation("common");

  const { title, titleen, era, eraen } = data;
  const { getItemsForChapter, getItemById, hasFolklore } =
    useFolkloreForScroll(titleen);
  const [folkloreItem, setFolkloreItem] = useState(null);
  // 絵引リストはデフォルト非表示（鑑賞優先）。トグルでバー内スワップ
  const [isFolkloreOpen, setIsFolkloreOpen] = useState(false);

  const isGenji = typeof titleen === "string" && titleen.includes("genji");
  const isKusouzu = isKusouzuScroll(data);
  const emakis = useMemo(() => data.emakis || [], [data.emakis]);
  const isByobuSpotMode =
    isByobuScroll(data) &&
    Array.isArray(allSpots) &&
    allSpots.length > 0;

  const activeByobuSpotEntry = useMemo(() => {
    if (!isByobuSpotMode || !selectedSpot) return null;
    const hit = allSpots.find(
      (row) =>
        row.spot?.id && String(row.spot.id) === String(selectedSpot.id)
    );
    if (hit) return hit;
    return {
      spot: selectedSpot,
      linkId: navIndex,
      sliceIndex: navIndex,
      spotGlobalIndex: 0,
    };
  }, [isByobuSpotMode, allSpots, selectedSpot, navIndex]);

  const activeByobuSpot = isByobuSpotMode
    ? activeByobuSpotEntry?.spot ?? null
    : null;

  const effectiveSpot = isByobuSpotMode ? activeByobuSpot : selectedSpot;

  const ebikiAppliedRef = useRef(null);

  // ディープリンク `?ebiki={item_id}`: 即時スクロール → スポットライト → 詳細シート
  useEffect(() => {
    const raw = router.query?.ebiki;
    if (!raw || !hasFolklore) return undefined;
    const id = String(Array.isArray(raw) ? raw[0] : raw).trim();
    if (!id) return undefined;
    const found = getItemById(id);
    if (!found) return undefined;

    if (ebikiAppliedRef.current === id) return undefined;

    // link_id 明示が最優先、なければ章画像列への offset 分解
    const target = resolveEbikiScrollTarget(emakis, found);
    if (!target) return undefined;

    ebikiAppliedRef.current = id;
    handleToId(target.linkId, {
      realign: false,
      offsetPercent: target.offsetPercent,
      behavior: "smooth",
    });
    triggerEbikiSpotlight(target.linkId, target.offsetPercent);
    setFolkloreItem(found);
  }, [router.query?.ebiki, hasFolklore, getItemById, emakis, handleToId]);

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
          "q_auto:good",
        ])
        : null,
    }));
  }, [viewMode, filterEkotobas, chapterThumbMap, locale, titleen, title]);

  const spotIndexRows = useMemo(() => {
    if (!isByobuSpotMode || viewMode !== "index") return [];
    const isEn = locale === "en";
    return allSpots.map((row) => {
      const spot = row.spot;
      const rowTitle = isEn ? spot.nameen || spot.name : spot.name;
      const master =
        typeof titleen === "string" && titleen.startsWith("rakuchu_rakugai")
          ? getMasterByRawSpotId(spot.id)
          : null;
      let desc = spot.description || spot.summary || "";
      if (!desc && master) {
        desc = isEn
          ? master.summaryEn || master.summaryJa
          : master.summaryJa;
      }
      return {
        linkId: row.linkId,
        title: rowTitle,
        desc: stripHtml(String(desc || "")),
        thumb: row.sliceSrc
          ? buildCloudinaryUrl(row.sliceSrc, [
              "w_160",
              "f_auto",
              "q_auto:good",
            ])
          : null,
      };
    });
  }, [viewMode, isByobuSpotMode, allSpots, locale, titleen]);

  const spotActiveIndex = useMemo(() => {
    if (!isByobuSpotMode || !effectiveSpot?.id) return 0;
    const i = allSpots.findIndex(
      (row) => row.spot?.id && String(row.spot.id) === String(effectiveSpot.id)
    );
    return i >= 0 ? i : 0;
  }, [isByobuSpotMode, allSpots, effectiveSpot?.id]);

  // 現代文 / 古文 / 解説。詞書ありは現代文デフォルト。段変更でも維持（欠落時のみフォールバック）
  const [textMode, setTextMode] = useState("gendaibun");
  const [selectedMotifId, setSelectedMotifId] = useState(null);
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
      setIsFolkloreOpen(false);
    } else if (orientation === "portrait") {
      setClosed(false);
    }
  }, [orientation]);

  // 段が変わったら段一覧・絵引リストを閉じる。展開状態(expanded)は維持し、
  // 次段の解説を開いたまま閲覧できるようにする。
  useEffect(() => {
    if (prevActiveIndexRef.current !== activeIndex) {
      prevActiveIndexRef.current = activeIndex;
      setViewMode("commentary");
      setIsFolkloreOpen(false);
    }
  }, [activeIndex]);

  // 絵引リスト / 詳細シート表示中はアイドル非表示を一時停止
  useEffect(() => {
    const paused = isFolkloreOpen || Boolean(folkloreItem);
    onIdlePauseChange?.(paused);
    return () => onIdlePauseChange?.(false);
  }, [isFolkloreOpen, folkloreItem, onIdlePauseChange]);

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

  // 一覧・絵引リスト表示中の Esc で解説へ戻す
  useEffect(() => {
    if (viewMode !== "index" && !isFolkloreOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setViewMode("commentary");
        setIsFolkloreOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, isFolkloreOpen]);

  // 実バー高さ（折りたたみ時は header のみ、展開時は全文ぶん、閉じた時は再表示ボタン分）を
  // 親の entry-container に --commentary-bar-full-h / --folklore-sheet-bottom として反映する。
  // FolkloreDetailSheet は .entry-container 内 Portal＋absolute のため、コンテナ下端基準の余白を渡す。
  //
  // useLayoutEffect を使い「ペイント前」に変数を更新することで、
  // 展開/折りたたみ時に下部UIが一度下がってから跳ね上がる中間フレームを防ぐ。
  // cleanup では remove せず安全余白 460px を残す（一瞬の全高伸展防止）。
  const barRef = useRef(null);
  const SAFE_SHEET_BOTTOM = "460px";

  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return undefined;
    const GAP = 12;
    const resolveContainer = () =>
      entryContainerRef?.current ?? el.closest(".entry-container");
    const update = () => {
      const h = el.getBoundingClientRect().height;
      const c = resolveContainer();
      if (!c) return;
      c.style.setProperty("--commentary-bar-full-h", `${h}px`);
      // フローティング時の bottom:4.5rem や DnD 後も、バー上端実測でシート下端を拘束
      const chrome = wrapRef.current ?? el;
      const top = chrome.getBoundingClientRect().top;
      const cBottom = c.getBoundingClientRect().bottom;
      c.style.setProperty(
        "--folklore-sheet-bottom",
        `${Math.max(0, Math.round(cBottom - top + GAP))}px`
      );
      // 旧 viewport 基準の :root 値が残ると absolute 余白と競合するため除去
      document.documentElement.style.removeProperty("--folklore-sheet-bottom");
    };
    update();
    window.addEventListener("resize", update);
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
      if (wrapRef.current && wrapRef.current !== el) {
        ro.observe(wrapRef.current);
      }
    }
    return () => {
      window.removeEventListener("resize", update);
      ro?.disconnect();
      resolveContainer()?.style.setProperty(
        "--folklore-sheet-bottom",
        SAFE_SHEET_BOTTOM
      );
    };
  }, [
    expanded,
    closed,
    textMode,
    contentTab,
    isFolkloreOpen,
    viewMode,
    cardPos,
    entryContainerRef,
    selectedSpot,
  ]);

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

  const tansakuData = useMemo(() => {
    if (!current) return null;
    return (
      getChapterCustomData(titleen, current.chapter, "tansaku") ||
      getChapterCustomData(titleen, current.chapter, "sou") ||
      current.tansaku ||
      current.sou ||
      null
    );
  }, [current, titleen]);
  const souData = tansakuData; // 内部互換エイリアス

  // 章が切り替わった際に先頭モチーフを選択
  useEffect(() => {
    if (souData && Array.isArray(souData.motifs) && souData.motifs.length > 0) {
      setSelectedMotifId(souData.motifs[0]);
    } else {
      setSelectedMotifId(null);
    }
  }, [souData]);

  // 選択されたモチーフに紐づく関連シーンを抽出
  const relatedScenes = useMemo(() => {
    if (!selectedMotifId) return [];
    const chapterVal = current?.chapter;
    if (chapterVal == null) return [];
    return findRelatedScenesByMotif(titleen, chapterVal, selectedMotifId);
  }, [selectedMotifId, current, titleen]);

  // 現代文・古文は詞書原文（kobun）がある段だけ。詞書なし巻の場面描写 gendaibun はタブに出さない。
  const availableModes = useMemo(
    () =>
      TEXT_MODES.filter((mode) => {
        if (mode === "desc") return chapterTexts.desc.length > 0;
        if (mode === "tansaku") return Boolean(tansakuData);
        if (mode === "gendaibun")
          return (
            chapterTexts.kobun.length > 0 && chapterTexts.gendaibun.length > 0
          );
        return chapterTexts.kobun.length > 0;
      }),
    [chapterTexts, tansakuData]
  );

  // 現モードが欠落したら availableModes 先頭へ（現代文 → 古文 → 解説）
  useEffect(() => {
    if (availableModes.length === 0) return;
    if (!availableModes.includes(textMode)) {
      setTextMode(availableModes[0]);
    }
  }, [availableModes, textMode]);

  const rakuchuSpotMaster = useMemo(() => {
    const spot = isByobuSpotMode ? effectiveSpot : selectedSpot;
    if (!spot) return null;
    if (typeof titleen !== "string" || !titleen.startsWith("rakuchu_rakugai")) {
      return null;
    }
    return getMasterByRawSpotId(spot.id) || null;
  }, [isByobuSpotMode, effectiveSpot, selectedSpot, titleen]);

  const [contentTab, setContentTab] = useState("scene");
  const prevSelectedSpotIdRef = useRef(null);

  useEffect(() => {
    const id = selectedSpot?.id ? String(selectedSpot.id) : null;
    if (id && id !== prevSelectedSpotIdRef.current) {
      setContentTab("spot");
    }
    if (!id) {
      setContentTab("scene");
    }
    prevSelectedSpotIdRef.current = id;
  }, [selectedSpot?.id]);

  const spotDisplay = useMemo(() => {
    const spot = isByobuSpotMode ? effectiveSpot : selectedSpot;
    if (!spot) return null;
    const isEn = locale === "en";
    const spotTitle = isEn ? spot.nameen || spot.name : spot.name;
    let spotBody = spot.description || spot.summary || "";
    if (!spotBody && rakuchuSpotMaster) {
      spotBody = isEn
        ? rakuchuSpotMaster.summaryEn || rakuchuSpotMaster.summaryJa
        : rakuchuSpotMaster.summaryJa;
    }
    const targetSpotId =
      rakuchuSpotMaster?.aliasSpotIds?.[0] || spot.id;
    const otherScrolls =
      rakuchuSpotMaster?.presentIn?.filter((te) => te !== titleen) || [];
    const rawCategory = rakuchuSpotMaster?.category || null;
    const categoryLabel = rawCategory
      ? locale === "en"
        ? rawCategory
        : BYOBU_CATEGORY_JA[rawCategory] || rawCategory
      : null;
    return {
      spotTitle,
      spotBody: stripHtml(String(spotBody || "")),
      targetSpotId,
      otherScrolls,
      categoryLabel,
    };
  }, [
    isByobuSpotMode,
    effectiveSpot,
    selectedSpot,
    rakuchuSpotMaster,
    locale,
    titleen,
  ]);

  if (!current && !isByobuSpotMode) return null;

  const baseShareTitle =
    locale === "en"
      ? emakiDisplayTitle(data, locale)
      : `${title ?? ""}`.trim();

  const folkloreChrome = (
    <FolkloreDetailSheet
      item={folkloreItem}
      open={Boolean(folkloreItem)}
      onClose={() => setFolkloreItem(null)}
      onActivity={onIdleActivity}
    />
  );

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
        {folkloreChrome}
      </div>
    );
  }

  const chapterTitle = isByobuSpotMode
    ? activeByobuSpot && spotDisplay?.spotTitle
      ? spotDisplay.spotTitle
      : locale === "en"
        ? `Highlights Guide (${allSpots.length} Spots)`
        : `見どころガイド（全${allSpots.length}箇所）`
    : locale === "en"
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
        : activeMode === "tansaku" || activeMode === "sou"
          ? stripHtml(tansakuData?.summary || "")
          : chapterTexts.kobun;
  const hasBody = isByobuSpotMode
    ? activeByobuSpot
      ? Boolean(spotDisplay?.spotBody)
      : true
    : activeMode === "tansaku" || activeMode === "sou"
      ? Boolean(
          tansakuData &&
            (tansakuData.prompt ||
              (Array.isArray(tansakuData.motifs) &&
                tansakuData.motifs.length > 0) ||
              tansakuData.motif ||
              tansakuData.summary)
        )
      : plainBody.length > 0;
  const splitAt =
    locale === "en" ? plainBody.search(/\.\s/) : plainBody.indexOf("。");
  const hasRest = hasBody && splitAt >= 0 && splitAt < plainBody.length - 1;
  const previewText = hasRest ? plainBody.slice(0, splitAt + 1) : plainBody;
  // 1モードでもタブを出す（EN で Classical 欠落時も Commentary ラベルを残す）
  const showModeTabs = !isByobuSpotMode && availableModes.length >= 1;

  const accent = eraColor(era) || "#8a6d3b";
  const readMoreLabel = locale === "en" ? "More ▾" : "もっと見る";
  const readLessLabel = locale === "en" ? "Close ▴" : "閉じる ▴";

  const toggleExpanded = () => {
    const next = !expanded;
    if (next) {
      gtag.event("scene_modal_open", {
        emaki_title: title,
        emaki_id: titleen,
        scene_index: isByobuSpotMode
          ? activeByobuSpotEntry?.linkId ?? navIndex
          : current.linkId,
        scene_chapter: isByobuSpotMode
          ? activeByobuSpot?.name
          : current.chapter,
        text_mode: isByobuSpotMode ? "spot" : activeMode,
      });
    }
    setExpanded(next);
  };

  const handleTextMode = (mode) => {
    if (
      mode === activeMode &&
      contentTab === "scene" &&
      !isFolkloreOpen &&
      viewMode === "commentary"
    ) {
      return;
    }
    setContentTab("scene");
    setIsFolkloreOpen(false);
    setViewMode("commentary");
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
    setIsFolkloreOpen(false);
  };

  const handleNavigateSpot = (spotIdx) => {
    const entry = allSpots[spotIdx];
    if (!entry?.spot) return;
    onSelectSpot?.(entry.spot);
    setViewMode("commentary");
    setIsFolkloreOpen(false);
  };

  const handleFolkloreSelect = (item) => {
    if (!item) return;
    const target = resolveEbikiScrollTarget(emakis, item);
    if (!target || typeof handleToId !== "function") {
      console.warn("[Ebiki] handleToId または targetLinkId が無効です:", {
        target,
        hasHandleToId: typeof handleToId === "function",
        link_id: item.link_id,
        scene_id: item.scene_id,
      });
      return;
    }
    // 1. 目的の民具へ即時スクロール
    handleToId(target.linkId, {
      realign: false,
      offsetPercent: target.offsetPercent,
      behavior: "smooth",
    });
    // 2. 画面中央にスポットライト
    triggerEbikiSpotlight(target.linkId, target.offsetPercent);
    // 3. 右上に詳細シートを即時表示（中央視界を塞がない）
    setFolkloreItem(item);
  };

  const hasMultipleSections = isByobuSpotMode
    ? allSpots.length > 1
    : filterEkotobas.length > 1;
  const chapterFolkloreItems =
    hasFolklore && current?.chapter
      ? getItemsForChapter(current.chapter)
      : [];
  const folkloreCount = chapterFolkloreItems.length;
  // トグル開かつ再生モード外のみリスト表示（デフォルトは非表示で鑑賞優先）
  const showFolkloreList = isFolkloreOpen && !isPlayMode && folkloreCount > 0;
  const sceneThumbSrc =
    current?.chapter && chapterThumbMap.has(current.chapter)
      ? buildCloudinaryUrl(chapterThumbMap.get(current.chapter), [
          "w_160",
          "f_auto",
          "q_auto:good",
        ])
      : null;
  const folkloreToggleLabel =
    folkloreCount > 0
      ? t("viewer.folkloreToggleCount", {
        count: folkloreCount,
        defaultValue:
          locale === "en"
            ? `Folklore tags (${folkloreCount})`
            : `絵引（${folkloreCount}件）`,
      })
      : t("viewer.folkloreToggle", {
        defaultValue:
          locale === "en"
            ? "Folklore tags (daily life & tools)"
            : "絵引（生活誌・民具）",
      });

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
            {/* 帖ガイド / 九相図一覧: 段タイトルのすぐ右隣に小さなピルリンクを置く */}
            {isGenji && current?.genji_chapter ? (
              <GenjiHubLink
                genjieslug={
                  connectGenjiChapters(current.genji_chapter, "path") ||
                  undefined
                }
                variant="icon"
                linkClassName={styles.genjiGuidePill}
              />
            ) : null}
            {isKusouzu ? (
              <KusouzuHubLink
                variant="icon"
                linkClassName={styles.genjiGuidePill}
              />
            ) : null}
            <div
              className={styles.titleActions}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {!(isByobuSpotMode && !activeByobuSpot) ? (
                <SceneLikeButton
                  titleen={titleen}
                  title={title}
                  chapter={
                    isByobuSpotMode
                      ? activeByobuSpot?.name
                      : current?.chapter
                  }
                  index={
                    isByobuSpotMode
                      ? 10000 + (activeByobuSpotEntry?.spotGlobalIndex ?? 0)
                      : current?.linkId
                  }
                  variant="bar"
                />
              ) : null}
              {(() => {
                let currentShareTitle = baseShareTitle;
                if (isByobuSpotMode && spotDisplay?.spotTitle) {
                  currentShareTitle = spotDisplay.spotTitle;
                } else if (
                  (activeMode === "tansaku" || activeMode === "sou") &&
                  tansakuData
                ) {
                  const activeMotif = getMotifDefinition(selectedMotifId);
                  let prompt = null;

                  const isEn = router.locale === "en";
                  if (isEn && souData?.promptsEn && selectedMotifId && souData.promptsEn[selectedMotifId]) {
                    prompt = String(souData.promptsEn[selectedMotifId]).replace(/[\s\.…・]+$/, "");
                  } else if (!isEn && souData?.prompts && selectedMotifId && souData.prompts[selectedMotifId]) {
                    prompt = String(souData.prompts[selectedMotifId]).replace(/[\s\.…・]+$/, "");
                  } else if (activeMotif) {
                    const motifPrompt = isEn ? (activeMotif.promptEn || activeMotif.prompt) : activeMotif.prompt;
                    if (motifPrompt) {
                      prompt = String(motifPrompt).replace(/[\s\.…・]+$/, "");
                    }
                  } else if (souData) {
                    const scenePrompt = isEn ? (souData.promptEn || souData.prompt) : souData.prompt;
                    if (scenePrompt) {
                      prompt = String(scenePrompt).replace(/[\s\.…・]+$/, "");
                    }
                  } else if (activeMotif) {
                    const label = isEn ? (activeMotif.labelEn || activeMotif.label) : activeMotif.label;
                    if (label) {
                      prompt = isEn
                        ? `What was the artist's intent behind the depiction of "${label}"?`
                        : `「${label}」の描写から読み解く、絵師の意図とは？`;
                    }
                  }

                  const tag = activeMotif?.label ? `#${activeMotif.label}` : "";
                  const sceneName = current?.title ? `【${current.title}】` : "";

                  if (prompt) {
                    currentShareTitle = `💡 ${prompt}${tag ? ` ── ${tag}` : ""}\n${sceneName} ${baseShareTitle}`.trim();
                  } else if (tag) {
                    currentShareTitle = `${tag}\n${sceneName} ${baseShareTitle}`.trim();
                  }
                }

                return (
                  <ShareButtons
                    variant="share"
                    navIndex={
                      isByobuSpotMode
                        ? activeByobuSpotEntry?.linkId ?? navIndex
                        : navIndex
                    }
                    emakiId={titleen}
                    openPolaroidModal={openPolaroidModal}
                    shareTitle={currentShareTitle}
                    spotId={
                      isByobuSpotMode && activeByobuSpot?.id
                        ? String(activeByobuSpot.id)
                        : undefined
                    }
                  />
                );
              })()}
            </div>
          </div>
          {viewMode === "index" ? (
            isByobuSpotMode ? (
              <CommentarySectionIndex
                activeIndex={spotActiveIndex}
                indexRows={spotIndexRows}
                onNavigate={handleNavigateSpot}
                t={t}
              />
            ) : (
              <CommentarySectionIndex
                activeIndex={activeIndex}
                indexRows={indexRows}
                onNavigate={handleNavigate}
                t={t}
              />
            )
          ) : showFolkloreList ? (
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
                      aria-selected={false}
                      className={styles.modeTab}
                      onClick={() => handleTextMode(mode)}
                    >
                      {t(`viewer.textMode.${mode}`)}
                    </button>
                  ))}
                </div>
              )}
              <FolkloreSceneList
                items={chapterFolkloreItems}
                sceneThumb={sceneThumbSrc}
                onSelect={handleFolkloreSelect}
                onActivity={onIdleActivity}
                ariaLabel={folkloreToggleLabel}
              />
            </>
          ) : (
            <>
              {isByobuSpotMode && activeByobuSpot ? (
                spotDisplay?.categoryLabel ? (
                  <p
                    style={{
                      margin: "4px 0 0",
                      padding: "0 14px",
                      color: "#6b7280",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {spotDisplay.categoryLabel}
                  </p>
                ) : null
              ) : showModeTabs ? (
                <div
                  className={styles.modeTabs}
                  role="tablist"
                  aria-label={t("viewer.textMode.label")}
                  onClick={(e) => e.stopPropagation()}
                >
                  {availableModes.map((mode) => (
                    <span key={mode} style={{ display: "contents" }}>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={
                          contentTab === "scene" && mode === activeMode
                        }
                        className={`${styles.modeTab} ${contentTab === "scene" && mode === activeMode
                          ? styles.modeTabActive
                          : ""
                          }`}
                        onClick={() => handleTextMode(mode)}
                      >
                        {mode === "tansaku" || mode === "sou"
                          ? locale === "en"
                            ? "Explore"
                            : "探索"
                          : t(`viewer.textMode.${mode}`)}
                      </button>
                      {mode === "desc" &&
                      !isByobuSpotMode &&
                      selectedSpot &&
                      spotDisplay ? (
                        <span
                          className={`${styles.modeTab} ${contentTab === "spot" ? styles.modeTabActive : ""
                            }`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                            paddingRight: 4,
                          }}
                        >
                          <button
                            type="button"
                            role="tab"
                            aria-selected={contentTab === "spot"}
                            className={styles.modeTab}
                            style={{
                              border: "none",
                              background: "transparent",
                              padding: 0,
                              boxShadow: "none",
                            }}
                            onClick={() => {
                              setIsFolkloreOpen(false);
                              setViewMode("commentary");
                              setContentTab("spot");
                            }}
                          >
                            {spotDisplay.spotTitle}
                          </button>
                          <button
                            type="button"
                            aria-label={
                              locale === "en"
                                ? "Clear spot selection"
                                : "スポット選択を解除"
                            }
                            title={
                              locale === "en"
                                ? "Clear spot selection"
                                : "スポット選択を解除"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              onClearSelectedSpot?.();
                            }}
                            style={{
                              padding: "0 4px",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              lineHeight: 1,
                              opacity: 0.75,
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : null}
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
                  className={`${styles.bodyText} ${activeMode === "kobun" && contentTab === "scene"
                    ? styles.bodyTextClassical
                    : ""
                    }`}
                >
                  {isByobuSpotMode && !activeByobuSpot ? (
                    <>
                      <span>
                        {locale === "en"
                          ? "Click spot badges on the scroll to zoom in and read commentary. You can also tour them in order from the right section."
                          : "画面上のスポットバッジをクリックすると拡大と解説が見られます。右隻から順番に巡ることもできます。"}
                      </span>
                      {allSpots[0]?.spot ? (
                        <button
                          type="button"
                          style={{
                            ...BYOBU_TEXT_LINK,
                            marginTop: 10,
                            display: "inline-block",
                            textAlign: "left",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSpot?.(allSpots[0].spot);
                          }}
                        >
                          {locale === "en"
                            ? `View the first highlight “${allSpots[0].spot.nameen || allSpots[0].spot.name}” →`
                            : `最初の見どころ「${allSpots[0].spot.name}」を見る →`}
                        </button>
                      ) : null}
                    </>
                  ) : (isByobuSpotMode ||
                      (contentTab === "spot" && selectedSpot)) &&
                    spotDisplay ? (
                    <>
                      {spotDisplay.spotBody ? (
                        <span>
                          {expanded
                            ? spotDisplay.spotBody
                            : spotDisplay.spotBody.length > 120
                              ? `${spotDisplay.spotBody.slice(0, 120)}…`
                              : spotDisplay.spotBody}
                        </span>
                      ) : null}
                      {rakuchuSpotMaster ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: 6,
                            marginTop: 10,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {spotDisplay.otherScrolls.map((otherTitleen) => {
                            const editionIdx = SCROLL_EDITIONS.findIndex(
                              (e) => e.titleen === otherTitleen
                            );
                            const shortJa =
                              editionIdx >= 0
                                ? SCROLL_PILL_LABELS.ja[editionIdx]
                                : otherTitleen;
                            const shortEn =
                              editionIdx >= 0
                                ? SCROLL_PILL_LABELS.en[editionIdx]
                                : otherTitleen;
                            const label =
                              locale === "en"
                                ? `View in another scroll: ${shortEn} ↗`
                                : `他伝本で見る: ${shortJa} ↗`;
                            return (
                              <Link
                                key={otherTitleen}
                                href={`/${otherTitleen}?spot=${encodeURIComponent(
                                  spotDisplay.targetSpotId
                                )}`}
                              >
                                <a
                                  style={BYOBU_TEXT_LINK}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {label}
                                </a>
                              </Link>
                            );
                          })}
                          <Link
                            href={`/rakuchu-rakugai/chapters?motif=${encodeURIComponent(
                              rakuchuSpotMaster.masterId
                            )}#motifs`}
                          >
                            <a
                              style={BYOBU_TEXT_LINK}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {locale === "en"
                                ? "Compare three scrolls via motif hub ↗"
                                : "主要モチーフ比較で3伝本を見比べる ↗"}
                            </a>
                          </Link>
                        </div>
                      ) : null}
                    </>
                  ) : !isByobuSpotMode &&
                    (activeMode === "tansaku" || activeMode === "sou") &&
                    tansakuData ? (
                    (() => {
                      const activeMotif = getMotifDefinition(selectedMotifId);

                      return (
                        <CommentaryExploreView
                          activeMotif={activeMotif}
                          currentEmakiSlug={titleen}
                          onNavigateSameEmaki={(chapter) => {
                            const targetIdx = filterEkotobas.findIndex(
                              (item) =>
                                String(item.chapter) === String(chapter)
                            );
                            if (targetIdx !== -1) {
                              handleNavigate(targetIdx);
                            }
                          }}
                          onSelectMotif={setSelectedMotifId}
                          relatedScenes={relatedScenes}
                          selectedMotifId={selectedMotifId}
                          souData={souData}
                        />
                      );
                    })()
                  ) : !isByobuSpotMode ? (
                    <CommentaryTextView
                      activeMode={activeMode}
                      chapterTexts={chapterTexts}
                      expanded={expanded}
                      locale={locale}
                      readMoreLabel={readMoreLabel}
                    />
                  ) : null}
                </span>
              </button>
            </>
          )}
          {/* ユーティリティはバー下部（タイトル圧迫を避ける） */}
          <div className={styles.utilityActions}>
            {quizFab}
            {isByobuSpotMode && activeByobuSpot && allSpots.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginRight: "auto",
                  flexWrap: "wrap",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#6b7280",
                  }}
                >
                  {`${spotActiveIndex + 1} / ${allSpots.length}`}
                </span>
                <button
                  type="button"
                  style={{
                    ...BYOBU_TEXT_LINK,
                    opacity: spotActiveIndex <= 0 ? 0.4 : 1,
                  }}
                  disabled={spotActiveIndex <= 0}
                  onClick={() => handleNavigateSpot(spotActiveIndex - 1)}
                >
                  {locale === "en" ? "← Prev" : "← 前へ"}
                </button>
                <button
                  type="button"
                  style={{
                    ...BYOBU_TEXT_LINK,
                    opacity:
                      spotActiveIndex >= allSpots.length - 1 ? 0.4 : 1,
                  }}
                  disabled={spotActiveIndex >= allSpots.length - 1}
                  onClick={() => handleNavigateSpot(spotActiveIndex + 1)}
                >
                  {locale === "en" ? "Next →" : "次へ →"}
                </button>
              </div>
            ) : null}
            <div className={styles.utilityActionsEnd}>
              <FolkloreToggleButton
                count={folkloreCount}
                open={isFolkloreOpen}
                disabled={isPlayMode}
                label={folkloreToggleLabel}
                onToggle={() => {
                  onIdleActivity?.();
                  setIsFolkloreOpen((v) => {
                    const next = !v;
                    if (next) setViewMode("commentary");
                    return next;
                  });
                }}
              />
              {hasMultipleSections && (
                <button
                  type="button"
                  className={`${styles.listBtn} ${viewMode === "index" ? styles.listBtnActive : ""
                    }`}
                  onClick={() => {
                    setIsFolkloreOpen(false);
                    setViewMode((v) => (v === "index" ? "commentary" : "index"));
                  }}
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
                  if (isByobuSpotMode && activeByobuSpot) {
                    onClearSelectedSpot?.();
                  } else {
                    setClosed(true);
                  }
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
      {folkloreChrome}
    </div>
  );
};

export default SceneCommentaryBar;
