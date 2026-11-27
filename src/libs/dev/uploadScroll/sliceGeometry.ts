// === 1. File / Image 変換ヘルパー ===
// ブラウザ上で File / Canvas を扱う際の共通変換（DataURL・拡張子・Image 要素・JPEG File）

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function extFromFile(file) {
  const name = file.name || "";
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  if (m) return m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export function loadImageElementFromFile(file: File): Promise<HTMLImageElement> {
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

export function canvasToJpegFile(canvas, fileName, quality = 0.92) {
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
      quality
    );
  });
}

// === 2. スライス区間・座標計算 ===
// アスペクト・枚数・カスタム cut に基づく横方向区間と RTL 並べ替え

export function computeSlicePositions(naturalWidth, rawSliceWidth, step, isRtlSlice) {
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

export function buildIntervalsAspect(naturalWidth, naturalHeight, sliceAspectRatio, overlapPercent) {
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

export function buildIntervalsCount(sliceCount, overlapPercent) {
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

export function buildIntervalsCustom(customCuts) {
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

export function orderIntervalsForRtl(intervals, isRtlSlice) {
  if (isRtlSlice) return [...intervals].reverse();
  return intervals;
}

/** 元画像の向き・高精細モードに応じた出力高さの上限（px） */
export function resolveSliceMaxHeight(
  naturalWidth: number,
  naturalHeight: number,
  highResMode = false
): number {
  const highRes = Boolean(highResMode);
  if (naturalHeight > naturalWidth) return 2560;
  return highRes ? 1600 : 1080;
}

/** srcHeight を上限に cap したスライス出力の統一高さ */
export function resolveSliceTargetHeight(
  naturalWidth: number,
  naturalHeight: number,
  highResMode = false
): number {
  const maxHeight = resolveSliceMaxHeight(naturalWidth, naturalHeight, highResMode);
  return Math.min(maxHeight, naturalHeight);
}

/** バッチ内の全元画像で共通の出力ピクセル高さ（アップスケールしない） */
export function resolveUnifiedBatchTargetHeight(
  sizes: { width: number; height: number }[],
  highResMode = false
): number {
  if (!sizes.length) return 1080;
  let unified = Number.POSITIVE_INFINITY;
  for (const { width, height } of sizes) {
    unified = Math.min(unified, resolveSliceTargetHeight(width, height, highResMode));
  }
  return unified === Number.POSITIVE_INFINITY ? 1080 : unified;
}

/** 高さ基準で縮小し、横長コマの幅のみ変動させる（長辺基準の不均一高さを防ぐ） */
export function computeSliceOutputDimensions(
  srcWidth: number,
  srcHeight: number,
  targetHeight: number
): { targetWidth: number; targetHeight: number } {
  const outHeight = Math.max(1, Math.round(targetHeight));
  if (srcHeight <= 0 || srcWidth <= 0) {
    return { targetWidth: 1, targetHeight: outHeight };
  }
  const outWidth = Math.max(1, Math.round(srcWidth * (outHeight / srcHeight)));
  return { targetWidth: outWidth, targetHeight: outHeight };
}

/** 極端な横長コマ（出力幅）の警告しきい値 */
export const SLICE_OUTPUT_MAX_WIDTH = 12000;

/** 表示倍率・横スクロール有無に依存せず、要素のレイアウト幅に対する 0〜1 の比率 */
export function ratioFromPointerOnElement(
  clientX: number,
  element: HTMLElement | null
): number | null {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0) return null;
  const ratio = (clientX - rect.left) / rect.width;
  return Math.max(0, Math.min(1, ratio));
}

// === 3. Canvas JPEG スライス生成 ===
// 元画像から区間ごとに Canvas 切り出しし、scroll_id 命名の JPEG File 配列を返す

function applyUnsharpMask(ctx, width, height, percent) {
  const amount = Math.max(0, Math.min(100, Number(percent) || 0)) / 100;
  if (amount <= 0 || width < 3 || height < 3) return;
  const imgData = ctx.getImageData(0, 0, width, height);
  const src = imgData.data;
  const copy = new Uint8ClampedArray(src);
  // 3x3 ガウシアン近似ぼかしとの差分を加算して輪郭を強調
  const strength = amount * 1.2;
  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = (row + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const blur =
          (copy[((row - width) + (x - 1)) * 4 + c] +
            2 * copy[((row - width) + x) * 4 + c] +
            copy[((row - width) + (x + 1)) * 4 + c] +
            2 * copy[(row + (x - 1)) * 4 + c] +
            4 * center +
            2 * copy[(row + (x + 1)) * 4 + c] +
            copy[((row + width) + (x - 1)) * 4 + c] +
            2 * copy[((row + width) + x) * 4 + c] +
            copy[((row + width) + (x + 1)) * 4 + c]) /
          16;
        src[idx + c] = center + (center - blur) * strength;
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

export async function sliceRawImagesToFiles(
  rawFiles: FileList | File[] | null | undefined,
  {
    sliceAspectRatio,
    overlapPercent,
    sharpenPercent = 0,
    isRtlSlice,
    scrollId,
    startIndex = 0,
    sliceMode = "aspect",
    sliceCount = 6,
    customCuts = [],
    highResMode = false,
    sliceWarnings = [],
  }: {
    sliceAspectRatio: number;
    overlapPercent: number;
    sharpenPercent?: number;
    isRtlSlice: boolean;
    scrollId: string;
    startIndex?: number;
    sliceMode?: string;
    sliceCount?: number;
    customCuts?: number[];
    highResMode?: boolean;
    sliceWarnings?: { sliceIndex: number; outputWidth: number }[];
  }
) {
  const sources = Array.from(rawFiles || []).filter(
    (f): f is File => f instanceof File && f.type.startsWith("image/")
  );
  const out = [];
  let index = startIndex;
  const idPrefix = scrollId || "scroll";
  const highRes = Boolean(highResMode);
  const jpegQuality = highRes ? 0.95 : 0.92;

  const loaded = await Promise.all(
    sources.map(async (source) => ({
      img: await loadImageElementFromFile(source),
    }))
  );
  const batchTargetHeight = resolveUnifiedBatchTargetHeight(
    loaded.map(({ img }) => ({ width: img.naturalWidth, height: img.naturalHeight })),
    highRes
  );

  for (const { img } of loaded) {
    const srcHeight = img.naturalHeight;
    const w = img.naturalWidth;
    let intervals;
    if (sliceMode === "count") {
      intervals = buildIntervalsCount(sliceCount, overlapPercent);
    } else if (sliceMode === "custom") {
      intervals = buildIntervalsCustom(customCuts);
    } else {
      intervals = buildIntervalsAspect(w, srcHeight, sliceAspectRatio, overlapPercent);
    }
    intervals = orderIntervalsForRtl(intervals, isRtlSlice);

    for (const [startRatio, endRatio] of intervals) {
      const sx = Math.round(w * startRatio);
      const sw = Math.max(1, Math.round(w * (endRatio - startRatio)));
      const { targetWidth, targetHeight } = computeSliceOutputDimensions(
        sw,
        srcHeight,
        batchTargetHeight
      );
      if (targetWidth > SLICE_OUTPUT_MAX_WIDTH) {
        sliceWarnings.push({ sliceIndex: index + 1, outputWidth: targetWidth });
      }
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas が利用できません");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, 0, sw, srcHeight, 0, 0, targetWidth, targetHeight);
      if (sharpenPercent > 0) {
        applyUnsharpMask(ctx, canvas.width, canvas.height, sharpenPercent);
      }
      const fileName = `${idPrefix}_${String(index + 1).padStart(2, "0")}-${targetHeight}.jpg`;
      const file = await canvasToJpegFile(canvas, fileName, jpegQuality);
      out.push(file);
      index += 1;
    }
  }
  return out;
}