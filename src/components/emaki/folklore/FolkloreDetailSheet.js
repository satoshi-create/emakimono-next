/**
 * 絵引詳細シート（画面右上フローティング・スリム版）。
 * 暗幕なし・pointer-events 分離で絵巻鑑賞を妨げない。
 * 鑑賞中は要点のみ表示し、論考・DB詳細は絵引ポータルへ誘導する。
 * ヘッダー左クリックドラッグで .entry-container 内を移動可能（解説バーと同方式）。
 */
import styles from "@/styles/FolkloreDetailSheet.module.css";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const SCROLL_THUMB_FALLBACK = {
  naomoto_moushibumi_ekotoba: "/thumb/naomoto_moushibumi_ekotoba_thumb.webp",
  "eshi-no-soshi_tohaku": "/thumb/eshi-no-soshi_tohaku_thumb.webp",
  gakisoushi_kawamoto: "/thumb/gakisoushi_kawamoto_thumb.webp",
  "Chōjū-jinbutsu-giga_first": "/thumb/cyoujyuu_yamazaki_kou_thumb.webp",
  "Chōjū-jinbutsu-giga_third": "/thumb/cyoujyuu_yamazaki_hei_thumb.webp",
  "Chōjū-jinbutsu-giga_fourth": "/thumb/cyoujyuu_yamazaki_tei_thumb.webp",
};

