import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import QRCode from "qrcode";
import styles from "@/styles/PolaroidModal.module.css";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import { recordEmakiLoopVideo } from "@/utils/emakiVideoRecorder";
import {
  ChaptersTitle,
  connectEmakiTextData,
  isGenjiWork,
  resolveGenjiMasterChapter,
  connectGenjiChapters,
} from "@/utils/emakiChapterText";

// プレビューおよびポラロイド保存用（4:5 カード）
const FORMATS = {
  polaroid: {
    canvasW: 800,
    canvasH: 1000,
    photoDx: 40,
    photoDy: 40,
    photoDw: 720,
    photoDh: 560,
    captionY: 648,
    qrSize: 64,
  },
  reel: {
    canvasW: 1080,
    canvasH: 1920,
    photoDx: 80,
    photoDy: 260,
    photoDw: 920,
    photoDh: 1150,
    captionY: 1480,
    qrSize: 96,
  },
};
const PREVIEW_FMT = FORMATS.polaroid;
const PHOTO_DX = PREVIEW_FMT.photoDx;
const PHOTO_DY = PREVIEW_FMT.photoDy;
const PHOTO_DW = PREVIEW_FMT.photoDw;
const PHOTO_DH = PREVIEW_FMT.photoDh;
const MESSAGE_MAX = 40;
const SEAL_COLOR = "#c0392b";
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_DEFAULT = 1.5;

const THEMES = {
  white: {
    id: "white",
    name: "白",
    bg: "#ffffff",
    cardBg: "#ffffff",
    titleColor: "#111111",
    subColor: "#555555",
    msgColor: "#333333",
    creditColor: "#777777",
    urlColor: "#999999",
    qrDark: "#222222",
    qrLight: "#ffffff",
    border: "#e5e7eb",
  },
  washi: {
    id: "washi",
    name: "和紙",
    bg: "#f5eee1",
    cardBg: "#f5eee1",
    titleColor: "#241c16",
    subColor: "#614f43",
    msgColor: "#33261c",
    creditColor: "#736052",
    urlColor: "#877263",
    qrDark: "#33261c",
    qrLight: "#f5eee1",
    border: "#cfbe9b",
  },
  sumi: {
    id: "sumi",
    name: "墨",
    bg: "#141312",
    cardBg: "#141312",
    titleColor: "#f7f1e6",
    subColor: "#b8ada0",
    msgColor: "#ebe3d8",
    creditColor: "#948a7d",
    urlColor: "#948a7d",
    qrDark: "#141312",
    qrLight: "#f7f1e6",
    border: "#423d38",
  },
  miyabi: {
    id: "miyabi",
    name: "雅",
    bg: "#faf4e3",
    cardBg: "#faf4e3",
    titleColor: "#2b1e11",
    subColor: "#805e26",
    msgColor: "#3d2813",
    creditColor: "#8c6b32",
    urlColor: "#a37f41",
    qrDark: "#4a3514",
    qrLight: "#faf4e3",
    border: "#cfa554",
  },
};

