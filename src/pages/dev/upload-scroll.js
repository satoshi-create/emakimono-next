import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function extFromFile(file) {
  const name = file.name || "";
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  if (m) return m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function loadImageElementFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`画像の読み込みに失敗しました: ${file.name}`));
    };
    img.src = url;
  });
}

function canvasToJpegFile(canvas, fileName) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("JPEG 生成に失敗しました"));
          return;
        }
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  });
}

function computeSlicePositions(naturalWidth, rawSliceWidth, step, isRtlSlice) {
  const maxSx = Math.max(0, naturalWidth - rawSliceWidth);
  const positions = [];
  const narrowRemainder = step > 0 && maxSx > 0 && maxSx % step > 0 && maxSx % step < step * 0.15;

  if (isRtlSlice) {
    let sx = maxSx;
    while (sx >= 0) {
      positions.push(sx);
      if (sx === 0) break;
      const next = sx - step;
      if (next < 0) {
        if (positions[positions.length - 1] !== 0) positions.push(0);
        break;
      }
      if (narrowRemainder && next > 0 && next < step * 0.15) {
        if (positions[positions.length - 1] !== 0) positions.push(0);
        break;
      }
      sx = next;
    }
  } else {
    let sx = 0;
    while (sx <= maxSx) {
      positions.push(sx);
      if (sx === maxSx) break;
      const next = sx + step;
      if (next > maxSx) {
        if (positions[positions.length - 1] !== maxSx) positions.push(maxSx);
        break;
      }
      sx = next;
    }
  }
  return positions;
}

function buildIntervalsAspect(naturalWidth, naturalHeight, sliceAspectRatio, overlapPercent) {
  const rawSliceWidth = Math.round(naturalHeight * sliceAspectRatio);
  const step = Math.max(1, Math.round(rawSliceWidth * (1 - overlapPercent / 100)));
  const positions = computeSlicePositions(naturalWidth, rawSliceWidth, step, false);
  return positions.map((sx) => {
    const sliceW = Math.min(rawSliceWidth, naturalWidth - sx);
    const startRatio = sx / naturalWidth;
    const endRatio = Math.min(1, (sx + sliceW) / naturalWidth);
    return [startRatio, endRatio];
  });
}

function buildIntervalsCount(sliceCount, overlapPercent) {
  const N = Math.max(1, Math.floor(sliceCount));
  const baseWidth = 1 / N;
  const pad = overlapPercent > 0 ? 0.5 * baseWidth * (overlapPercent / 100) : 0;
  const intervals = [];
  for (let i = 0; i < N; i += 1) {
    const start = Math.max(0, i / N - pad);
    const end = Math.min(1, (i + 1) / N + pad);
    intervals.push([start, end]);
  }
  return intervals;
}

function buildIntervalsCustom(customCuts) {
  const sorted = (customCuts || [])
    .filter((x) => x > 0 && x < 1)
    .sort((a, b) => a - b);
  const bounds = [0, ...sorted, 1];
  const intervals = [];
  for (let i = 0; i < bounds.length - 1; i += 1) {
    intervals.push([bounds[i], bounds[i + 1]]);
  }
  return intervals;
}

function orderIntervalsForRtl(intervals, isRtlSlice) {
  if (isRtlSlice) return [...intervals].reverse();
  return intervals;
}

async function sliceRawImagesToFiles(
  rawFiles,
  {
    sliceAspectRatio,
    overlapPercent,
    isRtlSlice,
    scrollId,
    startIndex = 0,
    sliceMode = "aspect",
    sliceCount = 6,
    customCuts = [],
  }
) {
  const sources = Array.from(rawFiles || []).filter((f) => f.type.startsWith("image/"));
  const out = [];
  let index = startIndex;
  const idPrefix = scrollId || "scroll";

  for (const source of sources) {
    const img = await loadImageElementFromFile(source);
    const targetHeight = Math.min(1080, img.naturalHeight);
    const scale = targetHeight / img.naturalHeight;
    const w = img.naturalWidth;
    let intervals;
    if (sliceMode === "count") {
      intervals = buildIntervalsCount(sliceCount, overlapPercent);
    } else if (sliceMode === "custom") {
      intervals = buildIntervalsCustom(customCuts);
    } else {
      intervals = buildIntervalsAspect(w, img.naturalHeight, sliceAspectRatio, overlapPercent);
    }
    intervals = orderIntervalsForRtl(intervals, isRtlSlice);

    for (const [startRatio, endRatio] of intervals) {
      const sx = Math.round(w * startRatio);
      const sw = Math.max(1, Math.round(w * (endRatio - startRatio)));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(sw * scale);
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas が利用できません");
      ctx.drawImage(img, sx, 0, sw, img.naturalHeight, 0, 0, canvas.width, canvas.height);
      const fileName = `${idPrefix}_${String(index + 1).padStart(2, "0")}-1080.jpg`;
      const file = await canvasToJpegFile(canvas, fileName);
      out.push(file);
      index += 1;
    }
  }
  return out;
}

function extractYamlScalar(yaml, key) {
  const re = new RegExp(`^\\s*${key}:\\s*["']?([^"'\\n#]+)["']?\\s*$`, "m");
  const m = yaml.match(re);
  if (!m) return "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const NG_RESEARCH_WORDS = [
  "AC型",
  "Cモジュール",
  "請求記号",
  "真珠庵系",
  "系譜",
  "モジュール脱落",
  "AC-lineage",
  "C-module",
  "call number",
  "Shinju-an lineage",
];