const FolkloreDetailSheet = ({ item, open, onClose, onActivity }) => {
  const fallback =
    SCROLL_THUMB_FALLBACK[item?.titleen] ||
    "/thumb/naomoto_moushibumi_ekotoba_thumb.webp";
  const [thumbSrc, setThumbSrc] = useState(fallback);

  const sheetRef = useRef(null);
  const [sheetPos, setSheetPos] = useState(null);
  const sheetPosRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragAnchorRef = useRef(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    setThumbSrc(fallback);
    const crop = item?.crop_thumb;
    if (!crop || crop === fallback) return undefined;
    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (!cancelled) setThumbSrc(crop);
    };
    probe.src = crop;
    return () => {
      cancelled = true;
    };
  }, [item?.item_id, item?.crop_thumb, fallback]);

  useEffect(() => {
    if (!open) return undefined;
    onActivity?.();
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, onActivity]);

  // 絵巻コンテナ内へ Portal（viewport fixed だと通常画面で白帯へはみ出す）
  const [mountNode, setMountNode] = useState(null);
  useEffect(() => {
    if (!open || typeof document === "undefined") {
      setMountNode(null);
      return undefined;
    }
    setMountNode(document.querySelector(".entry-container"));
    return undefined;
  }, [open]);

  // 閉じる／アイテム切替で既定位置へ戻す
  useEffect(() => {
    sheetPosRef.current = null;
    setSheetPos(null);
    setIsDragging(false);
    dragAnchorRef.current = null;
  }, [open, item?.item_id]);

  const clampSheetDelta = (dx, dy, anchor) => {
    const c = mountNode;
    if (!c || !anchor) return { x: dx, y: dy };
    const maxX = c.clientWidth - anchor.w - anchor.defLeft;
    const maxY = c.clientHeight - anchor.h - anchor.defTop;
    return {
      x: Math.min(Math.max(dx, -anchor.defLeft), maxX),
      y: Math.min(Math.max(dy, -anchor.defTop), maxY),
    };
  };

  const onSheetPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // 閉じるボタン上ではドラッグ開始しない
    if (e.target.closest(`.${styles.closeBtn}, a, button`)) return;
    const sheet = sheetRef.current;
    const c = mountNode;
    if (!sheet || !c) return;
    const sheetRect = sheet.getBoundingClientRect();
    const cRect = c.getBoundingClientRect();
    const base = sheetPosRef.current;
    const baseDx = base ? base.x : 0;
    const baseDy = base ? base.y : 0;
    dragAnchorRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseDx,
      baseDy,
      defLeft: sheetRect.left - cRect.left - baseDx,
      defTop: sheetRect.top - cRect.top - baseDy,
      w: sheetRect.width,
      h: sheetRect.height,
      moved: false,
    };
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      /* capture 不可環境では move/up が外れても矩形クランプで復帰する */
    }
  };

  const onSheetPointerMove = (e) => {
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
      setIsDragging(true);
    }
    if (e.cancelable) e.preventDefault();
    const p = clampSheetDelta(dx, dy, a);
    sheetPosRef.current = p;
    setSheetPos(p);
    onActivity?.();
  };

  const endSheetDrag = (e, { suppressClick }) => {
    const a = dragAnchorRef.current;
    if (!a || a.pointerId !== e.pointerId) return;
    e.stopPropagation();
    if (a.moved && suppressClick) {
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch (err) {
      /* noop */
    }
    dragAnchorRef.current = null;
    setIsDragging(false);
  };

  const onSheetPointerUp = (e) => endSheetDrag(e, { suppressClick: true });
  const onSheetPointerCancel = (e) =>
    endSheetDrag(e, { suppressClick: false });

  const onSheetClickCapture = (e) => {
    if (!suppressClickRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClickRef.current = false;
  };

  const onSheetDoubleClick = (e) => {
    if (e.target.closest(`.${styles.closeBtn}, a, button`)) return;
    e.stopPropagation();
    sheetPosRef.current = null;
    setSheetPos(null);
  };

  if (!open || !item || !mountNode) return null;

  const bump = () => onActivity?.();
  const portalHref = item.item_id
    ? `/ebiki?item=${encodeURIComponent(item.item_id)}`
    : "/ebiki";

  return createPortal(
    <div
      className={styles.root}
      role="presentation"
      onMouseEnter={bump}
      onTouchStart={bump}
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="閉じる"
        onClick={onClose}
      />
      <aside
        ref={sheetRef}
        className={`${styles.sheet} ${isDragging ? styles.dragging : ""}`}
        role="dialog"
        aria-modal="false"
        aria-labelledby="folklore-sheet-title"
        style={
          sheetPos
            ? { transform: `translate3d(${sheetPos.x}px, ${sheetPos.y}px, 0)` }
            : undefined
        }
        onMouseEnter={bump}
        onTouchStart={bump}
        onWheel={(e) => e.stopPropagation()}
        onDoubleClick={onSheetDoubleClick}
      >
        <header
          className={styles.header}
          onPointerDown={onSheetPointerDown}
          onPointerMove={onSheetPointerMove}
          onPointerUp={onSheetPointerUp}
          onPointerCancel={onSheetPointerCancel}
          onClickCapture={onSheetClickCapture}
        >
          <div className={styles.titleBlock}>
            <h2 id="folklore-sheet-title" className={styles.title}>
              {item.name}
            </h2>
            {item.reading ? (
              <p className={styles.reading}>{item.reading}</p>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="閉じる"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div
          className={styles.sheetContent}
          onWheel={(e) => e.stopPropagation()}
        >
          {thumbSrc ? (
            <div className={styles.cropWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbSrc}
                alt=""
                className={styles.compactThumb}
                loading="lazy"
                onError={() => {
                  if (thumbSrc !== fallback) setThumbSrc(fallback);
                }}
              />
            </div>
          ) : null}

          <div className={styles.meta}>
            {item.act_label && item.act_category ? (
              <Link href={`/ebiki?category=${encodeURIComponent(item.act_category)}`}>
                <a className={styles.tagLink} onClick={onClose}>
                  {item.act_label}
                </a>
              </Link>
            ) : item.act_label ? (
              <span className={styles.tag}>{item.act_label}</span>
            ) : null}
            {item.era ? <span className={styles.tagMuted}>{item.era}</span> : null}
          </div>

          {item.summary ? (
            <section className={styles.summarySection}>
              <h3 className={styles.sectionTitle}>概要</h3>
              <p className={styles.summaryText}>{item.summary}</p>
            </section>
          ) : null}

          <div className={styles.footerLink}>
            <Link href={portalHref}>
              <a className={styles.hubLink} onClick={onClose}>
                絵引ポータルで詳細・論考を見る →
              </a>
            </Link>
          </div>
        </div>
      </aside>
    </div>,
    mountNode
  );
};

export default FolkloreDetailSheet;
