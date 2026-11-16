/**
 * コメントバー共通枠: 開閉・展開・一覧モード、フローティングカード DnD、CSS 変数同期。
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "@/styles/SceneCommentaryBar.module.css";

const SAFE_SHEET_BOTTOM = "460px";

// 1. フローティングカードのドラッグ位置をコンテナ内にクランプする
const clampCardDelta = (dx, dy, anchor) => {
  const c = anchor.containerEl;
  if (!c || !anchor) return { x: dx, y: dy };
  const maxX = c.clientWidth - anchor.w - anchor.defLeft;
  const maxY = c.clientHeight - anchor.h - anchor.defTop;
  return {
    x: Math.min(Math.max(dx, -anchor.defLeft), maxX),
    y: Math.min(Math.max(dy, -anchor.defTop), maxY),
  };
};

/**
 * @param {object} opts
 * @param {boolean} opts.isFullscreen
 * @param {boolean} opts.commentaryFloating
 * @param {import('react').RefObject} opts.entryContainerRef
 * @param {string} opts.orientation
 * @param {(open: boolean) => void} [opts.setIsFolkloreOpen]
 * @param {boolean} [opts.isFolkloreOpen]
 * @param {string} [opts.workKey] 作品識別（titleen 等）— 遷移ごとの小画面初期クローズ用
 */
const COMPACT_VIEWPORT_MQ = "(max-width: 768px), (max-height: 800px)";

export function isCompactViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(COMPACT_VIEWPORT_MQ).matches;
}

export function useCommentaryBarShell({
  isFullscreen,
  commentaryFloating,
  entryContainerRef,
  orientation,
  setIsFolkloreOpen,
  isFolkloreOpen = false,
  workKey = "",
}) {
  // 2. バー開閉・展開・段/スポット目次モード
  const [expanded, setExpanded] = useState(false);
  const [closed, setClosed] = useState(false);
  const initializedCompactKeyRef = useRef(null);
  const [viewMode, setViewMode] = useState("commentary");

  const wrapRef = useRef(null);
  const barRef = useRef(null);
  const prevOrientationRef = useRef(orientation);

  // 2b. 作品遷移時は常にバー表示（同一作品内でユーザーが閉じた状態は維持）
  useEffect(() => {
    const key = `${workKey ?? ""}`.trim();
    if (!key || typeof window === "undefined") return;
    if (initializedCompactKeyRef.current === key) return;
    initializedCompactKeyRef.current = key;
    setClosed(false);
  }, [workKey]);

  // 3. スマホ向き変更時の自動開閉（PC は触らない）
  useEffect(() => {
    if (prevOrientationRef.current === orientation) return;
    prevOrientationRef.current = orientation;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    if (orientation === "landscape") {
      setClosed(true);
      setExpanded(false);
      setViewMode("commentary");
      setIsFolkloreOpen?.(false);
    } else if (orientation === "portrait") {
      setClosed(false);
    }
  }, [orientation, setIsFolkloreOpen]);

  // 4. フローティングカード DnD
  const cardFloats = isFullscreen || commentaryFloating;
  const [cardPos, setCardPos] = useState(null);
  const cardPosRef = useRef(null);
  const [isCardDragging, setIsCardDragging] = useState(false);
  const dragAnchorRef = useRef(null);
  const suppressCardClickRef = useRef(false);

  const onCardPointerDown = (e) => {
    if (!cardFloats) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
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
      defLeft: wrapRect.left - cRect.left - baseDx,
      defTop: wrapRect.top - cRect.top - baseDy,
      w: wrapRect.width,
      h: wrapRect.height,
      moved: false,
      containerEl: c,
    };
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      /* capture 不可環境 */
    }
  };

  const onCardPointerMove = (e) => {
    const a = dragAnchorRef.current;
    if (!a || a.pointerId !== e.pointerId) return;
    e.stopPropagation();
    const dx = a.baseDx + (e.clientX - a.startX);
    const dy = a.baseDy + (e.clientY - a.startY);
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

  // 5. 目次・絵引リスト表示中の Esc で解説へ戻す
  useEffect(() => {
    if (viewMode !== "index" && !isFolkloreOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setViewMode("commentary");
        setIsFolkloreOpen?.(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, isFolkloreOpen, setIsFolkloreOpen]);

  return {
    expanded,
    setExpanded,
    closed,
    setClosed,
    viewMode,
    setViewMode,
    wrapRef,
    barRef,
    cardFloats,
    cardPos,
    isCardDragging,
    onCardPointerDown,
    onCardPointerMove,
    onCardPointerUp,
    onCardPointerCancel,
    onCardClickCapture,
    onCardDoubleClick,
  };
}

/**
 * 6. バー高さ・Folklore シート下端の CSS 変数同期（ペイント前更新）
 */
export function useCommentaryBarMetrics({
  barRef,
  wrapRef,
  entryContainerRef,
  expanded,
  closed,
  textMode,
  contentTab,
  isFolkloreOpen,
  viewMode,
  cardPos,
  selectedSpot,
}) {
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
      const chrome = wrapRef.current ?? el;
      const top = chrome.getBoundingClientRect().top;
      const cBottom = c.getBoundingClientRect().bottom;
      c.style.setProperty(
        "--folklore-sheet-bottom",
        `${Math.max(0, Math.round(cBottom - top + GAP))}px`
      );
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
    barRef,
    wrapRef,
    entryContainerRef,
    expanded,
    closed,
    textMode,
    contentTab,
    isFolkloreOpen,
    viewMode,
    cardPos,
    selectedSpot,
  ]);
}