const ALLOWED_SLOT_TYPES = new Set(["image", "ekotoba"]);

const UPLOAD_RESULT_STORAGE_KEY = "emakimono_dev_last_upload_result";

function formatUploadTimestamp(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("ja-JP");
  } catch {
    return String(ts);
  }
}

function extractYamlNumericId(yaml) {
  const m = yaml.match(/^metadata:[\s\S]*?^\s*id:\s*(\d+)/m);
  if (m) return parseInt(m[1], 10);
  const m2 = yaml.match(/^\s*id:\s*(\d+)\s*$/m);
  return m2 ? parseInt(m2[1], 10) : null;
}

function extractMaxRangeEnd(yaml) {
  let max = 0;
  const re = /range:\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]/g;
  let m;
  while ((m = re.exec(yaml))) {
    const end = parseInt(m[2], 10);
    if (Number.isFinite(end) && end > max) max = end;
  }
  return max;
}

/** @returns {{ errors: string[], warnings: string[], overwriteMode: boolean }} */
function validateScrollYaml(yaml, { existingScrolls = [], imageCount = 0, yamlTitleen = "" } = {}) {
  const errors = [];
  const warnings = [];
  const trimmed = (yaml || "").trim();
  if (!trimmed) return { errors, warnings, overwriteMode: false };

  const required = [
    ["scroll_id", /^scroll_id:/m],
    ["volume_num", /^volume_num:/m],
    ["folder", /^folder:/m],
    ["metadata", /^metadata:/m],
    ["id", /^\s*id:/m],
    ["title", /^\s*title:/m],
    ["titleen", /^\s*titleen:/m],
    ["desc", /^\s*desc:/m],
    ["descen", /^\s*descen:/m],
    ["scenes", /^scenes:/m],
    ["range", /^\s*range:/m],
  ];
  for (const [label, pattern] of required) {
    if (!pattern.test(trimmed)) errors.push(`必須キーがありません: ${label}`);
  }

  if (trimmed.includes("\t")) {
    warnings.push("YAML にタブ文字が含まれています（インデントはスペースのみ推奨）");
  }

  for (const word of NG_RESEARCH_WORDS) {
    if (trimmed.includes(word)) errors.push(`研究用語 NG ワード: 「${word}」`);
  }

  const slotRe = /slot_types:\s*\[([^\]]+)\]/g;
  let sm;
  while ((sm = slotRe.exec(trimmed))) {
    const tokens = sm[1]
      .split(",")
      .map((t) => t.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    for (const token of tokens) {
      if (!ALLOWED_SLOT_TYPES.has(token)) {
        errors.push(`不正な slot_types: 「${token}」（許可: image, ekotoba）`);
      }
    }
  }

  const yamlId = extractYamlNumericId(trimmed);
  const titleen = yamlTitleen || extractYamlScalar(trimmed, "titleen");
  let overwriteMode = false;
  if (yamlId != null && existingScrolls.length > 0) {
    const conflict = existingScrolls.find(
      (s) => Number(s.id) === yamlId && String(s.titleen || "") !== String(titleen || "")
    );
    if (conflict) {
      errors.push(
        `id ${yamlId} は既存「${conflict.titleen || conflict.title || "?"}」で使用中です`
      );
    }
  }
  if (titleen) {
    const same = existingScrolls.find((s) => String(s.titleen) === String(titleen));
    if (same) overwriteMode = true;
  }

  const maxRangeEnd = extractMaxRangeEnd(trimmed);
  if (maxRangeEnd > 0 && imageCount > 0 && maxRangeEnd !== imageCount) {
    warnings.push(
      `画像枚数（${imageCount}）と scenes の range 最大終端（${maxRangeEnd}）が一致しません`
    );
  }

  const scenesHead = trimmed.match(/^scenes:\s*([\s\S]*)/m);
  if (scenesHead) {
    const scenesOnly = scenesHead[1].split(/\n(?=^[a-z][\w]*:)/)[0];
    const sceneIdRe = /^\s*(?:-\s*)?id:\s*["']?([^"'\s#]+)["']?/gm;
    let sceneIdMatch;
    while ((sceneIdMatch = sceneIdRe.exec(scenesOnly))) {
      const sceneId = sceneIdMatch[1].trim();
      if (!/^\d+$/.test(sceneId)) {
        errors.push(`scenes の id は整数のみ（sync_scroll 互換）: 「${sceneId}」`);
      }
    }
  }

  return { errors, warnings, overwriteMode };
}

