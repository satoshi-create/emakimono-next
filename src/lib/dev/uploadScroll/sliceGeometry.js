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

export function loadImageElementFromFile(file) {
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

export function canvasToJpegFile(canvas, fileName) {
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
  rawFiles,
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
  }
) {
  const sources = Array.from(rawFiles || []).filter((f) => f.type.startsWith("image/"));
  const out = [];
  let index = startIndex;
  const idPrefix = scrollId || "scroll";

  for (const source of sources) {
    const img = await loadImageElementFromFile(source);
    // 縦長（屏風等）のみ高さ上限2560pxで精細さを確保し、横長（通常絵巻）は1080px上限を維持して軽量化
    const maxHeight = img.naturalHeight > img.naturalWidth ? 2560 : 1080;
    const targetHeight = Math.min(maxHeight, img.naturalHeight);
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
        if (sharpenPercent > 0) {
          applyUnsharpMask(ctx, canvas.width, canvas.height, sharpenPercent);
        }
        const fileName = `${idPrefix}_${String(index + 1).padStart(2, "0")}-1080.jpg`;
      const file = await canvasToJpegFile(canvas, fileName);
      out.push(file);
      index += 1;
    }
  }
  return out;
}