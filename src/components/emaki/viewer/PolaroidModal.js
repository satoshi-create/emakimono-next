import { useCallback, useEffect, useRef, useState } from "react";
import styles from "@/styles/PolaroidModal.module.css";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";

const CANVAS_W = 800;
const CANVAS_H = 1000;
const PHOTO_DX = 40;
const PHOTO_DY = 40;
const PHOTO_DW = 720;
const PHOTO_DH = 560;
const MESSAGE_MAX = 40;
const SEAL_COLOR = "#c0392b";
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_DEFAULT = 1.5;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function coverScaleFor(img) {
  return Math.max(PHOTO_DW / img.naturalWidth, PHOTO_DH / img.naturalHeight);
}

function maxPanForAxis(natural, photoDim, coverScale, zoom) {
  return Math.max(0, (natural * coverScale * zoom - photoDim) / 2);
}

function loadCrossOriginImage(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function PolaroidModal({ isOpen, onClose, scenes = [], initialIndex = 0, emakiTitle }) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [message, setMessage] = useState("");
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [maxPan, setMaxPan] = useState({ x: 0, y: 0 });
  const [coverScale, setCoverScale] = useState(1);
  const [imgSize, setImgSize] = useState(null);
  const [panoramaSlots, setPanoramaSlots] = useState({ prev: null, current: null, next: null });
  const [frameW, setFrameW] = useState(PHOTO_DW);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, pan: { x: 0, y: 0 } });
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const canvasRef = useRef(null);
  const loadedImagesRef = useRef({ prev: null, current: null, next: null });
  const loadIdRef = useRef(0);
  const frameRef = useRef(null);

  function pointerDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  useEffect(() => {
    if (isOpen) setSelectedIndex(initialIndex);
  }, [isOpen, initialIndex]);

  const currentScene = scenes[selectedIndex] || scenes[0];
  const rawSrc = currentScene?.src ?? "";
  const src = rawSrc ? buildCloudinaryUrl(rawSrc) : "";

  const updatePanLimits = useCallback((img, z, prevImg, nextImg) => {
    if (!img?.naturalWidth) {
      setCoverScale(1);
      setMaxPan({ x: 0, y: 0 });
      return;
    }
    const cs = coverScaleFor(img);
    setCoverScale(cs);
    const baseX = maxPanForAxis(img.naturalWidth, PHOTO_DW, cs, z);
    const prevW = prevImg?.naturalWidth ? prevImg.naturalWidth * cs * z : 0;
    const nextW = nextImg?.naturalWidth ? nextImg.naturalWidth * cs * z : 0;
    setMaxPan({
      x: baseX + (prevW + nextW) / 2,
      y: maxPanForAxis(img.naturalHeight, PHOTO_DH, cs, z),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setMessage("");
      setZoom(ZOOM_DEFAULT);
      setPan({ x: 0, y: 0 });
      setMaxPan({ x: 0, y: 0 });
      setCoverScale(1);
      setImgSize(null);
      loadedImagesRef.current = { prev: null, current: null, next: null };
      setPanoramaSlots({ prev: null, current: null, next: null });
      return;
    }

    const isPanoramaSlice = (item) => Boolean(item?.src) && item?.cat !== "ekotoba";

    const findPanoramaIndex = (startIdx, step) => {
      for (let i = startIdx; i >= 0 && i < scenes.length; i += step) {
        if (isPanoramaSlice(scenes[i])) return i;
      }
      return null;
    };

    let curIdx = selectedIndex;
    if (!isPanoramaSlice(scenes[curIdx])) {
      curIdx = findPanoramaIndex(curIdx, -1) ?? findPanoramaIndex(curIdx, 1);
    }

    if (curIdx == null) return;

    const prevIdx = findPanoramaIndex(curIdx - 1, -1);
    const nextIdx = findPanoramaIndex(curIdx + 1, 1);

    const curUrl = scenes[curIdx]?.src ? buildCloudinaryUrl(scenes[curIdx].src) : null;
    const prevUrl =
      prevIdx != null && scenes[prevIdx]?.src ? buildCloudinaryUrl(scenes[prevIdx].src) : null;
    const nextUrl =
      nextIdx != null && scenes[nextIdx]?.src ? buildCloudinaryUrl(scenes[nextIdx].src) : null;
    if (!curUrl) return;

    const loadId = ++loadIdRef.current;
    Promise.all([
      loadCrossOriginImage(prevUrl),
      loadCrossOriginImage(curUrl),
      loadCrossOriginImage(nextUrl),
    ]).then(([prev, current, next]) => {
      if (loadId !== loadIdRef.current) return;
      loadedImagesRef.current = { prev, current, next };
      setPanoramaSlots({ prev, current, next });
      if (current?.naturalWidth) {
        setImgSize({ w: current.naturalWidth, h: current.naturalHeight });
        updatePanLimits(current, ZOOM_DEFAULT, prev, next);
      } else {
        setImgSize(null);
        setMaxPan({ x: 0, y: 0 });
      }
      setPan({ x: 0, y: 0 });
      setZoom(ZOOM_DEFAULT);
    });
  }, [isOpen, selectedIndex, scenes, updatePanLimits]);

  useEffect(() => {
    if (!isOpen || !frameRef.current) return;
    const el = frameRef.current;
    const measure = () => setFrameW(el.clientWidth || PHOTO_DW);
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !frameRef.current) return;
    const el = frameRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      setZoom((z) => clamp(z - e.deltaY * 0.002, ZOOM_MIN, ZOOM_MAX));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isOpen]);

  useEffect(() => {
    const { prev, current, next } = loadedImagesRef.current;
    if (current?.naturalWidth) updatePanLimits(current, zoom, prev, next);
  }, [zoom, updatePanLimits]);

  useEffect(() => {
    setPan((prev) => ({
      x: clamp(prev.x, -maxPan.x, maxPan.x),
      y: clamp(prev.y, -maxPan.y, maxPan.y),
    }));
  }, [maxPan.x, maxPan.y]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const handlePointerDown = (e) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const pts = pointersRef.current;
    if (pts.size === 2) {
      setDragging(false);
      const [a, b] = [...pts.values()];
      pinchRef.current = { d0: pointerDistance(a, b), zoom0: zoom };
    } else if (pts.size === 1 && (maxPan.x > 0 || maxPan.y > 0)) {
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, pan: { ...pan } };
    }
  };

  const handlePointerMove = (e) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = pointersRef.current;
    if (pts.size === 2 && pinchRef.current) {
      const [a, b] = [...pts.values()];
      const d = pointerDistance(a, b);
      const { d0, zoom0 } = pinchRef.current;
      if (d0 > 0) setZoom(clamp(zoom0 * (d / d0), ZOOM_MIN, ZOOM_MAX));
      return;
    }
    if (!dragging || pts.size !== 1) return;
    const r = frameW / PHOTO_DW;
    if (r <= 0) return;
    const deltaX = (e.clientX - dragStart.current.x) / r;
    const deltaY = (e.clientY - dragStart.current.y) / r;
    setPan({
      x: clamp(dragStart.current.pan.x + deltaX, -maxPan.x, maxPan.x),
      y: clamp(dragStart.current.pan.y + deltaY, -maxPan.y, maxPan.y),
    });
  };

  const handlePointerUp = (e) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) setDragging(false);
  };

  const drawPhoto = useCallback(
    (ctx) => {
      const { prev, current: img, next } = loadedImagesRef.current;
      if (!img?.naturalWidth) return;
      const cs = coverScale;
      const z = zoom;
      const curW = img.naturalWidth * cs * z;
      const curH = img.naturalHeight * cs * z;
      const cx = PHOTO_DX + PHOTO_DW / 2 + pan.x;
      const cy = PHOTO_DY + PHOTO_DH / 2 + pan.y;
      const curX = cx - curW / 2;
      const curY = cy - curH / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(PHOTO_DX, PHOTO_DY, PHOTO_DW, PHOTO_DH);
      ctx.clip();

      ctx.drawImage(img, curX, curY, curW, curH);
      if (next?.naturalWidth) {
        const nw = next.naturalWidth * cs * z;
        const nh = next.naturalHeight * cs * z;
        ctx.drawImage(next, curX - nw, cy - nh / 2, nw, nh);
      }
      if (prev?.naturalWidth) {
        const pw = prev.naturalWidth * cs * z;
        const ph = prev.naturalHeight * cs * z;
        ctx.drawImage(prev, curX + curW, cy - ph / 2, pw, ph);
      }
      ctx.restore();
    },
    [coverScale, pan.x, pan.y, zoom]
  );

  const handleSave = useCallback(async () => {
    let { prev, current: img, next } = loadedImagesRef.current;
    if (!img?.complete || !img.naturalWidth) {
      img = await loadCrossOriginImage(src);
      if (!img) return;
      loadedImagesRef.current = { ...loadedImagesRef.current, current: img };
    }
    const curIdx = selectedIndex;
    const prevIdx = curIdx > 0 ? curIdx - 1 : null;
    const nextIdx = curIdx < scenes.length - 1 ? curIdx + 1 : null;
    if (prevIdx != null && !prev?.naturalWidth) {
      const prevUrl = scenes[prevIdx]?.src ? buildCloudinaryUrl(scenes[prevIdx].src) : null;
      prev = await loadCrossOriginImage(prevUrl);
    }
    if (nextIdx != null && !next?.naturalWidth) {
      const nextUrl = scenes[nextIdx]?.src ? buildCloudinaryUrl(scenes[nextIdx].src) : null;
      next = await loadCrossOriginImage(nextUrl);
    }
    loadedImagesRef.current = { prev, current: img, next };

    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    if (!canvasRef.current) canvasRef.current = canvas;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    drawPhoto(ctx);

    const textTop = PHOTO_DY + PHOTO_DH + 36;
    ctx.fillStyle = "rgb(20 20 20)";
    ctx.font = '28px "Hina Mincho", "Zen Maru Gothic", serif';
    ctx.textAlign = "center";
    const lines = message.split(/\n/).slice(0, 3);
    lines.forEach((line, i) => {
      ctx.fillText(line, CANVAS_W / 2, textTop + i * 36);
    });

    const creditY = CANVAS_H - 48;
    ctx.font = '18px "Noto Sans JP", sans-serif';
    ctx.fillStyle = "rgb(114 114 114)";
    ctx.textAlign = "right";
    const titleLine = emakiTitle || "";
    ctx.fillText(titleLine, CANVAS_W - 56, creditY - 8);
    ctx.fillText("emakimono-next", CANVAS_W - 56, creditY + 16);

    const sealSize = 28;
    ctx.fillStyle = SEAL_COLOR;
    ctx.fillRect(CANVAS_W - 48 - sealSize, CANVAS_H - 52 - sealSize, sealSize, sealSize);
    ctx.fillStyle = "#fff";
    ctx.font = '14px "Hina Mincho", serif';
    ctx.textAlign = "center";
    ctx.fillText("巻", CANVAS_W - 48 - sealSize / 2, CANVAS_H - 52 - sealSize / 2 + 5);

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `emakimono-polaroid-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, [drawPhoto, emakiTitle, message, src]);

  if (!isOpen) return null;

  const r = frameW / PHOTO_DW;
  const { prev: prevSlot, current: curSlot, next: nextSlot } = panoramaSlots;
  const cs = coverScale;
  const z = zoom;
  const prevDw = prevSlot?.naturalWidth ? prevSlot.naturalWidth * cs * z * r : 0;
  const curDw = curSlot?.naturalWidth ? curSlot.naturalWidth * cs * z * r : 0;
  const nextDw = nextSlot?.naturalWidth ? nextSlot.naturalWidth * cs * z * r : 0;
  const curDh = curSlot?.naturalHeight ? curSlot.naturalHeight * cs * z * r : 0;
  const prevDh = prevSlot?.naturalHeight ? prevSlot.naturalHeight * cs * z * r : 0;
  const nextDh = nextSlot?.naturalHeight ? nextSlot.naturalHeight * cs * z * r : 0;
  const stripNudgeX = (prevDw - nextDw) / 2;
  const stripTransform =
    curSlot && r > 0
      ? {
          transform: `translate(calc(-50% + ${pan.x * r + stripNudgeX}px), calc(-50% + ${pan.y * r}px))`,
        }
      : undefined;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="polaroid-modal-title">
      <button type="button" className={styles.backdrop} aria-label="閉じる" onClick={onClose} />
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <h2 id="polaroid-modal-title" className={styles.srOnly}>
          ポラロイド切り抜き
        </h2>
        <div
          ref={frameRef}
          className={styles.photoFrame}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {src && curSlot ? (
            <div className={styles.panoramaStrip} style={stripTransform}>
              {nextSlot ? (
                <img
                  crossOrigin="anonymous"
                  src={nextSlot.src}
                  alt=""
                  className={styles.photoImage}
                  style={{ width: `${nextDw}px`, height: `${nextDh}px`, flexShrink: 0 }}
                  draggable={false}
                />
              ) : null}
              <img
                crossOrigin="anonymous"
                src={curSlot.src}
                alt={currentScene?.name || currentScene?.title || "Emaki Scene"}
                className={styles.photoImage}
                style={{ width: `${curDw}px`, height: `${curDh}px`, flexShrink: 0 }}
                draggable={false}
              />
              {prevSlot ? (
                <img
                  crossOrigin="anonymous"
                  src={prevSlot.src}
                  alt=""
                  className={styles.photoImage}
                  style={{ width: `${prevDw}px`, height: `${prevDh}px`, flexShrink: 0 }}
                  draggable={false}
                />
              ) : null}
            </div>
          ) : (
            <div className={styles.photoPlaceholder}>画像がありません</div>
          )}
        </div>
        <textarea
          className={styles.messageInput}
          placeholder="ひとこと（40文字まで）"
          maxLength={MESSAGE_MAX}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
        />
        <div className={styles.footer}>
          <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={!src}>
            画像を保存
          </button>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className={styles.hiddenCanvas} width={CANVAS_W} height={CANVAS_H} aria-hidden="true" />
    </div>
  );
}

export default PolaroidModal;