const ui = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    color: "#0f172a",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontSize: 15,
    lineHeight: 1.5,
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "24px",
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "20px",
    background: "#fff",
  },
  h1: { margin: 0, fontSize: 24, fontWeight: 700, color: "#1e3a5f" },
  h2: { margin: 0, fontSize: 18, fontWeight: 600, color: "#334155" },
  subtitle: { margin: "8px 0 0", fontSize: 14, color: "#64748b" },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "1px solid #e2e8f0",
  },
  rowBetween: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  badgeRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  badge: {
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 6,
    background: "#e0f2fe",
    color: "#0369a1",
    fontFamily: "monospace",
  },
  badgeMuted: {
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: 6,
    background: "#f1f5f9",
    color: "#64748b",
    fontFamily: "monospace",
  },
  note: { margin: "0 0 16px", fontSize: 13, color: "#64748b", lineHeight: 1.6 },
  btnPrimary: {
    background: "#1e3a5f",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnSecondary: {
    background: "#fff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  btnSmall: {
    background: "#e2e8f0",
    color: "#334155",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: 11,
    cursor: "pointer",
  },
  btnDanger: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: 11,
    cursor: "pointer",
  },
  actions: { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  logPanel: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "20px",
    background: "#fff",
    fontSize: 14,
  },
  pre: {
    maxHeight: 256,
    overflow: "auto",
    borderRadius: "6px",
    background: "#0f172a",
    color: "#e2e8f0",
    padding: 12,
    fontSize: 12,
    whiteSpace: "pre-wrap",
    margin: 0,
  },
  preErr: {
    maxHeight: 256,
    overflow: "auto",
    borderRadius: "6px",
    background: "#422006",
    color: "#fde68a",
    padding: 12,
    fontSize: 12,
    whiteSpace: "pre-wrap",
    margin: 0,
  },
  yamlEditor: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "12px",
    width: "100%",
    boxSizing: "border-box",
    fontSize: 13,
    minHeight: 280,
    resize: "vertical",
    background: "#fff",
    color: "#0f172a",
    fontFamily: "monospace",
    lineHeight: 1.45,
  },
  backLink: {
    display: "inline-block",
    marginBottom: 12,
    fontSize: 14,
    color: "#2563eb",
    textDecoration: "underline",
  },
};

function dropZoneStyle(isDragging) {
  return {
    border: isDragging ? "2px dashed #3b82f6" : "2px dashed #94a3b8",
    background: isDragging ? "#eff6ff" : "#f8fafc",
    borderRadius: "8px",
    minHeight: 120,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "32px 16px",
    marginBottom: 16,
    cursor: "pointer",
  };
}

function thumbGridStyle(rtlPreview) {
  return {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    flexDirection: rtlPreview ? "row-reverse" : "row",
    justifyContent: rtlPreview ? "flex-end" : "flex-start",
  };
}