// Canvas上にプログラマティックに各テーマのテクスチャを強調描画するヘルパー
function drawCanvasTexture(ctx, width, height, themeId) {
  ctx.save();

  if (themeId === "washi") {
    // 和紙: 生成りの柔らかな陰影 ＋ 繊細で明瞭な楮繊維
    const paperGrad = ctx.createLinearGradient(0, 0, width, height);
    paperGrad.addColorStop(0, "rgba(218, 202, 176, 0.14)");
    paperGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
    paperGrad.addColorStop(1, "rgba(208, 192, 164, 0.16)");
    ctx.fillStyle = paperGrad;
    ctx.fillRect(0, 0, width, height);

    // 楮繊維（細さは0.5〜0.9pxに保ち、不透明度と本数を適度に引き上げ）
    for (let i = 0; i < 380; i++) {
      const rx = (Math.sin(i * 997) * 0.5 + 0.5) * width;
      const ry = (Math.cos(i * 353) * 0.5 + 0.5) * height;
      const len = 6 + (Math.sin(i * 41) * 0.5 + 0.5) * 18;
      const angle = (Math.cos(i * 73) * 0.5 + 0.5) * Math.PI;

      ctx.beginPath();
      ctx.moveTo(rx, ry);
      const cpx = rx + Math.cos(angle + 0.25) * (len * 0.5);
      const cpy = ry + Math.sin(angle + 0.25) * (len * 0.5);
      const edx = rx + Math.cos(angle) * len;
      const edy = ry + Math.sin(angle) * len;
      ctx.quadraticCurveTo(cpx, cpy, edx, edy);

      ctx.lineWidth = 0.5 + (i % 3) * 0.3;
      if (i % 3 === 0) {
        ctx.strokeStyle = "rgba(100, 72, 45, 0.17)"; // 楮の主繊維
      } else if (i % 3 === 1) {
        ctx.strokeStyle = "rgba(135, 102, 70, 0.12)"; // 淡い中間繊維
      } else {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.48)"; // 白い繊維の浮き上がり
      }
      ctx.stroke();
    }

    // 和紙の微細チリ（点ではなく極小の繊維くずとして自然に散らす）
    for (let j = 0; j < 120; j++) {
      const px = (Math.sin(j * 613) * 0.5 + 0.5) * width;
      const py = (Math.cos(j * 827) * 0.5 + 0.5) * height;
      const size = 0.5 + (Math.sin(j * 31) * 0.5 + 0.5) * 0.9;
      ctx.fillStyle = "rgba(95, 68, 42, 0.15)";
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (themeId === "miyabi") {
    // 雅: 金色の温かみあるベース ＋ 上品な切箔 ＋ 雲母金粉
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "rgba(218, 165, 32, 0.11)");
    grad.addColorStop(0.4, "rgba(255, 235, 140, 0.05)");
    grad.addColorStop(1, "rgba(190, 140, 20, 0.12)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 小さな切箔（2.0〜4.5px・不透明度0.48で黄金色を美しく発色）
    for (let k = 0; k < 65; k++) {
      const fx = (Math.sin(k * 733) * 0.5 + 0.5) * width;
      const fy = (Math.cos(k * 409) * 0.5 + 0.5) * height;
      const fsize = 2.0 + (Math.sin(k * 17) * 0.5 + 0.5) * 3.2;
      const frot = (Math.cos(k * 29) * 0.5 + 0.5) * Math.PI;

      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(frot);
      ctx.fillStyle = k % 2 === 0 ? "rgba(218, 165, 32, 0.52)" : "rgba(238, 203, 113, 0.44)";
      ctx.fillRect(-fsize / 2, -fsize / 2, fsize, fsize * 0.75);
      ctx.restore();
    }

    // 金砂子（粒径0.8〜2.0px・密度260粒で料紙らしい華やかさを付与）
    for (let i = 0; i < 260; i++) {
      const px = (Math.sin(i * 577) * 0.5 + 0.5) * width;
      const py = (Math.cos(i * 883) * 0.5 + 0.5) * height;
      const size = 0.8 + (Math.sin(i * 19) * 0.5 + 0.5) * 1.8;
      ctx.fillStyle = i % 2 === 0 ? "rgba(212, 165, 45, 0.55)" : "rgba(245, 215, 110, 0.42)";
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (themeId === "sumi") {
    // 墨: 硯墨の深みグラデーション ＋ 静かな星屑
    const radGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.85);
    radGrad.addColorStop(0, "rgba(38, 35, 32, 0.35)");
    radGrad.addColorStop(1, "rgba(10, 9, 8, 0.55)");
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(240, 230, 215, 0.25)";
    for (let i = 0; i < 110; i++) {
      const sx = (Math.sin(i * 439) * 0.5 + 0.5) * width;
      const sy = (Math.cos(i * 641) * 0.5 + 0.5) * height;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// モーダル背景用にテクスチャ画像をDataURLとして生成する軽量キャッシュ関数
const textureCache = {};
function getThemeTextureUrl(themeId) {
  if (typeof document === "undefined") return null;
  if (themeId === "white") return null;
  if (textureCache[themeId]) return textureCache[themeId];

  const w = 600;
  const h = 750;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const th = THEMES[themeId] || THEMES.white;
  ctx.fillStyle = th.bg;
  ctx.fillRect(0, 0, w, h);
  drawCanvasTexture(ctx, w, h, themeId);
  const dataUrl = c.toDataURL("image/png");
  textureCache[themeId] = dataUrl;
  return dataUrl;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function coverScaleFor(img, photoDw, photoDh) {
  return Math.max(photoDw / img.naturalWidth, photoDh / img.naturalHeight);
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

export function PolaroidModal({
  isOpen,
  onClose,
  scenes = [],
  initialIndex = 0,
  emakiTitle,
  titleen,
  titleEn,
  scrollTitleEn,
  title,
}) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [currentTheme, setCurrentTheme] = useState("white");
  const [message, setMessage] = useState("");
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [maxPan, setMaxPan] = useState({ x: 0, y: 0 });
  const [coverScale, setCoverScale] = useState(1);
  const [imgSize, setImgSize] = useState(null);
  const [panoramaSlots, setPanoramaSlots] = useState({ prev: null, current: null, next: null });
  const [frameW, setFrameW] = useState(PHOTO_DW);
  const [dragging, setDragging] = useState(false);
  const [copiedStep, setCopiedStep] = useState(null); // null | "image" | "text"
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState("share"); // "share" | "save"
  const [shareStep, setShareStep] = useState("select"); // "select" | "textCopy"
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
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

  const router = useRouter();
  const locale = router.locale ?? "ja";
  const isEn = locale === "en";
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMobileDevice(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ""));
    }
  }, []);

  const canShareFiles =
    typeof navigator !== "undefined" &&
    isMobileDevice &&
    typeof navigator.share === "function";

  const scrollId =
    typeof titleen === "string" && titleen
      ? titleen
      : typeof router.query?.slug === "string"
        ? router.query.slug
        : "";
  const scrollTitle =
    (typeof title === "string" ? title : "") || emakiTitle || "";

  const currentScene = scenes[selectedIndex] || scenes[0];
  const currentLinkId = currentScene?.linkId ?? 0;
  const rawSrc = currentScene?.src ?? "";
  const src = rawSrc ? buildCloudinaryUrl(rawSrc) : "";

  const safeString = (val) =>
    typeof val === "string" ? val.trim() : typeof val === "number" ? String(val) : "";

  const { resolvedChapterTitle, resolvedChapterDesc } = useMemo(() => {
    let ekotoba = null;
    for (let i = 0; i < scenes.length; i++) {
      const item = scenes[i];
      if (item?.cat === "ekotoba" && item.linkId <= currentLinkId) ekotoba = item;
    }
    if (!ekotoba) return { resolvedChapterTitle: "", resolvedChapterDesc: "" };

    let chapterTitleStr = "";

    // A. 巻別テキストデータからのタイトル（例: 柏木（一）など）
    const fromJson = connectEmakiTextData(scrollId, ekotoba.chapter, isEn ? "titleen" : "title");
    if (typeof fromJson === "string" && fromJson.trim()) {
      chapterTitleStr = fromJson.trim();
    }

    // B. 源氏物語の場合: 帖マスターから「第XX帖 帖名」を生成
    if (!chapterTitleStr && isGenjiWork(scrollId, scrollTitle)) {
      const masterCh = resolveGenjiMasterChapter(
        scrollId,
        ekotoba.chapter,
        ekotoba.genji_chapter
      );
      const chNum = connectGenjiChapters(masterCh, "chapter_ch");
      const genjiTitle = connectGenjiChapters(masterCh, isEn ? "titleen" : "title");
      if (genjiTitle) {
        chapterTitleStr = chNum ? `第${chNum}帖 ${genjiTitle}` : genjiTitle;
      }
    }

    // C. 一般絵巻のフォールバック
    if (!chapterTitleStr) {
      if (isEn) {
        if (typeof ekotoba.titleen === "string" && ekotoba.titleen.trim()) {
          chapterTitleStr = ekotoba.titleen.trim();
        } else if (typeof ekotoba.chapterTitleEn === "string" && ekotoba.chapterTitleEn.trim()) {
          chapterTitleStr = ekotoba.chapterTitleEn.trim();
        } else if (typeof ekotoba.chapteren === "string" && ekotoba.chapteren.trim()) {
          chapterTitleStr = ekotoba.chapteren.trim();
        }
      }
      if (!chapterTitleStr && typeof ekotoba.title === "string" && ekotoba.title.trim()) {
        chapterTitleStr = ekotoba.title.trim();
      } else if (!chapterTitleStr) {
        const rawTitle = ChaptersTitle(
          scrollId,
          scrollTitle,
          ekotoba.chapter,
          isEn ? "titleen" : "title",
          ekotoba.genji_chapter
        );
        if (typeof rawTitle === "string") {
          chapterTitleStr = rawTitle.trim();
        }
      }
    }

    const rawDesc = ekotoba.desc ?? "";
    const resolvedChapterDesc =
      typeof rawDesc === "string" ? rawDesc.replace(/<[^>]+>/g, "").trim() : "";

    return {
      resolvedChapterTitle: safeString(chapterTitleStr),
      resolvedChapterDesc,
    };
  }, [scenes, currentLinkId, scrollId, scrollTitle, locale, isEn]);

  const rawTitleEn =
    safeString(titleen) ||
    safeString(titleEn) ||
    safeString(scrollTitleEn) ||
    safeString(currentScene?.titleen) ||
    safeString(currentScene?.titleEn) ||
    safeString(currentScene?.scrollTitleEn) ||
    "";

  const rawTitleJa =
    safeString(title) ||
    safeString(currentScene?.title) ||
    safeString(emakiTitle) ||
    safeString(scrollTitle);

  const displayTitle = isEn && rawTitleEn ? rawTitleEn : rawTitleJa;

  const displayChapter = isEn
    ? safeString(currentScene?.chapterTitleEn) ||
      safeString(currentScene?.chapteren) ||
      safeString(resolvedChapterTitle)
    : safeString(resolvedChapterTitle);

  const updatePanLimits = useCallback((img, z, prevImg, nextImg) => {
    if (!img?.naturalWidth) {
      setCoverScale(1);
      setMaxPan({ x: 0, y: 0 });
      return;
    }
    const cs = coverScaleFor(img, PHOTO_DW, PHOTO_DH);
    setCoverScale(cs);
    const baseX = maxPanForAxis(img.naturalWidth, PHOTO_DW, cs, z);
    const prevW = prevImg?.naturalWidth ? prevImg.naturalWidth * cs * z : 0;
    const nextW = nextImg?.naturalWidth ? nextImg.naturalWidth * cs * z : 0;
    setMaxPan({
      x: baseX + (prevW + nextW) / 2,
      y: maxPanForAxis(img.naturalHeight, PHOTO_DH, cs, z),
    });
  }, [PHOTO_DW, PHOTO_DH]);

  useEffect(() => {
    if (!isOpen) {
      setCopiedStep(null);
      setFeedbackMessage(null);
      setIsRecording(false);
      setRecordingProgress(0);
      setIsShareSheetOpen(false);
      setShareStep("select");
      setSheetMode("share");
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
    (ctx, faviconImg, qrImg, sceneUrlText, format = "polaroid") => {
      const fmt = FORMATS[format] || FORMATS.polaroid;
      const { prev, current: img, next } = loadedImagesRef.current;
      if (!img?.naturalWidth) return;
      const cs =
        format === "polaroid" ? coverScale : coverScaleFor(img, fmt.photoDw, fmt.photoDh);
      const z = zoom;
      const panScaleX = fmt.photoDw / PHOTO_DW;
      const panScaleY = fmt.photoDh / PHOTO_DH;
      const panX = pan.x * panScaleX;
      const panY = pan.y * panScaleY;
      const curW = img.naturalWidth * cs * z;
      const curH = img.naturalHeight * cs * z;
      const cx = fmt.photoDx + fmt.photoDw / 2 + panX;
      const cy = fmt.photoDy + fmt.photoDh / 2 + panY;
      const curX = cx - curW / 2;
      const curY = cy - curH / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(fmt.photoDx, fmt.photoDy, fmt.photoDw, fmt.photoDh);
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

      const theme = THEMES[currentTheme] || THEMES.white;

      // 1. 各テーマ固有の質感テクスチャを描画
      drawCanvasTexture(ctx, fmt.canvasW, fmt.canvasH, currentTheme);

      // 2. 枠線（二重線や繊細な縁取りで工芸品のような仕上がりに）
      if (theme.border) {
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(18, 18, fmt.canvasW - 36, fmt.canvasH - 36);

        if (currentTheme === "miyabi") {
          // 雅テーマは内側に極細の二重枠
          ctx.lineWidth = 0.8;
          ctx.strokeRect(22, 22, fmt.canvasW - 44, fmt.canvasH - 44);
        }
      }

      // --- 写真下部エリア（美術館キャプション風中央揃え） ---
      ctx.textAlign = "center";

      // 1. 段タイトル（主役・中央配置）
      const centerCenterX = fmt.canvasW / 2;
      let currentY = fmt.captionY;

      const cleanTitle = typeof displayChapter === "string" ? displayChapter.trim() : "";
      const cleanEmaki = typeof displayTitle === "string" ? displayTitle.trim() : "";
      const cleanMsg = typeof message === "string" ? message.trim() : "";

      if (cleanTitle) {
        ctx.font = 'bold 24px "Zen Old Mincho", "Hina Mincho", serif';
        ctx.fillStyle = theme.titleColor;
        ctx.fillText(isEn ? `— ${cleanTitle} —` : `―  ${cleanTitle}  ―`, centerCenterX, currentY);
        currentY += 32;
      }

      // 2. 絵巻物タイトル（副題）
      if (cleanEmaki) {
        ctx.font = '16px "Zen Old Mincho", "Hina Mincho", serif';
        ctx.fillStyle = theme.subColor;
        ctx.fillText(isEn ? `"${cleanEmaki}"` : `『${cleanEmaki}』`, centerCenterX, currentY);
        currentY += 40;
      }

      // 3. ユーザーのひとこと
      if (cleanMsg) {
        ctx.font = 'italic 18px "Zen Old Mincho", "Hina Mincho", serif';
        ctx.fillStyle = theme.msgColor;
        ctx.fillText(`“ ${cleanMsg} ”`, centerCenterX, currentY);
      }

      // 4. 最下部クレジット（サイト名 + シーンURL を中央揃え2段で整然配置）
      const brandY = fmt.canvasH - 40;
      const urlY = fmt.canvasH - 22;
      const footerText = "絵巻物ビューアー  |  emakimono.com";

      ctx.font = '12px sans-serif';
      ctx.fillStyle = theme.creditColor;

      const textMetrics = ctx.measureText(footerText);
      const textWidth = textMetrics.width;
      const iconSize = 15;
      const iconGap = 6;
      const totalWidth = (faviconImg ? iconSize + iconGap : 0) + textWidth;
      const startX = (fmt.canvasW - totalWidth) / 2;

      if (faviconImg && faviconImg.complete && faviconImg.naturalWidth > 0) {
        ctx.drawImage(faviconImg, startX, brandY - 11, iconSize, iconSize);
      }

      ctx.textAlign = "left";
      ctx.fillText(footerText, startX + (faviconImg ? iconSize + iconGap : 0), brandY);

      if (sceneUrlText) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = theme.urlColor;
        ctx.textAlign = "center";
        ctx.fillText(sceneUrlText, centerCenterX, urlY);
      }

      // 5. 該当シーン直通 QRコード（右下隅）
      if (qrImg && qrImg.complete && qrImg.naturalWidth > 0) {
        const qrSize = fmt.qrSize;
        const qrX = fmt.canvasW - fmt.photoDx - qrSize;
        const qrY = fmt.canvasH - qrSize - 18;
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      }
    },
    [coverScale, pan.x, pan.y, zoom, displayTitle, displayChapter, message, currentTheme, isEn]
  );

  const handleDownload = useCallback(async (format = "polaroid") => {
    const fmt = FORMATS[format] || FORMATS.polaroid;
    let { prev, current: img, next } = loadedImagesRef.current;
    if (!img?.complete || !img.naturalWidth) {
      img = await loadCrossOriginImage(src);
      if (!img) return;
      loadedImagesRef.current = { ...loadedImagesRef.current, current: img };
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
    const prevIdx = findPanoramaIndex(curIdx - 1, -1);
    const nextIdx = findPanoramaIndex(curIdx + 1, 1);
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
    canvas.width = fmt.canvasW;
    canvas.height = fmt.canvasH;
    if (!canvasRef.current) canvasRef.current = canvas;

    const activeTheme = THEMES[currentTheme] || THEMES.white;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = activeTheme.cardBg || activeTheme.bg;
    ctx.fillRect(0, 0, fmt.canvasW, fmt.canvasH);

    const favicon = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = "/favicon.ico";
    });

    const pageUrl = typeof window !== "undefined" ? window.location.href : "https://emakimono.com";
    const qrDataUrl = await QRCode.toDataURL(pageUrl, {
      margin: 1,
      width: 120,
      color: { dark: activeTheme.qrDark, light: activeTheme.qrLight },
    }).catch(() => null);
    const qrImg = qrDataUrl ? await loadCrossOriginImage(qrDataUrl) : null;

    // URLデコード（%C5%8D等を本来の文字に戻す）＋ 表示用ドメイン整理
    let displayUrl = pageUrl;
    try {
      displayUrl = decodeURIComponent(pageUrl);
    } catch (e) {
      // noop
    }
    // プロトコル除去。プレビュー環境やローカル時は emakimono.com 基準のパスに整形
    displayUrl = displayUrl.replace(/^https?:\/\/[^/]+/, "emakimono.com");
    drawPhoto(ctx, favicon, qrImg, displayUrl, format);

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `emakimono-${format}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, [drawPhoto, scenes.length, selectedIndex, src, currentTheme]);

  // 拡散用メタテキスト生成ヘルパー
  const getShareTextPayload = useCallback(() => {
    const cleanTitle = typeof displayChapter === "string" ? displayChapter.trim() : "";
    const cleanEmaki = typeof displayTitle === "string" ? displayTitle.trim() : "";
    const chapter = cleanTitle ? (isEn ? `[${cleanTitle}]` : `【${cleanTitle}】`) : "";
    const mainTitle = cleanEmaki ? (isEn ? `"${cleanEmaki}"` : `『${cleanEmaki}』`) : "";
    const titleLines = [chapter, mainTitle].filter(Boolean).join("\n");
    const cleanMsg = typeof message === "string" ? message.trim() : "";
    const customLine = cleanMsg ? cleanMsg : "";
    const tags = "#絵巻物ビューアー #日本美術";
    const url = typeof window !== "undefined" ? window.location.href : "";

    return [titleLines, customLine, tags, url]
      .filter((line) => line !== "")
      .join("\n\n");
  }, [displayTitle, displayChapter, message, isEn]);

  // 1回目で画像コピー、2回目でテキストコピーを実行するスマートハンドラー
  const handleCopyAndShare = useCallback(async () => {
    // すでに画像コピー済みの場合: 本文テキストをコピー
    if (copiedStep === "image") {
      const text = getShareTextPayload();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          setCopiedStep("text");
          return;
        } catch (e) {
          console.error("Text copy failed:", e);
        }
      }
      return;
    }

    // 初回: 画像をクリップボードにコピー
    let { prev, current: img, next } = loadedImagesRef.current;
    if (!img?.complete || !img.naturalWidth) {
      img = await loadCrossOriginImage(src);
      if (!img) return;
      loadedImagesRef.current = { ...loadedImagesRef.current, current: img };
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
    const prevIdx = findPanoramaIndex(curIdx - 1, -1);
    const nextIdx = findPanoramaIndex(curIdx + 1, 1);
    if (prevIdx != null && !prev?.naturalWidth) {
      const prevUrl = scenes[prevIdx]?.src ? buildCloudinaryUrl(scenes[prevIdx].src) : null;
      prev = await loadCrossOriginImage(prevUrl);
    }
    if (nextIdx != null && !next?.naturalWidth) {
      const nextUrl = scenes[nextIdx]?.src ? buildCloudinaryUrl(scenes[nextIdx].src) : null;
      next = await loadCrossOriginImage(nextUrl);
    }
    loadedImagesRef.current = { prev, current: img, next };

    const copyFmt = FORMATS.polaroid;
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvas.width = copyFmt.canvasW;
    canvas.height = copyFmt.canvasH;
    if (!canvasRef.current) canvasRef.current = canvas;

    const activeTheme = THEMES[currentTheme] || THEMES.white;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = activeTheme.cardBg || activeTheme.bg;
    ctx.fillRect(0, 0, copyFmt.canvasW, copyFmt.canvasH);

    const favicon = await new Promise((resolve) => {
      const imgFav = new Image();
      imgFav.onload = () => resolve(imgFav);
      imgFav.onerror = () => resolve(null);
      imgFav.src = "/favicon.ico";
    });

    const pageUrl = typeof window !== "undefined" ? window.location.href : "https://emakimono.com";
    const qrDataUrl = await QRCode.toDataURL(pageUrl, {
      margin: 1,
      width: 120,
      color: { dark: activeTheme.qrDark, light: activeTheme.qrLight },
    }).catch(() => null);
    const qrImg = qrDataUrl ? await loadCrossOriginImage(qrDataUrl) : null;

    // URLデコード（%C5%8D等を本来の文字に戻す）＋ 表示用ドメイン整理
    let displayUrl = pageUrl;
    try {
      displayUrl = decodeURIComponent(pageUrl);
    } catch (e) {
      // noop
    }
    displayUrl = displayUrl.replace(/^https?:\/\/[^/]+/, "emakimono.com");

    drawPhoto(ctx, favicon, qrImg, displayUrl, "polaroid");

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          const item = new ClipboardItem({ [blob.type]: blob });
          await navigator.clipboard.write([item]);
          setCopiedStep("image");
          return;
        } catch (e) {
          console.error("Clipboard write failed:", e);
        }
      }
      alert("クリップボードへの画像コピーに対応していません。「保存」をご利用ください。");
    }, "image/png");
  }, [copiedStep, drawPhoto, getShareTextPayload, scenes.length, selectedIndex, src, currentTheme]);

  // Web Share API を利用した汎用 SNS シェア
  const handleShareSNS = useCallback(async () => {
    let { prev, current: img, next } = loadedImagesRef.current;
    if (!img?.complete || !img.naturalWidth) {
      img = await loadCrossOriginImage(src);
      if (!img) return;
      loadedImagesRef.current = { ...loadedImagesRef.current, current: img };
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
    const prevIdx = findPanoramaIndex(curIdx - 1, -1);
    const nextIdx = findPanoramaIndex(curIdx + 1, 1);
    if (prevIdx != null && !prev?.naturalWidth) {
      const prevUrl = scenes[prevIdx]?.src ? buildCloudinaryUrl(scenes[prevIdx].src) : null;
      prev = await loadCrossOriginImage(prevUrl);
    }
    if (nextIdx != null && !next?.naturalWidth) {
      const nextUrl = scenes[nextIdx]?.src ? buildCloudinaryUrl(scenes[nextIdx].src) : null;
      next = await loadCrossOriginImage(nextUrl);
    }
    loadedImagesRef.current = { prev, current: img, next };

    const shareFmt = FORMATS.polaroid;
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvas.width = shareFmt.canvasW;
    canvas.height = shareFmt.canvasH;
    if (!canvasRef.current) canvasRef.current = canvas;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = THEMES[currentTheme]?.cardBg || "#ffffff";
    ctx.fillRect(0, 0, shareFmt.canvasW, shareFmt.canvasH);

    const favicon = await new Promise((resolve) => {
      const imgFav = new Image();
      imgFav.onload = () => resolve(imgFav);
      imgFav.onerror = () => resolve(null);
      imgFav.src = "/favicon.ico";
    });
    drawPhoto(ctx, favicon, null, null, "polaroid");

    const cleanTitle = typeof displayChapter === "string" ? displayChapter.trim() : "";
    const cleanEmaki = typeof displayTitle === "string" ? displayTitle.trim() : isEn ? "Emaki scroll" : "絵巻物";
    const cleanMsg = typeof message === "string" ? message.trim() : "";
    const pageUrl = typeof window !== "undefined" ? window.location.href : "https://emakimono.com";
    const shareText = `${cleanTitle ? (isEn ? `[${cleanTitle}]` : `【${cleanTitle}】`) : ""}${cleanEmaki ? (isEn ? `"${cleanEmaki}"` : `『${cleanEmaki}』`) : ""}\n${cleanMsg ? `"${cleanMsg}"\n` : ""}\n#絵巻物ビューアー #日本美術`;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `emakimono-polaroid-${Date.now()}.png`, { type: "image/png" });

      // 1. 画像ファイル対応の Web Share API
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${cleanEmaki} - 絵巻物ビューアー`,
            text: shareText,
            url: pageUrl,
          });
          return;
        } catch (err) {
          if (err.name === "AbortError") return;
        }
      }

      // 2. テキスト/URL のみの Web Share API
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: `${cleanEmaki} - 絵巻物ビューアー`,
            text: shareText,
            url: pageUrl,
          });
          return;
        } catch (err) {
          if (err.name === "AbortError") return;
        }
      }

      // 3. 非対応環境フォールバック: 画像コピー ＋ 案内
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          alert("お使いの環境では共有シートを起動できないため、画像をクリップボードにコピーしました！\nお好みのSNSへ貼り付けて共有してください。");
        } catch (e) {
          alert("共有機能に対応していないブラウザです。「保存」ボタンからダウンロードしてください。");
        }
      }
    }, "image/png");
  }, [drawPhoto, displayTitle, displayChapter, message, isEn, scenes.length, selectedIndex, src]);

  const ensureLoadedForExport = useCallback(async () => {
    let { prev, current: img, next } = loadedImagesRef.current;
    if (!img?.complete || !img.naturalWidth) {
      img = await loadCrossOriginImage(src);
      if (!img) return null;
      loadedImagesRef.current = { ...loadedImagesRef.current, current: img };
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
    const prevIdx = findPanoramaIndex(curIdx - 1, -1);
    const nextIdx = findPanoramaIndex(curIdx + 1, 1);
    if (prevIdx != null && !prev?.naturalWidth) {
      const prevUrl = scenes[prevIdx]?.src ? buildCloudinaryUrl(scenes[prevIdx].src) : null;
      prev = await loadCrossOriginImage(prevUrl);
    }
    if (nextIdx != null && !next?.naturalWidth) {
      const nextUrl = scenes[nextIdx]?.src ? buildCloudinaryUrl(scenes[nextIdx].src) : null;
      next = await loadCrossOriginImage(nextUrl);
    }
    loadedImagesRef.current = { prev, current: img, next };
    return img;
  }, [scenes, selectedIndex, src]);

  const handleGenerateVideo = useCallback(async () => {
    if (isRecording) return;
    try {
      setIsRecording(true);
      setRecordingProgress(0);
      const img = await ensureLoadedForExport();
      if (!img?.naturalWidth) throw new Error("Image not loaded");
      const scale = coverScale * zoom;
      const centerPoint = {
        x: img.naturalWidth / 2 - pan.x / scale,
        y: img.naturalHeight / 2 - pan.y / scale,
      };
      const currentUrl = typeof window !== "undefined" ? window.location.href : "";
      const qrElement = document.querySelector("#polaroid-qr-code canvas") || null;
      const logoElement = document.querySelector("#polaroid-logo-img") || null;

      await recordEmakiLoopVideo({
        image: img,
        centerPoint,
        zoom,
        title: isEn ? `"${displayTitle}"` : `『${displayTitle}』`,
        chapterTitle: displayChapter,
        customComment: message || "",
        pageUrl: currentUrl,
        qrCodeImage: qrElement,
        logoImage: logoElement,
        onProgress: (p) => setRecordingProgress(p),
      });
      setFeedbackMessage(isEn ? "5-second loop video saved!" : "5秒ループ動画を保存しました！");
      setIsShareSheetOpen(false);
    } catch (err) {
      console.error("Failed to record video:", err);
      setFeedbackMessage(isEn ? "Video generation failed" : "動画の生成に失敗しました");
    } finally {
      setIsRecording(false);
      setRecordingProgress(0);
    }
  }, [
    isRecording,
    ensureLoadedForExport,
    coverScale,
    zoom,
    pan.x,
    pan.y,
    displayTitle,
    displayChapter,
    message,
    isEn,
  ]);

  const handleShareVideo = useCallback(async () => {
    if (isRecording) return;
    try {
      setIsRecording(true);
      setRecordingProgress(0);
      const img = await ensureLoadedForExport();
      if (!img?.naturalWidth) throw new Error("Image not loaded");
      const scale = coverScale * zoom;
      const centerPoint = {
        x: img.naturalWidth / 2 - pan.x / scale,
        y: img.naturalHeight / 2 - pan.y / scale,
      };
      const currentUrl = typeof window !== "undefined" ? window.location.href : "";
      const qrElement = document.querySelector("#polaroid-qr-code canvas") || null;
      const logoElement = document.querySelector("#polaroid-logo-img") || null;

      const videoBlob = await recordEmakiLoopVideo({
        image: img,
        centerPoint,
        zoom,
        title: isEn ? `"${displayTitle}"` : `『${displayTitle}』`,
        chapterTitle: displayChapter,
        customComment: message || "",
        pageUrl: currentUrl,
        qrCodeImage: qrElement,
        logoImage: logoElement,
        onProgress: (p) => setRecordingProgress(p),
      });
      const ext = videoBlob.type.includes("mp4") ? "mp4" : "webm";
      const videoFile = new File([videoBlob], `emakimono-short-${Date.now()}.${ext}`, {
        type: videoBlob.type,
      });
      let sharedViaApi = false;

      // モバイル実機であり、かつファイルのWeb共有をサポートしている場合のみ共有ダイアログを起動
      if (canShareFiles && navigator.canShare && navigator.canShare({ files: [videoFile] })) {
        try {
          await navigator.share({
            files: [videoFile],
            title: displayTitle,
            text: getShareTextPayload ? getShareTextPayload() : `${displayTitle} | 絵巻物ビューアー`,
          });
          sharedViaApi = true;
          setIsShareSheetOpen(false);
        } catch (shareErr) {
          if (shareErr.name === "AbortError") {
            return;
          }
          console.warn("navigator.share failed, fallback to download + copy:", shareErr);
        }
      }

      // デスクトップ環境、またはWeb Share非対応/失敗時のフォールバック
      if (!sharedViaApi) {
        if (getShareTextPayload) {
          try {
            await navigator.clipboard.writeText(getShareTextPayload());
          } catch (clipErr) {
            console.warn("Clipboard text copy failed:", clipErr);
          }
        }
        setFeedbackMessage(
          isEn ? "Video saved and caption copied!" : "動画を保存し、投稿用本文をコピーしました！"
        );
        setIsShareSheetOpen(false);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Failed to share video:", err);
        setFeedbackMessage(isEn ? "Video share failed" : "動画の共有に失敗しました");
      }
    } finally {
      setIsRecording(false);
      setRecordingProgress(0);
    }
  }, [
    isRecording,
    ensureLoadedForExport,
    coverScale,
    zoom,
    pan.x,
    pan.y,
    displayTitle,
    displayChapter,
    message,
    getShareTextPayload,
    isEn,
  ]);

  const copyFormattedImage = useCallback(
    async (format, { trackWebFlow = false } = {}) => {
      const img = await ensureLoadedForExport();
      if (!img) return;
      const copyFmt = FORMATS[format] || FORMATS.polaroid;
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = copyFmt.canvasW;
      canvas.height = copyFmt.canvasH;
      if (!canvasRef.current) canvasRef.current = canvas;
      const activeTheme = THEMES[currentTheme] || THEMES.white;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = activeTheme.cardBg || activeTheme.bg;
      ctx.fillRect(0, 0, copyFmt.canvasW, copyFmt.canvasH);
      const favicon = await new Promise((resolve) => {
        const imgFav = new Image();
        imgFav.onload = () => resolve(imgFav);
        imgFav.onerror = () => resolve(null);
        imgFav.src = "/favicon.ico";
      });
      const pageUrl = typeof window !== "undefined" ? window.location.href : "https://emakimono.com";
      const qrDataUrl = await QRCode.toDataURL(pageUrl, {
        margin: 1,
        width: 120,
        color: { dark: activeTheme.qrDark, light: activeTheme.qrLight },
      }).catch(() => null);
      const qrImg = qrDataUrl ? await loadCrossOriginImage(qrDataUrl) : null;
      let displayUrl = pageUrl;
      try {
        displayUrl = decodeURIComponent(pageUrl);
      } catch (e) {
        // noop
      }
      displayUrl = displayUrl.replace(/^https?:\/\/[^/]+/, "emakimono.com");
      drawPhoto(ctx, favicon, qrImg, displayUrl, format);
      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve(false);
            return;
          }
          if (navigator.clipboard && window.ClipboardItem) {
            try {
              await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
              if (trackWebFlow) setCopiedStep("image");
              else setCopiedStep(null);
              resolve(true);
              return;
            } catch (e) {
              console.error("Clipboard write failed:", e);
            }
          }
          alert("クリップボードへの画像コピーに対応していません。「保存」をご利用ください。");
          resolve(false);
        }, "image/png");
      });
    },
    [currentTheme, drawPhoto, ensureLoadedForExport]
  );

  const handleShareCopy = useCallback(
    async (type = "x") => {
      try {
        const isReel = type === "reel";
        const format = isReel ? "reel" : "polaroid";
        const img = await ensureLoadedForExport();
        if (!img) return;
        const copyFmt = FORMATS[format] || FORMATS.polaroid;
        const canvas = canvasRef.current ?? document.createElement("canvas");
        canvas.width = copyFmt.canvasW;
        canvas.height = copyFmt.canvasH;
        if (!canvasRef.current) canvasRef.current = canvas;
        const activeTheme = THEMES[currentTheme] || THEMES.white;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = activeTheme.cardBg || activeTheme.bg;
        ctx.fillRect(0, 0, copyFmt.canvasW, copyFmt.canvasH);
        const favicon = await new Promise((resolve) => {
          const imgFav = new Image();
          imgFav.onload = () => resolve(imgFav);
          imgFav.onerror = () => resolve(null);
          imgFav.src = "/favicon.ico";
        });
        const pageUrl = typeof window !== "undefined" ? window.location.href : "https://emakimono.com";
        const qrDataUrl = await QRCode.toDataURL(pageUrl, {
          margin: 1,
          width: 120,
          color: { dark: activeTheme.qrDark, light: activeTheme.qrLight },
        }).catch(() => null);
        const qrImg = qrDataUrl ? await loadCrossOriginImage(qrDataUrl) : null;
        let displayUrl = pageUrl;
        try {
          displayUrl = decodeURIComponent(pageUrl);
        } catch (e) {
          // noop
        }
        displayUrl = displayUrl.replace(/^https?:\/\/[^/]+/, "emakimono.com");
        drawPhoto(ctx, favicon, qrImg, displayUrl, format);
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          if (!navigator.clipboard || !window.ClipboardItem) {
            alert("クリップボードへの画像コピーに対応していません。「保存」をご利用ください。");
            return;
          }
          try {
            if (isReel) {
              await navigator.clipboard.write([
                new ClipboardItem({
                  "image/png": blob,
                }),
              ]);
              setIsShareSheetOpen(false);
              setFeedbackMessage(
                isEn ? "Reels image (9:16) copied to clipboard!" : "リール用画像(9:16)をコピーしました"
              );
            } else {
              await navigator.clipboard.write([
                new ClipboardItem({
                  "image/png": blob,
                }),
              ]);
              setShareStep("textCopy");
            }
          } catch (err) {
            console.error("Clipboard copy failed:", err);
          }
        }, "image/png");
      } catch (error) {
        console.error("Failed to generate share content:", error);
      }
    },
    [currentTheme, drawPhoto, ensureLoadedForExport, displayTitle, displayChapter, message, isEn]
  );

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
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: THEMES[currentTheme]?.bg || "#ffffff",
          backgroundImage: getThemeTextureUrl(currentTheme) ? `url(${getThemeTextureUrl(currentTheme)})` : "none",
          color: THEMES[currentTheme]?.titleColor || "#111111",
          border: THEMES[currentTheme]?.border ? `1.5px solid ${THEMES[currentTheme].border}` : "1px solid #e5e7eb",
        }}
      >
        <h2 id="polaroid-modal-title" className={styles.srOnly}>
          ポラロイド切り抜き
        </h2>

        {/* 対応プラットフォーム案内バッジ列（1行固定・コンパクト表示） */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "6px 8px 8px",
            fontSize: "10px",
            color: "#555",
            flexWrap: "nowrap",
            whiteSpace: "nowrap",
            overflowX: "auto",
          }}
        >
          <span style={{ fontSize: "10px", color: "#888", fontWeight: "600", marginRight: "1px" }}>
            {isEn ? "Export for:" : "対応:"}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              background: "#f0f2f5",
              padding: "2px 6px",
              borderRadius: "10px",
              fontWeight: "600",
            }}
          >
            𝕏
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              background: "#fcefe9",
              color: "#c13584",
              padding: "2px 6px",
              borderRadius: "10px",
              fontWeight: "600",
            }}
          >
            {isEn ? "📸 Reels" : "📸 リール"}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              background: "#ffebee",
              color: "#d32f2f",
              padding: "2px 6px",
              borderRadius: "10px",
              fontWeight: "600",
            }}
          >
            ▶️ Shorts
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              background: "#f0f0f0",
              color: "#111",
              padding: "2px 6px",
              borderRadius: "10px",
              fontWeight: "600",
            }}
          >
            TikTok
          </span>
        </div>

        <div
          ref={frameRef}
          className={styles.photoFrame}
          style={{ aspectRatio: "720 / 560" }}
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
          <div className={styles.zoomHint}>ドラッグで位置調整・ホイールで拡大縮小</div>
        </div>

        <div className={styles.themeSelector} role="radiogroup" aria-label="テーマ選択">
          {Object.values(THEMES).map((th) => (
            <button
              key={th.id}
              type="button"
              className={`${styles.themeDot} ${currentTheme === th.id ? styles.themeDotActive : ""}`}
              style={{
                backgroundColor: th.bg,
                borderColor: currentTheme === th.id ? (th.id === "sumi" ? "#cfa554" : "#2c3e50") : (th.border || "#d1d5db"),
              }}
              onClick={() => setCurrentTheme(th.id)}
              title={`${th.name}テーマ`}
              aria-label={`${th.name}テーマ`}
            />
          ))}
        </div>

        <div className={styles.captionArea}>
          {displayChapter && (
            <h3 className={styles.captionTitle} style={{ color: THEMES[currentTheme]?.titleColor }}>
              {isEn ? `— ${displayChapter} —` : `― ${displayChapter} ―`}
            </h3>
          )}
          {displayTitle && (
            <p className={styles.captionSubtitle} style={{ color: THEMES[currentTheme]?.subColor }}>
              {isEn ? `"${displayTitle}"` : `『${displayTitle}』`}
            </p>
          )}

          <div
            style={{
              margin: "10px auto 4px",
              maxWidth: "360px",
              width: "90%",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: message ? "rgba(255, 255, 255, 0.85)" : "#f7f6f2",
                border: message ? "1px solid #d0ccc0" : "1.5px dashed #b8b2a5",
                borderRadius: "8px",
                padding: "5px 10px",
                transition: "all 0.2s ease",
                boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.04)",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  marginRight: "6px",
                  opacity: 0.65,
                  userSelect: "none",
                  flexShrink: 0,
                }}
              >
                ✏️
              </span>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isEn ? "Add a note (e.g. Favorite scene)" : "ひとこと添える（例: お気に入りのシーン）"}
                maxLength={MESSAGE_MAX}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: "'Noto Serif JP', serif",
                  fontSize: "13px",
                  color: THEMES[currentTheme]?.msgColor || "#333",
                  textAlign: "center",
                  fontStyle: message ? "italic" : "normal",
                }}
              />
              {message && (
                <button
                  type="button"
                  onClick={() => setMessage("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#999",
                    padding: "0 2px",
                    lineHeight: 1,
                  }}
                  title="クリア"
                >
                  ✕
                </button>
              )}
            </div>
            {!message && (
              <div
                style={{
                  fontSize: "10px",
                  color: "#999",
                  textAlign: "center",
                  marginTop: "2px",
                }}
              >
                {isEn
                  ? "※ Included as a caption in the image/video (max 40 chars)"
                  : "※画像・動画内に手書きキャプションとして反映されます（最大40文字）"}
              </div>
            )}
          </div>
        </div>

        <div className={styles.cardFooterLine} style={{ color: THEMES[currentTheme]?.creditColor }}>
          <img src="/favicon.ico" alt="" width={12} height={12} style={{ borderRadius: 2, marginRight: 4 }} />
          絵巻物ビューアー | emakimono.com
        </div>

        {(copiedStep || feedbackMessage) && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "0.725rem",
              textAlign: "center",
              color: copiedStep === "text" ? "#16a34a" : "#2563eb",
            }}
          >
            {feedbackMessage ||
              (copiedStep === "image"
                ? isEn
                  ? "✓ Image copied (paste with Ctrl+V, then tap again to copy caption)"
                  : "✓ 画像をコピーしました（投稿欄に Ctrl+V 貼付後、もう一度押すと本文コピー）"
                : isEn
                ? "✓ Caption and URL copied!"
                : "✓ 本文・URLもコピーしました！")}
          </p>
        )}

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={() => {
              setSheetMode("save");
              setShareStep("select");
              setIsShareSheetOpen(true);
            }}
            disabled={!src}
          >
            {isEn ? "Save" : "保存"}
          </button>
          <button
            type="button"
            className={styles.shareBtn}
            onClick={() => {
              setFeedbackMessage(null);
              setSheetMode("share");
              setShareStep("select");
              setIsShareSheetOpen(true);
            }}
            disabled={!src}
            style={{
              backgroundColor: currentTheme === "sumi" ? "#383533" : "#2c3e50",
            }}
          >
            {isEn ? "Share to SNS / Shorts" : "SNS・Shortsに共有"}
          </button>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            {isEn ? "Close" : "閉じる"}
          </button>
        </div>

        {isShareSheetOpen && (
          <div className={styles.shareSheetOverlay}>
            <div className={styles.shareSheetContent}>
              {shareStep === "select" ? (
                <>
                  <div className={styles.shareSheetTitle}>
                    {sheetMode === "save"
                      ? isEn
                        ? "Select Save Format"
                        : "保存の形式を選択"
                      : isEn
                      ? "Select Export Target"
                      : "共有の用途を選択"}
                  </div>
                  {sheetMode === "save" ? (
                    <>
                      <button
                        type="button"
                        className={styles.shareOptionButton}
                        disabled={!src}
                        onClick={() => {
                          handleDownload("polaroid");
                          setIsShareSheetOpen(false);
                        }}
                      >
                        <span className={styles.shareOptionLabel}>
                          {isEn ? "🖼️ Polaroid Image (4:5)" : "🖼️ ポラロイド画像（4:5）"}
                        </span>
                        <span className={styles.shareOptionDesc}>
                          {isEn ? "Standard aspect ratio for 𝕏 & feed posts" : "X / フィード投稿向け標準比率"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={styles.shareOptionButton}
                        disabled={!src || isRecording}
                        onClick={() => {
                          handleDownload("reel");
                          setIsShareSheetOpen(false);
                        }}
                      >
                        <span className={styles.shareOptionLabel}>
                          {isEn ? "📱 Full Screen (9:16 Photo)" : "📱 縦型フル画面（9:16 静止画）"}
                        </span>
                        <span className={styles.shareOptionDesc}>
                          {isEn ? "For Instagram Reels & Stories" : "Instagram リール・ストーリーズ用"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={styles.shareOptionButton}
                        disabled={!src || isRecording}
                        onClick={handleGenerateVideo}
                        style={{
                          background: isRecording ? "#f0f7ff" : undefined,
                          borderColor: isRecording ? "#90caf9" : undefined,
                        }}
                      >
                        <span className={styles.shareOptionLabel}>
                          {isRecording
                            ? isEn
                              ? `🎥 Generating video... (${recordingProgress}%)`
                              : `🎥 動画生成中... (${recordingProgress}%)`
                            : isEn
                            ? "▶️ 5-Sec Loop Video (9:16)"
                            : "▶️ 5秒ループ動画（9:16）"}
                        </span>
                        <span className={styles.shareOptionDesc}>
                          {isEn ? "For YouTube Shorts, Reels & TikTok" : "YouTube Shorts / リール / TikTok用"}
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.shareOptionButton}
                        disabled={!src}
                        onClick={() => handleShareCopy("x")}
                      >
                        <span className={styles.shareOptionLabel}>
                          {isEn
                            ? "𝕏 For X (4:5 image + caption)"
                            : "𝕏 X (Twitter) 用（4:5 画像＋本文）"}
                        </span>
                        <span className={styles.shareOptionDesc}>
                          {isEn
                            ? "Copy polaroid image + caption instructions"
                            : "ポラロイド画像コピー ＋ 投稿テキスト案内"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={styles.shareOptionButton}
                        disabled={!src || isRecording}
                        onClick={() => handleShareCopy("reel")}
                      >
                        <span className={styles.shareOptionLabel}>
                          {isEn
                            ? "📸 Instagram Reels / Stories (still image)"
                            : "📸 Instagram リール / ストーリーズ（静止画）"}
                        </span>
                        <span className={styles.shareOptionDesc}>
                          {isEn
                            ? "Copy 9:16 vertical image to clipboard"
                            : "9:16 縦型画像のみをクリップボードにコピー"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={styles.shareOptionButton}
                        disabled={!src || isRecording}
                        onClick={handleShareVideo}
                        style={{
                          background: isRecording ? "#f0f7ff" : undefined,
                          borderColor: isRecording ? "#90caf9" : undefined,
                        }}
                      >
                        <span className={styles.shareOptionLabel}>
                          {isRecording
                            ? isEn
                              ? `🎥 Generating video... (${recordingProgress}%)`
                              : `🎥 動画生成中... (${recordingProgress}%)`
                            : canShareFiles
                            ? isEn
                              ? "▶️ YouTube Shorts / Reels / TikTok (share video)"
                              : "▶️ YouTube Shorts / リール / TikTok（動画共有）"
                            : isEn
                            ? "▶️ YouTube Shorts / Reels / TikTok (save + caption)"
                            : "▶️ YouTube Shorts / リール / TikTok（動画保存＋本文）"}
                        </span>
                        <span className={styles.shareOptionDesc}>
                          {canShareFiles
                            ? isEn
                              ? "Share 9:16 loop video directly to apps"
                              : "9:16 ループ動画を各アプリへ直接共有"
                            : isEn
                            ? "Save 9:16 loop video and copy caption"
                            : "9:16 ループ動画を保存し、投稿文をコピー"}
                        </span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className={styles.shareCancelButton}
                    onClick={() => {
                      setIsShareSheetOpen(false);
                      setShareStep("select");
                    }}
                  >
                    {isEn ? "Cancel" : "キャンセル"}
                  </button>
                </>
              ) : (
                <>
                  <div className={styles.shareSheetTitle} style={{ color: "#2e7d32" }}>
                    {isEn ? "✓ Image copied to clipboard" : "✓ 画像をコピーしました"}
                  </div>
                  <p style={{ fontSize: "12px", color: "#666", margin: "4px 0 8px", lineHeight: "1.4" }}>
                    {isEn ? (
                      <>
                        ① Paste the image into your post (Ctrl + V)
                        <br />
                        ② Use the button below to copy and paste the caption
                      </>
                    ) : (
                      <>
                        ① 投稿欄に画像を貼り付け（Ctrl + V）<br />
                        ② 下のボタンで本文をコピーして貼り付けてください
                      </>
                    )}
                  </p>
                  <div
                    style={{
                      background: "#f8f9fa",
                      border: "1px solid #e9ecef",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      lineHeight: "1.6",
                      color: "#212529",
                      maxHeight: "160px",
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      textAlign: "left",
                    }}
                  >
                    {getShareTextPayload()}
                  </div>
                  <button
                    type="button"
                    className={styles.shareOptionButton}
                    style={{ justifyContent: "center", background: "#1976d2", color: "#fff", fontWeight: "bold" }}
                    onClick={async () => {
                      const text = getShareTextPayload();
                      await navigator.clipboard.writeText(text);
                      setFeedbackMessage(isEn ? "Caption copied!" : "本文をコピーしました！");
                      setIsShareSheetOpen(false);
                      setShareStep("select");
                    }}
                  >
                    {isEn ? "Copy caption & close" : "本文をコピーして閉じる"}
                  </button>
                  <button
                    type="button"
                    className={styles.shareCancelButton}
                    onClick={() => {
                      setIsShareSheetOpen(false);
                      setShareStep("select");
                    }}
                  >
                    {isEn ? "Close" : "閉じる"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className={styles.hiddenCanvas}
        width={FORMATS.reel.canvasW}
        height={FORMATS.reel.canvasH}
        aria-hidden="true"
      />
    </div>
  );
}

export default PolaroidModal;
