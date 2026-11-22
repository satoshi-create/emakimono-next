import { useCallback, useRef, useState } from "react";
import { trackPolaroidExportSuccess } from "@/libs/api/measurementUtils";
import QRCode from "qrcode";
import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";
import { recordEmakiLoopVideo } from "@/utils/emakiVideoRecorder";
import {
  FORMATS,
  THEMES,
  renderPolaroidCanvas,
} from "./polaroidCanvasRenderer";
import { loadCrossOriginImage } from "./usePolaroidPanZoom";

export function usePolaroidExport({
  scenes = [],
  selectedIndex = 0,
  src,
  loadedImagesRef,
  pan,
  zoom,
  coverScale,
  currentTheme,
  layoutMode = "polaroid",
  displayTitle,
  displayChapter,
  message,
  isEn,
  canShareFiles,
  scrollId,
}) {
  const [copiedStep, setCopiedStep] = useState(null); // null | "image" | "text"
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState("share"); // "share" | "save"
  const [shareStep, setShareStep] = useState("select"); // "select" | "textCopy"
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const canvasRef = useRef(null);

  const resetExportStates = useCallback(() => {
    setCopiedStep(null);
    setFeedbackMessage(null);
    setIsRecording(false);
    setRecordingProgress(0);
    setIsShareSheetOpen(false);
    setShareStep("select");
    setSheetMode("share");
  }, []);

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
  }, [scenes, selectedIndex, src, loadedImagesRef]);

  const drawPhoto = useCallback(
    (ctx, faviconImg, qrImg, sceneUrlText, format = "polaroid") => {
      renderPolaroidCanvas({
        ctx,
        loadedImages: loadedImagesRef.current,
        pan,
        zoom,
        coverScale,
        currentTheme,
        layoutMode,
        displayTitle,
        displayChapter,
        message,
        faviconImg,
        qrImg,
        sceneUrlText,
        format,
        isEn,
      });
    },
    [
      loadedImagesRef,
      pan,
      zoom,
      coverScale,
      currentTheme,
      layoutMode,
      displayTitle,
      displayChapter,
      message,
      isEn,
    ]
  );

  const getShareTextPayload = useCallback(() => {
    const cleanTitle = typeof displayChapter === "string" ? displayChapter.trim() : "";
    const cleanEmaki = typeof displayTitle === "string" ? displayTitle.trim() : "";
    const chapter = cleanTitle ? (isEn ? `[${cleanTitle}]` : `【${cleanTitle}】`) : "";
    const mainTitle = cleanEmaki ? (isEn ? `"${cleanEmaki}"` : `『${cleanEmaki}』`) : "";
    const titleLines = [chapter, mainTitle].filter(Boolean).join("\n");
    const cleanMsg = typeof message === "string" ? message.trim() : "";
    const customLine = cleanMsg ? cleanMsg : "";
    const tags = isEn ? "#EmakiViewer #JapaneseArt" : "#絵巻物ビューアー #日本美術";
    let url = typeof window !== "undefined" ? window.location.href : "";
    if (url && !isEn) {
      try {
        const parsed = new URL(url);
        if (!parsed.pathname.startsWith("/ja/") && parsed.pathname !== "/ja") {
          parsed.pathname = `/ja${parsed.pathname === "/" ? "" : parsed.pathname}`;
          url = parsed.toString();
        }
      } catch {
        // noop
      }
    }

    return [titleLines, customLine, tags, url]
      .filter((line) => line !== "")
      .join("\n\n");
  }, [displayTitle, displayChapter, message, isEn]);

  const handleDownload = useCallback(
    async (format = "polaroid") => {
      const isFanLayout = layoutMode === "senmen" || currentTheme === "senmen";
      const resolvedFormat =
        isFanLayout && format === "polaroid" ? "senmen" : format;
      const fmt = FORMATS[resolvedFormat] || FORMATS.polaroid;
      const img = await ensureLoadedForExport();
      if (!img) return;

      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = fmt.canvasW;
      canvas.height = fmt.canvasH;
      if (!canvasRef.current) canvasRef.current = canvas;

      const activeTheme = THEMES[currentTheme] || THEMES.white;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = activeTheme.cardBg || activeTheme.bg;
      ctx.fillRect(0, 0, fmt.canvasW, fmt.canvasH);

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

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) {
        setFeedbackMessage(isEn ? "Failed to generate image." : "画像の生成に失敗しました。");
        return;
      }

      const fileName = `emakimono-${format}-${Date.now()}.png`;
      const isTouchDevice =
        typeof window !== "undefined" &&
        (window.matchMedia?.("(pointer: coarse)")?.matches || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

      // モバイル・タブレットでファイル共有APIが使える場合はシステム共有シート（写真に保存含む）を優先
      if (isTouchDevice && typeof navigator !== "undefined" && typeof navigator.share === "function") {
        const file = new File([blob], fileName, { type: "image/png" });
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: "Emakimono Polaroid" });
            trackPolaroidExportSuccess({
              exportType: format === "reel" ? "reel" : "polaroid",
              scrollId: typeof scrollId === "string" ? scrollId : "",
              hasMessage: Boolean(message && message.trim()),
            });
            return;
          } catch (err) {
            if (err?.name === "AbortError") return;
            // 共有失敗時は下のBlobダウンロードへフォールバック
          }
        }
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = fileName;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      trackPolaroidExportSuccess({
        exportType: format === "reel" ? "reel" : "polaroid",
        scrollId: typeof scrollId === "string" ? scrollId : "",
        hasMessage: Boolean(message && message.trim()),
      });
    },
    [drawPhoto, ensureLoadedForExport, currentTheme, isEn, message, scrollId]
  );

  const handleShareCopy = useCallback(
    async (type = "x") => {
      try {
        const isReel = type === "reel";
        const format = isReel ? "reel" : "polaroid";
        const isFanLayout = layoutMode === "senmen" || currentTheme === "senmen";
        const resolvedFormat =
          isFanLayout && format === "polaroid" ? "senmen" : format;
        const img = await ensureLoadedForExport();
        if (!img) {
          setFeedbackMessage(isEn ? "Failed to load image." : "画像の読み込みに失敗しました。");
          return;
        }
        const copyFmt = FORMATS[resolvedFormat] || FORMATS.polaroid;
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

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        if (!blob) {
          setFeedbackMessage(isEn ? "Failed to generate image." : "画像の生成に失敗しました。");
          return;
        }

        const isTouchDevice =
          typeof window !== "undefined" &&
          (window.matchMedia?.("(pointer: coarse)")?.matches || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

        // モバイル・タブレットではClipboardItemがユーザージェスチャ失効で失敗しやすいためWeb Share APIを使用
        if (isTouchDevice && typeof navigator !== "undefined" && typeof navigator.share === "function") {
          const fileName = `emakimono-${format}-${Date.now()}.png`;
          const file = new File([blob], fileName, { type: "image/png" });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({ files: [file], title: "Emakimono Polaroid" });
              setIsShareSheetOpen(false);
              trackPolaroidExportSuccess({
                exportType: isReel ? "reel_copy" : "x_copy",
                scrollId: typeof scrollId === "string" ? scrollId : "",
                hasMessage: Boolean(message && message.trim()),
              });
              return;
            } catch (err) {
              if (err?.name === "AbortError") return;
            }
          }
        }

        if (!navigator.clipboard || !window.ClipboardItem) {
          setFeedbackMessage(
            isEn
              ? "Clipboard copy is not supported on this device. Please use Save."
              : "この端末では画像コピーに非対応です。「保存」をご利用ください。"
          );
          return;
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          if (isReel) {
            setIsShareSheetOpen(false);
            setFeedbackMessage(
              isEn ? "Reels image (9:16) copied to clipboard!" : "リール用画像(9:16)をコピーしました"
            );
            trackPolaroidExportSuccess({
              exportType: "reel_copy",
              scrollId: typeof scrollId === "string" ? scrollId : "",
              hasMessage: Boolean(message && message.trim()),
            });
          } else {
            setShareStep("textCopy");
            trackPolaroidExportSuccess({
              exportType: "x_copy",
              scrollId: typeof scrollId === "string" ? scrollId : "",
              hasMessage: Boolean(message && message.trim()),
            });
          }
        } catch (err) {
          console.error("Clipboard copy failed:", err);
          setFeedbackMessage(
            isEn ? "Failed to copy image. Please use Save." : "画像のコピーに失敗しました。「保存」をお試しください。"
          );
        }
      } catch (error) {
        console.error("Failed to generate share content:", error);
      }
    },
    [currentTheme, drawPhoto, ensureLoadedForExport, isEn, message, scrollId]
  );

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

      trackPolaroidExportSuccess({
        exportType: "video",
        scrollId: typeof scrollId === "string" ? scrollId : "",
        hasMessage: Boolean(message && message.trim()),
      });
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
    scrollId,
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

      if (canShareFiles && navigator.canShare && navigator.canShare({ files: [videoFile] })) {
        try {
          await navigator.share({
            files: [videoFile],
            title: displayTitle,
            text: getShareTextPayload ? getShareTextPayload() : `${displayTitle} | 絵巻物ビューアー`,
          });
          sharedViaApi = true;
          setIsShareSheetOpen(false);

          trackPolaroidExportSuccess({
            exportType: "video",
            scrollId: typeof scrollId === "string" ? scrollId : "",
            hasMessage: Boolean(message && message.trim()),
          });
        } catch (shareErr) {
          if (shareErr.name === "AbortError") return;
          console.warn("navigator.share failed, fallback to download + copy:", shareErr);
        }
      }

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
    canShareFiles,
    isEn,
    scrollId,
  ]);

  return {
    copiedStep,
    setCopiedStep,
    feedbackMessage,
    setFeedbackMessage,
    isShareSheetOpen,
    setIsShareSheetOpen,
    sheetMode,
    setSheetMode,
    shareStep,
    setShareStep,
    isRecording,
    recordingProgress,
    canvasRef,
    resetExportStates,
    getShareTextPayload,
    handleDownload,
    handleShareCopy,
    handleGenerateVideo,
    handleShareVideo,
  };
}