function DevUploadScrollPage() {
  const [rawYaml, setRawYaml] = useState("");
  const [yamlFileName, setYamlFileName] = useState("");

  const [scrollTemplates, setScrollTemplates] = useState([]);
  const [existingScrolls, setExistingScrolls] = useState([]);
  const [nextAvailableId, setNextAvailableId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [existingImageCount, setExistingImageCount] = useState(0);

  const [imageItems, setImageItems] = useState([]);
  const [rtlPreview, setRtlPreview] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultLog, setResultLog] = useState(null);
  const [lastSuccessResult, setLastSuccessResult] = useState(null);
  const [urlCopyMessage, setUrlCopyMessage] = useState("");

  const yamlFileInputRef = useRef(null);
  const yamlDragCounterRef = useRef(0);
  const [isYamlDragging, setIsYamlDragging] = useState(false);

  const fileInputRef = useRef(null);
  const imageDragCounterRef = useRef(0);
  const [isImageDragging, setIsImageDragging] = useState(false);

  const [slicePanelOpen, setSlicePanelOpen] = useState(false);
  const [sliceAspectRatio, setSliceAspectRatio] = useState(1.5);
  const [overlapPercent, setOverlapPercent] = useState(0);
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
  const [rawSlicePreviewUrl, setRawSlicePreviewUrl] = useState("");
  const [rawSliceNaturalSize, setRawSliceNaturalSize] = useState(null);
  const [customDragCutIndex, setCustomDragCutIndex] = useState(null);
  const rawSlicePreviewRef = useRef(null);

  useEffect(() => {
    const file = rawSliceSourceFiles[0];
    if (!file) {
      setRawSlicePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
      setRawSliceNaturalSize(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setRawSlicePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    const probe = new Image();
    probe.onload = () => {
      setRawSliceNaturalSize({ width: probe.naturalWidth, height: probe.naturalHeight });
    };
    probe.src = url;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [rawSliceSourceFiles]);

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

  const yamlScrollId = useMemo(() => extractYamlScalar(rawYaml, "scroll_id"), [rawYaml]);
  const yamlTitleen = useMemo(() => extractYamlScalar(rawYaml, "titleen"), [rawYaml]);

  useEffect(() => {
    fetch("/api/dev/scroll-templates")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch failed"))))
      .then((data) => {
        setScrollTemplates(Array.isArray(data.templates) ? data.templates : []);
        setExistingScrolls(Array.isArray(data.existingScrolls) ? data.existingScrolls : []);
        if (data.nextAvailableId != null) setNextAvailableId(data.nextAvailableId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(UPLOAD_RESULT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.ok) setLastSuccessResult(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  const dismissLastSuccessResult = useCallback(() => {
    try {
      sessionStorage.removeItem(UPLOAD_RESULT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setLastSuccessResult(null);
    setUrlCopyMessage("");
  }, []);

  const copyViewerUrl = useCallback(async (url) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopyMessage("コピーしました");
      setTimeout(() => setUrlCopyMessage(""), 2000);
    } catch {
      setUrlCopyMessage("コピーに失敗しました");
    }
  }, []);

  useEffect(() => {
    const sid = yamlScrollId.trim();
    if (!sid || imageItems.length > 0) return;
    fetch(`/api/dev/scroll-templates?id=${encodeURIComponent(sid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.existingImageCount === "number") {
          setExistingImageCount(data.existingImageCount);
        }
      })
      .catch(() => {});
  }, [yamlScrollId, imageItems.length]);

  const effectiveImageCount =
    imageItems.length > 0 ? imageItems.length : existingImageCount;

  const liveValidation = useMemo(
    () =>
      validateScrollYaml(rawYaml, {
        existingScrolls,
        imageCount: effectiveImageCount,
        yamlTitleen,
      }),
    [rawYaml, existingScrolls, effectiveImageCount, yamlTitleen]
  );

  const loadSelectedTemplate = useCallback(() => {
    if (!selectedTemplateId) return;
    const hit = scrollTemplates.find((t) => t.id === selectedTemplateId);
    if (hit?.yaml) {
      setRawYaml(hit.yaml);
      setYamlFileName(`scrolls/${selectedTemplateId}/scroll_config.yaml`);
      setExistingImageCount(0);
      if (selectedTemplateId !== "_template") {
        fetch(`/api/dev/scroll-templates?id=${encodeURIComponent(selectedTemplateId)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data && typeof data.existingImageCount === "number") {
              setExistingImageCount(data.existingImageCount);
            }
          })
          .catch(() => {});
      }
      return;
    }
    fetch(`/api/dev/scroll-templates?id=${encodeURIComponent(selectedTemplateId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((data) => {
        if (data.yaml) setRawYaml(data.yaml);
        setYamlFileName(`scrolls/${selectedTemplateId}/scroll_config.yaml`);
        if (typeof data.existingImageCount === "number") {
          setExistingImageCount(data.existingImageCount);
        }
      })
      .catch(() => setResultLog({ error: "テンプレートの読み込みに失敗しました" }));
  }, [selectedTemplateId, scrollTemplates]);

  const previewOrder = useMemo(
    () => (rtlPreview ? [...imageItems].reverse() : imageItems),
    [imageItems, rtlPreview]
  );

  const loadYamlFile = useCallback((file) => {
    if (!file) return;
    const name = (file.name || "").toLowerCase();
    if (!name.endsWith(".yaml") && !name.endsWith(".yml")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawYaml(String(reader.result ?? ""));
      setYamlFileName(file.name);
    };
    reader.onerror = () => {
      setResultLog({ error: "YAML の読み込みに失敗しました" });
    };
    reader.readAsText(file);
  }, []);

  const addYamlFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      const yamlFile = files.find((f) => {
        const n = (f.name || "").toLowerCase();
        return n.endsWith(".yaml") || n.endsWith(".yml");
      });
      if (yamlFile) loadYamlFile(yamlFile);
    },
    [loadYamlFile]
  );

  const addFiles = useCallback((fileList) => {
    const files = Array.from(fileList || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;
    const next = files.map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setImageItems((prev) => [...prev, ...next]);
  }, []);

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
    isRtlSlice,
    yamlScrollId,
    imageItems.length,
    sliceMode,
    sliceCount,
    customCuts,
  ]);

  const removeImage = (index) => {
    setImageItems((prev) => {
      const item = prev[index];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const moveImage = (index, delta) => {
    const next = index + delta;
    if (next < 0 || next >= imageItems.length) return;
    setImageItems((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  };

  const submitUpload = async ({ dryRun = false, mode = null } = {}) => {
    const trimmed = rawYaml.trim();
    if (!trimmed) {
      setResultLog({ error: "scroll_config.yaml をアップロードまたは入力してください" });
      return;
    }

    const scrollId = yamlScrollId.trim();
    if (!scrollId) {
      setResultLog({ error: "YAML 内に scroll_id が見つかりません" });
      return;
    }

    setIsSubmitting(true);
    setResultLog(null);

    try {
      const images =
        imageItems.length > 0
          ? await Promise.all(
              imageItems.map(async (item) => ({
                base64: await fileToDataUrl(item.file),
                ext: extFromFile(item.file),
              }))
            )
          : [];

      const payload = {
        scrollId,
        rawYaml: trimmed,
        images,
        dryRun,
      };
      if (mode === "local" || mode === "r2") {
        payload.mode = mode;
      }

      const res = await fetch("/api/dev/upload-scroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setResultLog({
          error: data.error || `HTTP ${res.status}`,
          exitCode: data.exitCode,
          stderr: data.stderr,
          stdout: data.stdout,
        });
        return;
      }

      setResultLog({
        ok: data.ok,
        exitCode: data.exitCode,
        stdout: data.stdout,
        stderr: data.stderr,
        titleen: data.titleen,
        dryRun,
        mode,
      });

      if (data.ok && !dryRun && (mode === "local" || mode === "r2")) {
        const titleen = data.titleen || yamlTitleen.trim();
        const title = data.title || extractYamlScalar(trimmed, "title");
        const viewerUrl =
          data.viewerUrl ||
          (typeof window !== "undefined" && titleen
            ? `${window.location.origin}/${titleen}`
            : titleen
              ? `/${titleen}`
              : "");
        const successPayload = {
          ok: true,
          mode,
          titleen,
          title,
          viewerUrl,
          timestamp: Date.now(),
        };
        try {
          sessionStorage.setItem(UPLOAD_RESULT_STORAGE_KEY, JSON.stringify(successPayload));
        } catch {
          /* ignore */
        }
        setLastSuccessResult(successPayload);
        setUrlCopyMessage("");
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } catch (err) {
      setResultLog({
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canPreflight = rawYaml.trim().length > 0 && !isSubmitting;
  const canFullRun =
    canPreflight && liveValidation.errors.length === 0 && !isSubmitting;
  const btnDisabled = { opacity: 0.5, cursor: "not-allowed" };

  const validationPanelStyle = useMemo(() => {
    const hasErr = liveValidation.errors.length > 0;
    const hasWarn = liveValidation.warnings.length > 0;
    return {
      marginTop: 12,
      padding: "12px 14px",
      borderRadius: 8,
      border: `1px solid ${hasErr ? "#fca5a5" : "#86efac"}`,
      background: hasErr ? "#fef2f2" : "#f0fdf4",
    };
  }, [liveValidation.errors.length, liveValidation.warnings.length]);

  return (
    <>
      <Head>
        <title>Dev — Scroll Upload</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div style={ui.page}>
        <div style={ui.container}>
          <Link href="/dev">
            <a style={ui.backLink}>← Dev ハブへ戻る</a>
          </Link>

          <header style={ui.header}>
            <h1 style={ui.h1}>絵巻一発登録（開発専用）</h1>
            <p style={ui.subtitle}>
              Step 1: scroll_config.yaml · Step 2: 連番画像 → R2 &amp; JSON 同期（development のみ）
            </p>
          </header>

          {lastSuccessResult ? (
            <section
              style={{
                position: "relative",
                marginBottom: 20,
                padding: "16px 18px",
                borderRadius: 10,
                border: "1px solid #86efac",
                background: "#ecfdf5",
                color: "#065f46",
              }}
              aria-live="polite"
            >
              <button
                type="button"
                aria-label="完了バナーを閉じる"
                onClick={dismissLastSuccessResult}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 12,
                  border: "none",
                  background: "transparent",
                  color: "#047857",
                  fontSize: 20,
                  lineHeight: 1,
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                ×
              </button>
              <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "#059669",
                    color: "#fff",
                    marginRight: 8,
                  }}
                >
                  {lastSuccessResult.mode === "local"
                    ? "[ローカル先行検証完了（R2未アップロード）]"
                    : "[Cloudflare R2 本番同期完了]"}
                </span>
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600 }}>
                {lastSuccessResult.title || "（タイトル未設定）"}
              </p>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "#047857" }}>
                titleen: <code style={{ fontFamily: "monospace" }}>{lastSuccessResult.titleen || "—"}</code>
                {" · "}
                実行: {formatUploadTimestamp(lastSuccessResult.timestamp)}
              </p>
              {lastSuccessResult.viewerUrl ? (
                <div style={{ marginBottom: 10 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#065f46" }}>
                    同期先 URL
                  </p>
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: 13,
                      fontFamily: "monospace",
                      wordBreak: "break-all",
                    }}
                  >
                    {lastSuccessResult.viewerUrl}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <a
                      href={
                        lastSuccessResult.viewerUrl.startsWith("/")
                          ? lastSuccessResult.viewerUrl
                          : lastSuccessResult.viewerUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#047857",
                        textDecoration: "underline",
                      }}
                    >
                      作品ページを開く（別タブ）
                    </a>
                    <button
                      type="button"
                      style={{
                        ...ui.btnSecondary,
                        padding: "6px 12px",
                        fontSize: 13,
                      }}
                      onClick={() => copyViewerUrl(lastSuccessResult.viewerUrl)}
                    >
                      URLをコピー
                    </button>
                    {urlCopyMessage ? (
                      <span style={{ fontSize: 12, color: "#059669" }}>{urlCopyMessage}</span>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {lastSuccessResult.mode === "local" ? (
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#047857" }}>
                  ローカル表示に問題がなければ、下の「② Cloudflare R2 へ本番アップロード ＆ 同期」を実行してください。
                </p>
              ) : null}
            </section>
          ) : null}

          <section style={ui.card}>
            <h2 style={{ ...ui.h2, marginBottom: 16 }}>1. scroll_config.yaml</h2>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <label style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
                テンプレートから読み込み
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                style={{
                  minWidth: 220,
                  fontSize: 13,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                }}
              >
                <option value="">— 選択 —</option>
                {scrollTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id === "_template" ? "[雛形] _template" : t.label || t.id}
                    {t.id !== "_template" ? ` (${t.id})` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                style={ui.btnSecondary}
                disabled={!selectedTemplateId}
                onClick={loadSelectedTemplate}
              >
                読込
              </button>
              {nextAvailableId != null ? (
                <span style={ui.badge}>次の推奨空き ID: #{nextAvailableId}</span>
              ) : null}
              {liveValidation.overwriteMode ? (
                <span
                  style={{
                    ...ui.badge,
                    background: "#dbeafe",
                    color: "#1d4ed8",
                  }}
                >
                  既存作品の上書き更新モード
                </span>
              ) : null}
            </div>

            <div
              role="button"
              tabIndex={0}
              style={dropZoneStyle(isYamlDragging)}
              onDragEnter={(e) => {
                e.preventDefault();
                yamlDragCounterRef.current += 1;
                setIsYamlDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                yamlDragCounterRef.current -= 1;
                if (yamlDragCounterRef.current <= 0) {
                  yamlDragCounterRef.current = 0;
                  setIsYamlDragging(false);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                yamlDragCounterRef.current = 0;
                setIsYamlDragging(false);
                addYamlFiles(e.dataTransfer.files);
              }}
              onClick={() => yamlFileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") yamlFileInputRef.current?.click();
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>
                scroll_config.yaml をドラッグ＆ドロップ、またはクリックで選択
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
                対応: .yaml / .yml
              </p>
            </div>
            <input
              ref={yamlFileInputRef}
              type="file"
              accept=".yaml,.yml,text/yaml"
              style={{ display: "none" }}
              onChange={(e) => {
                addYamlFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {(yamlFileName || yamlScrollId || yamlTitleen) && (
              <div style={ui.badgeRow}>
                {yamlFileName ? <span style={ui.badgeMuted}>{yamlFileName}</span> : null}
                {yamlScrollId ? (
                  <span style={ui.badge}>scroll_id: {yamlScrollId}</span>
                ) : (
                  <span style={ui.badgeMuted}>scroll_id: —</span>
                )}
                {yamlTitleen ? (
                  <span style={ui.badge}>titleen: {yamlTitleen}</span>
                ) : (
                  <span style={ui.badgeMuted}>titleen: —</span>
                )}
              </div>
            )}

            <textarea
              style={ui.yamlEditor}
              value={rawYaml}
              onChange={(e) => setRawYaml(e.target.value)}
              placeholder="# scroll_config.yaml の内容がここに表示されます（直接編集可）"
              spellCheck={false}
            />

            <div style={validationPanelStyle} aria-live="polite">
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: liveValidation.errors.length ? "#b91c1c" : "#047857",
                }}
              >
                リアルタイム事前チェック結果 —{" "}
                {liveValidation.errors.length === 0 ? "事前チェックOK" : "要修正"}
              </p>
              {liveValidation.errors.length === 0 &&
              liveValidation.warnings.length === 0 &&
              !rawYaml.trim() ? (
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                  YAML を入力または読み込むと自動検査します
                </p>
              ) : null}
              {liveValidation.errors.length > 0 ? (
                <ul style={{ margin: "0 0 8px", paddingLeft: 20, color: "#dc2626", fontSize: 13 }}>
                  {liveValidation.errors.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              ) : null}
              {liveValidation.warnings.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 20, color: "#ca8a04", fontSize: 13 }}>
                  {liveValidation.warnings.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>

          <section style={ui.card}>
            <div style={ui.rowBetween}>
              <h2 style={ui.h2}>2. 連番画像（{String(imageItems.length).padStart(2, "0")} 枚）</h2>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#475569" }}>
                <input
                  type="checkbox"
                  checked={rtlPreview}
                  onChange={(e) => setRtlPreview(e.target.checked)}
                />
                RTL プレビュー（右→左）
              </label>
            </div>
            <p style={ui.note}>
              ※既に scrolls/&#123;scroll_id&#125;/images/ に画像がある場合は、画像選択なしで YAML のみ再同期できます。
            </p>

            <details
              style={{
                marginBottom: 16,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "12px 14px",
                background: "#f8fafc",
              }}
              open={slicePanelOpen}
              onToggle={(e) => setSlicePanelOpen(e.target.open)}
            >
              <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 14, color: "#334155" }}>
                長尺元画像から自動スライス生成
              </summary>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                <div
                  role="button"
                  tabIndex={0}
                  style={dropZoneStyle(isRawSliceDragging)}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    rawSliceDragCounterRef.current += 1;
                    setIsRawSliceDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    rawSliceDragCounterRef.current -= 1;
                    if (rawSliceDragCounterRef.current <= 0) {
                      rawSliceDragCounterRef.current = 0;
                      setIsRawSliceDragging(false);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    rawSliceDragCounterRef.current = 0;
                    setIsRawSliceDragging(false);
                    addRawSliceSources(e.dataTransfer.files);
                  }}
                  onClick={() => rawSliceInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") rawSliceInputRef.current?.click();
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>
                    長尺元画像をドロップ / クリック（複数可）
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b" }}>
                    選択済み: {rawSliceSourceFiles.length} ファイル
                  </p>
                </div>
                <input
                  ref={rawSliceInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    addRawSliceSources(e.target.files);
                    e.target.value = "";
                  }}
                />
                {rawSlicePreviewUrl ? (
                  <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                    <div
                      ref={rawSlicePreviewRef}
                      style={{ position: "relative", display: "inline-block", touchAction: "none" }}
                      onPointerMove={handleRawSlicePreviewPointerMove}
                      onPointerUp={() => {
                        setCustomDragCutIndex(null);
                        setCustomCuts((prev) => [...prev].sort((a, b) => a - b));
                      }}
                      onPointerCancel={() => {
                        setCustomDragCutIndex(null);
                        setCustomCuts((prev) => [...prev].sort((a, b) => a - b));
                      }}
                      onClick={(e) => {
                        if (sliceMode !== "custom" || customDragCutIndex != null) return;
                        const el = rawSlicePreviewRef.current;
                        if (!el) return;
                        const rect = el.getBoundingClientRect();
                        if (rect.width <= 0) return;
                        addCustomCutAtRatio((e.clientX - rect.left) / rect.width);
                      }}
                    >
                      <img
                        src={rawSlicePreviewUrl}
                        alt="長尺元画像プレビュー"
                        draggable={false}
                        style={{ height: 220, width: "auto", maxWidth: "none", display: "block" }}
                      />
                      {previewIntervals.map(([start, end], idx) => (
                        <span
                          key={`badge-${idx}`}
                          style={{
                            position: "absolute",
                            left: `${((start + end) / 2) * 100}%`,
                            top: 6,
                            transform: "translateX(-50%)",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#fff",
                            background: "rgba(15, 23, 42, 0.75)",
                            padding: "2px 6px",
                            borderRadius: 4,
                            pointerEvents: "none",
                          }}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                      ))}
                      {sliceMode === "custom"
                        ? customCuts.map((ratio, cutIndex) => (
                            <div
                              key={`handle-${cutIndex}-${ratio.toFixed(4)}`}
                              role="presentation"
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                setCustomDragCutIndex(cutIndex);
                                e.currentTarget.setPointerCapture(e.pointerId);
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                removeCustomCutAt(cutIndex);
                              }}
                              style={{
                                position: "absolute",
                                left: `${ratio * 100}%`,
                                top: 0,
                                bottom: 0,
                                width: 3,
                                marginLeft: -1,
                                background: "#ef4444",
                                cursor: "ew-resize",
                                boxShadow: "0 0 0 1px rgba(255,255,255,0.35)",
                              }}
                            />
                          ))
                        : previewBoundaryRatios.map((ratio) => (
                            <div
                              key={`bound-${ratio.toFixed(5)}`}
                              style={{
                                position: "absolute",
                                left: `${ratio * 100}%`,
                                top: 0,
                                bottom: 0,
                                width: 2,
                                marginLeft: -1,
                                background: "rgba(56, 189, 248, 0.85)",
                                pointerEvents: "none",
                              }}
                            />
                          ))}
                    </div>
                  </div>
                ) : null}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    ["aspect", "一定幅・比率指定"],
                    ["count", "分割数指定（屏風・扇数）"],
                    ["custom", "自由区切り線指定"],
                  ].map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSliceMode(mode)}
                      style={{
                        padding: "6px 10px",
                        fontSize: 13,
                        fontWeight: sliceMode === mode ? 700 : 500,
                        borderRadius: 6,
                        border: sliceMode === mode ? "1px solid #0284c7" : "1px solid #cbd5e1",
                        background: sliceMode === mode ? "#e0f2fe" : "#fff",
                        color: "#334155",
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: 12,
                    alignItems: "end",
                  }}
                >
                  {sliceMode === "aspect" ? (
                    <label style={{ fontSize: 13, color: "#475569" }}>
                      1コマ横幅比率（高さ=1）
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={sliceAspectRatio}
                        onChange={(e) => setSliceAspectRatio(parseFloat(e.target.value) || 1.5)}
                        style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px" }}
                      />
                    </label>
                  ) : null}
                  {sliceMode === "count" ? (
                    <label style={{ fontSize: 13, color: "#475569" }}>
                      分割数（例: 屏風 6 扇）
                      <input
                        type="number"
                        min={2}
                        step={1}
                        value={sliceCount}
                        onChange={(e) => setSliceCount(Math.max(2, parseInt(e.target.value, 10) || 2))}
                        style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px" }}
                      />
                    </label>
                  ) : null}
                  {sliceMode === "aspect" || sliceMode === "count" ? (
                    <label style={{ fontSize: 13, color: "#475569" }}>
                      オーバーラップ率（0〜30%）
                      <input
                        type="number"
                        min={0}
                        max={30}
                        step={1}
                        value={overlapPercent}
                        onChange={(e) => {
                          const v = Math.min(30, Math.max(0, parseInt(e.target.value, 10) || 0));
                          setOverlapPercent(v);
                        }}
                        style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px" }}
                      />
                    </label>
                  ) : null}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "#475569",
                      paddingBottom: 6,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isRtlSlice}
                      onChange={(e) => setIsRtlSlice(e.target.checked)}
                    />
                    右端から左へスライス（_01, _02…）
                  </label>
                </div>
                {sliceMode === "custom" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      <label style={{ fontSize: 13, color: "#475569" }}>
                        均等分割 N
                        <input
                          type="number"
                          min={2}
                          step={1}
                          value={sliceCount}
                          onChange={(e) => setSliceCount(Math.max(2, parseInt(e.target.value, 10) || 2))}
                          style={{ display: "block", width: 72, marginTop: 4, padding: "6px 8px" }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={initCustomCutsFromCount}
                        style={{
                          padding: "6px 10px",
                          fontSize: 13,
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        均等 N 分割から初期線を生成
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomCuts([])}
                        style={{
                          padding: "6px 10px",
                          fontSize: 13,
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        全クリア
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                      プレビュー上をクリックで赤線追加 · ドラッグで微調整 · ダブルクリックで削除
                    </p>
                    {customCuts.length > 0 ? (
                      <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 12, color: "#475569" }}>
                        {customCuts.map((ratio, cutIndex) => (
                          <li
                            key={`list-${cutIndex}-${ratio.toFixed(4)}`}
                            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}
                          >
                            <span>区切り {cutIndex + 1}: {(ratio * 100).toFixed(2)}%</span>
                            <button
                              type="button"
                              aria-label="削除"
                              onClick={() => removeCustomCutAt(cutIndex)}
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "#dc2626",
                                cursor: "pointer",
                                fontSize: 16,
                                lineHeight: 1,
                              }}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    disabled={isSlicing}
                    onClick={() => runAutoSlice()}
                    style={{
                      padding: "8px 14px",
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: "1px solid #0ea5e9",
                      background: isSlicing ? "#e2e8f0" : "#0284c7",
                      color: isSlicing ? "#64748b" : "#fff",
                      cursor: isSlicing ? "not-allowed" : "pointer",
                    }}
                  >
                    {isSlicing ? "スライス生成中…" : "スライスを生成して連番リストへセット"}
                  </button>
                  {rawSliceSourceFiles.length > 0 ? (
                    <button
                      type="button"
                      disabled={isSlicing}
                      onClick={() => setRawSliceSourceFiles([])}
                      style={{
                        padding: "8px 12px",
                        fontSize: 13,
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        color: "#475569",
                        cursor: isSlicing ? "not-allowed" : "pointer",
                      }}
                    >
                      元画像選択をクリア
                    </button>
                  ) : null}
                </div>
                {sliceGenMessage ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: sliceGenMessage.includes("失敗") ? "#dc2626" : "#047857",
                    }}
                  >
                    {sliceGenMessage}
                  </p>
                ) : null}
              </div>
            </details>

            <div
              role="button"
              tabIndex={0}
              style={dropZoneStyle(isImageDragging)}
              onDragEnter={(e) => {
                e.preventDefault();
                imageDragCounterRef.current += 1;
                setIsImageDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                imageDragCounterRef.current -= 1;
                if (imageDragCounterRef.current <= 0) {
                  imageDragCounterRef.current = 0;
                  setIsImageDragging(false);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                imageDragCounterRef.current = 0;
                setIsImageDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>
                ドラッグ＆ドロップ、またはクリックで画像を追加
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
                複数選択可 · 保存順が連番 01, 02, … になります
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <div style={thumbGridStyle(rtlPreview)}>
              {previewOrder.map((item) => {
                const index = imageItems.indexOf(item);
                const nn = String(index + 1).padStart(2, "0");
                return (
                  <ThumbCard
                    key={item.key}
                    nn={nn}
                    item={item}
                    index={index}
                    total={imageItems.length}
                    onMove={moveImage}
                    onRemove={removeImage}
                    rtl={rtlPreview}
                  />
                );
              })}
            </div>
          </section>

          <section style={ui.actions}>
            <button
              type="button"
              disabled={!canPreflight}
              style={{ ...ui.btnSecondary, ...(!canPreflight ? btnDisabled : {}) }}
              onClick={() => submitUpload({ dryRun: true })}
            >
              {isSubmitting ? "実行中…" : "Preflight のみ実行（高速チェック）"}
            </button>
            <button
              type="button"
              disabled={!canFullRun}
              style={{ ...ui.btnSecondary, ...(!canFullRun ? btnDisabled : {}) }}
              onClick={() => submitUpload({ mode: "local" })}
              title={
                liveValidation.errors.length
                  ? "事前チェックのエラーを解消してください"
                  : undefined
              }
            >
              {isSubmitting ? "実行中…" : "① ローカル確認用同期（R2アップロードなし）"}
            </button>
            <button
              type="button"
              disabled={!canFullRun}
              style={{ ...ui.btnPrimary, ...(!canFullRun ? btnDisabled : {}) }}
              onClick={() => submitUpload({ mode: "r2" })}
              title={
                liveValidation.errors.length
                  ? "事前チェックのエラーを解消してください"
                  : undefined
              }
            >
              {isSubmitting ? "実行中…" : "② Cloudflare R2 へ本番アップロード ＆ 同期"}
            </button>
          </section>

          {resultLog && (
            <section style={ui.logPanel}>
              {resultLog.error && (
                <p style={{ margin: "0 0 12px", fontWeight: 600, color: "#dc2626" }}>
                  エラー: {resultLog.error}
                </p>
              )}
              {resultLog.ok != null && (
                <p
                  style={{
                    margin: "0 0 12px",
                    fontWeight: 600,
                    color: resultLog.ok ? "#059669" : "#d97706",
                  }}
                >
                  exitCode: {resultLog.exitCode} {resultLog.dryRun ? "(dry-run)" : ""}
                </p>
              )}
              {resultLog.titleen && resultLog.ok && (
                <p style={{ margin: "0 0 12px" }}>
                  公開ページ:{" "}
                  <Link href={`/${resultLog.titleen}`}>
                    <a style={{ color: "#2563eb", textDecoration: "underline" }}>
                      /{resultLog.titleen}
                    </a>
                  </Link>
                </p>
              )}
              {resultLog.stdout && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b" }}>stdout</p>
                  <pre style={ui.pre}>{resultLog.stdout}</pre>
                </div>
              )}
              {resultLog.stderr && (
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b" }}>stderr</p>
                  <pre style={ui.preErr}>{resultLog.stderr}</pre>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function ThumbCard({ nn, item, index, total, onMove, onRemove, rtl }) {
  const disabledBtn = { opacity: 0.35, cursor: "not-allowed" };
  return (
    <div
      style={{
        width: 140,
        flexShrink: 0,
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: 8,
        background: "#fff",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.preview}
        alt=""
        style={{
          display: "block",
          marginBottom: 8,
          height: 80,
          width: "100%",
          borderRadius: 4,
          objectFit: "cover",
        }}
      />
      <p style={{ margin: 0, textAlign: "center", fontSize: 12, fontFamily: "monospace", color: "#1e3a5f" }}>
        {nn}
        {rtl ? " · RTL表示" : ""}
      </p>
      <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 4 }}>
        <button
          type="button"
          style={{ ...ui.btnSmall, ...(index === 0 ? disabledBtn : {}) }}
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          title={rtl ? "右へ（序盤へ）" : "前へ"}
        >
          ↑
        </button>
        <button
          type="button"
          style={{ ...ui.btnSmall, ...(index === total - 1 ? disabledBtn : {}) }}
          disabled={index === total - 1}
          onClick={() => onMove(index, 1)}
          title={rtl ? "左へ（終盤へ）" : "後ろへ"}
        >
          ↓
        </button>
        <button type="button" style={ui.btnDanger} onClick={() => onRemove(index)}>
          ×
        </button>
      </div>
    </div>
  );
}

export default DevUploadScrollPage;

export async function getServerSideProps() {
  if (process.env.NODE_ENV !== "development") {
    return { notFound: true };
  }
  return { props: {} };
}