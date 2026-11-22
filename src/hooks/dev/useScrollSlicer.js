import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildIntervalsAspect,
  buildIntervalsCount,
  buildIntervalsCustom,
  orderIntervalsForRtl,
  sliceRawImagesToFiles,
} from "@/lib/dev/uploadScroll/sliceGeometry";

// === 1. スライス UI 状態 ===
// パネル開閉・アスペクト・オーバーラップ・RTL・モード・枚数・カスタム cut

export function useScrollSlicer({ yamlScrollId, imageItems, setImageItems }) {
  const [slicePanelOpen, setSlicePanelOpen] = useState(true);
  const [sliceAspectRatio, setSliceAspectRatio] = useState(1.5);
  const [overlapPercent, setOverlapPercent] = useState(0);
  const [sharpenPercent, setSharpenPercent] = useState(25);
  const [isRtlSlice, setIsRtlSlice] = useState(true);
  const [sliceGenMessage, setSliceGenMessage] = useState("");
  const [isSlicing, setIsSlicing] = useState(false);
  const [isRawSliceDragging, setIsRawSliceDragging] = useState(false);
  const rawSliceInputRef = useRef(null);
  const rawSliceDragCounterRef = useRef(0);
  const [rawSliceSourceFiles, setRawSliceSourceFiles] = useState([]);
  const [sliceMode, setSliceMode] = useState("aspect");
  const [sliceCount, setSliceCount] = useState(6);
  const [customCuts, setCustomCuts] = useState([]);
  const [rawSlicePreviews, setRawSlicePreviews] = useState([]);
  const [rawSlicePreviewUrl, setRawSlicePreviewUrl] = useState("");
  const [rawSliceNaturalSize, setRawSliceNaturalSize] = useState(null);
  const [customDragCutIndex, setCustomDragCutIndex] = useState(null);
  const rawSlicePreviewRef = useRef(null);

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

  const previewBoundaryRatios = useMemo(() => {
    const pts = new Set();
    previewIntervals.forEach(([s, e]) => {
      if (s > 0.0001) pts.add(s);
      if (e < 0.9999) pts.add(e);
    });
    return [...pts].sort((a, b) => a - b);
  }, [previewIntervals]);

  // === 4. カスタム cut 操作ハンドラ ===

  const addCustomCutAtRatio = useCallback((ratio) => {
    const r = Math.max(0.01, Math.min(0.99, ratio));
    setCustomCuts((prev) => {
      if (prev.some((c) => Math.abs(c - r) < 0.01)) return prev;
      return [...prev, r].sort((a, b) => a - b);
    });
  }, []);

  const initCustomCutsFromCount = useCallback(() => {
    const N = Math.max(2, Math.floor(sliceCount));
    const cuts = [];
    for (let i = 1; i < N; i += 1) cuts.push(i / N);
    setCustomCuts(cuts);
  }, [sliceCount]);

  const updateCustomCutRatio = useCallback((cutIndex, ratio) => {
    const r = Math.max(0.01, Math.min(0.99, ratio));
    setCustomCuts((prev) => prev.map((c, i) => (i === cutIndex ? r : c)));
  }, []);

  const removeCustomCutAt = useCallback((cutIndex) => {
    setCustomCuts((prev) => prev.filter((_, i) => i !== cutIndex));
  }, []);

  const handleRawSlicePreviewPointerMove = useCallback(
    (e) => {
      if (customDragCutIndex == null || !rawSlicePreviewRef.current) return;
      const rect = rawSlicePreviewRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = (e.clientX - rect.left) / rect.width;
      updateCustomCutRatio(customDragCutIndex, ratio);
    },
    [customDragCutIndex, updateCustomCutRatio]
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
    if (sliceMode === "custom" && customCuts.length === 0) {
      setSliceGenMessage("自由区切りモードでは区切り線を1本以上指定してください");
      return;
    }
    setIsSlicing(true);
    setSliceGenMessage("");
    try {
      const scrollId = yamlScrollId.trim() || "scroll";
      const generated = await sliceRawImagesToFiles(rawSliceSourceFiles, {
        sliceAspectRatio,
        overlapPercent,
        sharpenPercent,
        isRtlSlice,
        scrollId,
        startIndex: imageItems.length,
        sliceMode,
        sliceCount,
        customCuts,
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
      setSliceGenMessage(
        `生成 ${generated.length} 枚を連番リストに追加（合計 ${total} 枚）。scenes[].range の目安: [1, ${total}]`
      );
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
    yamlScrollId,
    imageItems.length,
    sliceMode,
    sliceCount,
    customCuts,
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
    setCustomCuts,
    rawSlicePreviews,
    rawSlicePreviewUrl,
    rawSliceNaturalSize,
    customDragCutIndex,
    setCustomDragCutIndex,
    rawSlicePreviewRef,
    previewIntervals,
    previewBoundaryRatios,
    addCustomCutAtRatio,
    initCustomCutsFromCount,
    updateCustomCutRatio,
    removeCustomCutAt,
    handleRawSlicePreviewPointerMove,
    addRawSliceSources,
    runAutoSlice,
  };
}