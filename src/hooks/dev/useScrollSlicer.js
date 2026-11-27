import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildIntervalsAspect,
  buildIntervalsCount,
  buildIntervalsCustom,
  orderIntervalsForRtl,
  ratioFromPointerOnElement,
  resolveUnifiedBatchTargetHeight,
  sliceRawImagesToFiles,
} from "@/libs/dev/uploadScroll/sliceGeometry";
import { tDevUpload } from "@/libs/dev/uploadScroll/devUploadMessages";

// === 1. スライス UI 状態 ===
// パネル開閉・アスペクト・オーバーラップ・RTL・モード・枚数・カスタム cut

export function useScrollSlicer({ yamlScrollId, imageItems, setImageItems }) {
  const [slicePanelOpen, setSlicePanelOpen] = useState(true);
  const [sliceAspectRatio, setSliceAspectRatio] = useState(1.5);
  const [overlapPercent, setOverlapPercent] = useState(0);
  const [sharpenPercent, setSharpenPercent] = useState(25);
  const [isRtlSlice, setIsRtlSlice] = useState(true);
  const [isHighResSlice, setIsHighResSlice] = useState(false);
  const [sliceGenMessage, setSliceGenMessage] = useState("");
  const [isSlicing, setIsSlicing] = useState(false);
  const [isRawSliceDragging, setIsRawSliceDragging] = useState(false);
  const rawSliceInputRef = useRef(null);
  const rawSliceDragCounterRef = useRef(0);
  const [rawSliceSourceFiles, setRawSliceSourceFiles] = useState([]);
  const [sliceMode, setSliceMode] = useState("aspect");
  const [sliceCount, setSliceCount] = useState(6);
  const [customCutsByFile, setCustomCutsByFile] = useState({});
  const customCuts = useMemo(() => customCutsByFile[0] || [], [customCutsByFile]);
  const [rawSlicePreviews, setRawSlicePreviews] = useState([]);
  const [rawSlicePreviewUrl, setRawSlicePreviewUrl] = useState("");
  const [rawSliceNaturalSize, setRawSliceNaturalSize] = useState(null);
  const [customDragState, setCustomDragState] = useState(null);
  const customDragCutIndex = customDragState?.cutIndex ?? null;
  const setCustomDragCutIndex = useCallback((cutIndex) => {
    setCustomDragState(cutIndex == null ? null : { fileIndex: 0, cutIndex });
  }, []);
  const rawSlicePreviewRef = useRef(null);
  const rawSlicePreviewRefs = useRef({});
  const [previewFitMode, setPreviewFitMode] = useState("scroll");
  const [previewHeight, setPreviewHeight] = useState(280);

  // === 2. 長尺プレビュー URL（createObjectURL / revoke） ===
  // 全元画像の naturalSize を取得しプレビュー用 blob URL 配列を維持する

  useEffect(() => {
    if (!rawSliceSourceFiles || rawSliceSourceFiles.length === 0) {
      setRawSlicePreviews([]);
      setRawSlicePreviewUrl("");
      setRawSliceNaturalSize(null);
      return undefined;
    }

    let cancelled = false;
    const entries = rawSliceSourceFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setRawSlicePreviewUrl(entries[0].url);
    setRawSlicePreviews(
      entries.map((entry) => ({
        name: entry.file.name,
        url: entry.url,
        width: 0,
        height: 0,
      })),
    );

    entries.forEach((entry, index) => {
      const probe = new Image();
      probe.onload = () => {
        if (cancelled) return;
        const size = { width: probe.naturalWidth, height: probe.naturalHeight };
        if (index === 0) {
          setRawSliceNaturalSize(size);
        }
        setRawSlicePreviews((prev) =>
          prev.map((item, i) => (i === index ? { ...item, ...size } : item)),
        );
      };
      probe.src = entry.url;
    });

    return () => {
      cancelled = true;
      entries.forEach((entry) => URL.revokeObjectURL(entry.url));
    };
  }, [rawSliceSourceFiles]);

  // === 3. 区間プレビュー（モード別 interval + RTL 並べ替え） ===

  const previewIntervals = useMemo(() => {
    if (!rawSliceNaturalSize) return [];
    const { width, height } = rawSliceNaturalSize;
    let intervals;
    if (sliceMode === "count") {
      intervals = buildIntervalsCount(sliceCount, overlapPercent);
    } else if (sliceMode === "custom") {
      intervals = buildIntervalsCustom(customCuts);
    } else {
      intervals = buildIntervalsAspect(width, height, sliceAspectRatio, overlapPercent);
    }
    return orderIntervalsForRtl(intervals, isRtlSlice);
  }, [
    sliceMode,
    sliceCount,
    customCuts,
    sliceAspectRatio,
    overlapPercent,
    isRtlSlice,
    rawSliceNaturalSize,
  ]);

  const batchOutputTargetHeight = useMemo(() => {
    const sizes = rawSlicePreviews.filter((p) => p.width > 0 && p.height > 0);
    if (sizes.length === 0) return null;
    return resolveUnifiedBatchTargetHeight(
      sizes.map((p) => ({ width: p.width, height: p.height })),
      isHighResSlice
    );
  }, [rawSlicePreviews, isHighResSlice]);

  const previewBoundaryRatios = useMemo(() => {
    const pts = new Set();
    previewIntervals.forEach(([s, e]) => {
      if (s > 0.0001) pts.add(s);
      if (e < 0.9999) pts.add(e);
    });
    return [...pts].sort((a, b) => a - b);
  }, [previewIntervals]);

  // === 4. カスタム cut 操作ハンドラ ===

  const setRawSlicePreviewRef = useCallback((fileIndex, el) => {
    if (el) {
      rawSlicePreviewRefs.current[fileIndex] = el;
      if (fileIndex === 0) rawSlicePreviewRef.current = el;
    } else {
      delete rawSlicePreviewRefs.current[fileIndex];
      if (fileIndex === 0) rawSlicePreviewRef.current = null;
    }
  }, []);

  const addCustomCutAtRatio = useCallback((ratio, fileIndex = 0) => {
    const r = Math.max(0.01, Math.min(0.99, ratio));
    setCustomCutsByFile((prev) => {
      const cuts = prev[fileIndex] || [];
      if (cuts.some((c) => Math.abs(c - r) < 0.01)) return prev;
      return { ...prev, [fileIndex]: [...cuts, r].sort((a, b) => a - b) };
    });
  }, []);

  const initCustomCutsFromCount = useCallback(
    (fileIndex) => {
      const N = Math.max(2, Math.floor(sliceCount));
      const cuts = [];
      for (let i = 1; i < N; i += 1) cuts.push(i / N);
      setCustomCutsByFile((prev) => {
        const next = { ...prev };
        if (fileIndex === undefined || fileIndex === null) {
          rawSliceSourceFiles.forEach((_, idx) => {
            next[idx] = cuts;
          });
          return next;
        }
        next[fileIndex] = cuts;
        return next;
      });
    },
    [sliceCount, rawSliceSourceFiles]
  );

  const updateCustomCutRatio = useCallback((cutIndex, ratio, fileIndex = 0) => {
    const r = Math.max(0.01, Math.min(0.99, ratio));
    setCustomCutsByFile((prev) => {
      const cuts = prev[fileIndex] || [];
      return {
        ...prev,
        [fileIndex]: cuts.map((c, i) => (i === cutIndex ? r : c)),
      };
    });
  }, []);

  const removeCustomCutAt = useCallback((cutIndex, fileIndex = 0) => {
    setCustomCutsByFile((prev) => {
      const cuts = prev[fileIndex] || [];
      return { ...prev, [fileIndex]: cuts.filter((_, i) => i !== cutIndex) };
    });
  }, []);

  const sortCustomCutsForFile = useCallback((fileIndex = 0) => {
    setCustomCutsByFile((prev) => {
      const cuts = prev[fileIndex];
      if (!cuts?.length) return prev;
      return { ...prev, [fileIndex]: [...cuts].sort((a, b) => a - b) };
    });
  }, []);

  const clearAllCustomCuts = useCallback(() => {
    setCustomCutsByFile({});
  }, []);

  const resolveCutRatioAtClientX = useCallback((clientX, fileIndex = 0) => {
    const el =
      rawSlicePreviewRefs.current[fileIndex] ??
      (fileIndex === 0 ? rawSlicePreviewRef.current : null);
    return ratioFromPointerOnElement(clientX, el);
  }, []);

  const handleRawSlicePreviewPointerMove = useCallback(
    (e, fileIndex = 0) => {
      if (!customDragState || customDragState.fileIndex !== fileIndex) return;
      const el =
        rawSlicePreviewRefs.current[fileIndex] ??
        (fileIndex === 0 ? rawSlicePreviewRef.current : null);
      const ratio = ratioFromPointerOnElement(e.clientX, el);
      if (ratio == null) return;
      updateCustomCutRatio(customDragState.cutIndex, ratio, fileIndex);
    },
    [customDragState, updateCustomCutRatio]
  );

  const getPreviewIntervalsForFile = useCallback(
    (fileIndex) => {
      const preview = rawSlicePreviews[fileIndex];
      if (!preview?.width || !preview?.height) return [];
      const { width, height } = preview;
      const cuts = customCutsByFile[fileIndex] || [];
      let intervals;
      if (sliceMode === "count") {
        intervals = buildIntervalsCount(sliceCount, overlapPercent);
      } else if (sliceMode === "custom") {
        intervals = buildIntervalsCustom(cuts);
      } else {
        intervals = buildIntervalsAspect(width, height, sliceAspectRatio, overlapPercent);
      }
      return orderIntervalsForRtl(intervals, isRtlSlice);
    },
    [
      rawSlicePreviews,
      customCutsByFile,
      sliceMode,
      sliceCount,
      overlapPercent,
      sliceAspectRatio,
      isRtlSlice,
    ]
  );

  const getPreviewBoundaryRatiosForFile = useCallback(
    (fileIndex) => {
      const intervals = getPreviewIntervalsForFile(fileIndex);
      const pts = new Set();
      intervals.forEach(([s, e]) => {
        if (s > 0.0001) pts.add(s);
        if (e < 0.9999) pts.add(e);
      });
      return [...pts].sort((a, b) => a - b);
    },
    [getPreviewIntervalsForFile]
  );

  // === 5. 元画像追加と自動スライス実行 ===
  // Canvas 切り出し結果を連番 imageItems へマージする

  const addRawSliceSources = useCallback((fileList) => {
    const picked = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (picked.length === 0) return;
    setRawSliceSourceFiles((prev) => [...prev, ...picked]);
  }, []);

  const runAutoSlice = useCallback(async () => {
    if (rawSliceSourceFiles.length === 0) {
      setSliceGenMessage("元画像を選択してください");
      return;
    }
    if (sliceMode === "custom") {
      const missingIdx = rawSliceSourceFiles.findIndex(
        (_, i) => (customCutsByFile[i] || []).length === 0
      );
      if (missingIdx >= 0) {
        setSliceGenMessage(
          `自由区切り: 画像 #${missingIdx + 1} に区切り線を1本以上指定してください`
        );
        return;
      }
    }
    setIsSlicing(true);
    setSliceGenMessage("");
    try {
      const scrollId = yamlScrollId.trim() || "scroll";
      const sliceWarnings = [];
      const generated = await sliceRawImagesToFiles(rawSliceSourceFiles, {
        sliceAspectRatio,
        overlapPercent,
        sharpenPercent,
        isRtlSlice,
        highResMode: isHighResSlice,
        scrollId,
        startIndex: imageItems.length,
        sliceMode,
        sliceCount,
        customCuts,
        customCutsByFile,
        sliceWarnings,
      });
      if (generated.length === 0) {
        setSliceGenMessage("スライスを生成できませんでした");
        return;
      }
      const next = generated.map((file) => ({
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      }));
      const total = imageItems.length + generated.length;
      setImageItems((prev) => [...prev, ...next]);
      let msg = `生成 ${generated.length} 枚を連番リストに追加（合計 ${total} 枚、出力高さ ${batchOutputTargetHeight ?? "—"}px）。scenes[].range の目安: [1, ${total}]`;
      if (sliceWarnings.length > 0) {
        const wideDetail = sliceWarnings
          .slice(0, 5)
          .map((w) =>
            tDevUpload("sliceWideItem")
              .replace("{index}", String(w.sliceIndex))
              .replace("{outputWidth}", String(w.outputWidth))
          )
          .join(" / ");
        msg += ` ${tDevUpload("sliceWideBatchHint")} (${wideDetail})`;
      }
      setSliceGenMessage(msg);
    } catch (err) {
      setSliceGenMessage(err?.message || "スライス生成に失敗しました");
    } finally {
      setIsSlicing(false);
    }
  }, [
    rawSliceSourceFiles,
    sliceAspectRatio,
    overlapPercent,
    sharpenPercent,
    isRtlSlice,
    isHighResSlice,
    yamlScrollId,
    imageItems.length,
    sliceMode,
    sliceCount,
    customCuts,
    customCutsByFile,
    batchOutputTargetHeight,
    setImageItems,
  ]);

  return {
    slicePanelOpen,
    setSlicePanelOpen,
    sliceAspectRatio,
    setSliceAspectRatio,
    overlapPercent,
    setOverlapPercent,
    sharpenPercent,
    setSharpenPercent,
    isRtlSlice,
    setIsRtlSlice,
    isHighResSlice,
    setIsHighResSlice,
    sliceGenMessage,
    setSliceGenMessage,
    isSlicing,
    isRawSliceDragging,
    setIsRawSliceDragging,
    rawSliceInputRef,
    rawSliceDragCounterRef,
    rawSliceSourceFiles,
    setRawSliceSourceFiles,
    sliceMode,
    setSliceMode,
    sliceCount,
    setSliceCount,
    customCuts,
    customCutsByFile,
    setCustomCutsByFile,
    clearAllCustomCuts,
    sortCustomCutsForFile,
    rawSlicePreviews,
    rawSlicePreviewUrl,
    rawSliceNaturalSize,
    customDragState,
    setCustomDragState,
    customDragCutIndex,
    setCustomDragCutIndex,
    rawSlicePreviewRef,
    setRawSlicePreviewRef,
    previewIntervals,
    previewBoundaryRatios,
    getPreviewIntervalsForFile,
    getPreviewBoundaryRatiosForFile,
    addCustomCutAtRatio,
    initCustomCutsFromCount,
    updateCustomCutRatio,
    removeCustomCutAt,
    handleRawSlicePreviewPointerMove,
    resolveCutRatioAtClientX,
    previewFitMode,
    setPreviewFitMode,
    previewHeight,
    setPreviewHeight,
    batchOutputTargetHeight,
    addRawSliceSources,
    runAutoSlice,
  };
}