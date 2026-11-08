export const FORMATS = {
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

export const PREVIEW_FMT = FORMATS.polaroid;
export const PHOTO_DX = PREVIEW_FMT.photoDx;
export const PHOTO_DY = PREVIEW_FMT.photoDy;
export const PHOTO_DW = PREVIEW_FMT.photoDw;
export const PHOTO_DH = PREVIEW_FMT.photoDh;
export const MESSAGE_MAX = 40;
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;
export const ZOOM_DEFAULT = 1.5;

export const THEMES = {
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

export function coverScaleFor(img, photoDw, photoDh) {
  return Math.max(photoDw / img.naturalWidth, photoDh / img.naturalHeight);
}

export function drawCanvasTexture(ctx, width, height, themeId) {
  ctx.save();

  if (themeId === "washi") {
    const paperGrad = ctx.createLinearGradient(0, 0, width, height);
    paperGrad.addColorStop(0, "rgba(218, 202, 176, 0.14)");
    paperGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
    paperGrad.addColorStop(1, "rgba(208, 192, 164, 0.16)");
    ctx.fillStyle = paperGrad;
    ctx.fillRect(0, 0, width, height);

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
        ctx.strokeStyle = "rgba(100, 72, 45, 0.17)";
      } else if (i % 3 === 1) {
        ctx.strokeStyle = "rgba(135, 102, 70, 0.12)";
      } else {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.48)";
      }
      ctx.stroke();
    }

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
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "rgba(218, 165, 32, 0.11)");
    grad.addColorStop(0.4, "rgba(255, 235, 140, 0.05)");
    grad.addColorStop(1, "rgba(190, 140, 20, 0.12)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

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

const textureCache = {};
export function getThemeTextureUrl(themeId) {
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

export function renderPolaroidCanvas({
  ctx,
  loadedImages,
  pan,
  zoom,
  coverScale,
  currentTheme,
  displayTitle,
  displayChapter,
  message,
  faviconImg,
  qrImg,
  sceneUrlText,
  format = "polaroid",
  isEn = false,
}) {
  const fmt = FORMATS[format] || FORMATS.polaroid;
  const { prev, current: img, next } = loadedImages;
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

  drawCanvasTexture(ctx, fmt.canvasW, fmt.canvasH, currentTheme);

  if (theme.border) {
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 18, fmt.canvasW - 36, fmt.canvasH - 36);

    if (currentTheme === "miyabi") {
      ctx.lineWidth = 0.8;
      ctx.strokeRect(22, 22, fmt.canvasW - 44, fmt.canvasH - 44);
    }
  }

  ctx.textAlign = "center";
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

  if (cleanEmaki) {
    ctx.font = '16px "Zen Old Mincho", "Hina Mincho", serif';
    ctx.fillStyle = theme.subColor;
    ctx.fillText(isEn ? `"${cleanEmaki}"` : `『${cleanEmaki}』`, centerCenterX, currentY);
    currentY += 40;
  }

  if (cleanMsg) {
    ctx.font = 'italic 18px "Zen Old Mincho", "Hina Mincho", serif';
    ctx.fillStyle = theme.msgColor;
    ctx.fillText(`“ ${cleanMsg} ”`, centerCenterX, currentY);
  }

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

  if (qrImg && qrImg.complete && qrImg.naturalWidth > 0) {
    const qrSize = fmt.qrSize;
    const qrX = fmt.canvasW - fmt.photoDx - qrSize;
    const qrY = fmt.canvasH - qrSize - 18;
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  }
}
