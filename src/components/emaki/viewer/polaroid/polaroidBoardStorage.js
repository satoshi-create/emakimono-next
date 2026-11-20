const STORAGE_KEY = "emakimono_polaroid_board_v1";
const MAX_BOARD_ITEMS = 30;

function encodeUtf8Base64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeUtf8Base64Url(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 ? "=".repeat(4 - (base64.length % 4)) : "";
  const bin = atob(base64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * 新規ポラロイドアイテムを生成する
 */
export function createBoardItem(payload, existingCount = 0) {
  const offset = (existingCount % 6) * 28;
  const randomRotate = Number(((Math.random() - 0.5) * 6).toFixed(1));

  return {
    id: `pb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    scrollId: String(payload.scrollId || ""),
    sceneIndex: Number(payload.sceneIndex || 0),
    src: String(payload.src || ""),
    prevSrc: String(payload.prevSrc || ""),
    nextSrc: String(payload.nextSrc || ""),
    pan: {
      x: Number(payload.pan?.x || 0),
      y: Number(payload.pan?.y || 0),
    },
    zoom: Number(payload.zoom || 1.5),
    coverScale: Number(payload.coverScale || 1),
    theme: String(payload.theme || "white"),
    displayTitle: String(payload.displayTitle || ""),
    displayChapter: String(payload.displayChapter || ""),
    message: String(payload.message || ""),
    memo: String(payload.memo || ""),
    boardX: 40 + offset,
    boardY: 40 + offset,
    rotate: randomRotate,
    zIndex: existingCount + 1,
    createdAt: Date.now(),
  };
}

/**
 * localStorage から自分のボード一覧を読み込む
 */
export function loadBoardItems() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * localStorage にボード一覧を保存する
 */
export function saveBoardItems(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_BOARD_ITEMS)));
  } catch (e) {
    console.error("Failed to save polaroid board items:", e);
  }
}

/**
 * 既存のボードに新しいポラロイドを1枚追加して保存する
 */
export function appendBoardItem(payload) {
  const current = loadBoardItems();
  const newItem = createBoardItem(payload, current.length);
  const next = [...current, newItem];
  saveBoardItems(next);
  return { items: next, addedItem: newItem };
}

/**
 * ボード状態をURL共有用のクエリパラメータに変換する
 */
export function encodeBoardShareUrl(items, locale = "ja") {
  if (typeof window === "undefined") return "";
  const compact = items.map((item) => ({
    s: item.scrollId,
    i: item.sceneIndex,
    u: item.src,
    pu: item.prevSrc || "",
    nu: item.nextSrc || "",
    px: Math.round(item.pan?.x || 0),
    py: Math.round(item.pan?.y || 0),
    z: Number((item.zoom || 1.5).toFixed(2)),
    cs: Number((item.coverScale || 1).toFixed(4)),
    t: item.theme || "white",
    dt: item.displayTitle || "",
    dc: item.displayChapter || "",
    mg: item.message || "",
    mm: item.memo || "",
    bx: Math.round(item.boardX || 0),
    by: Math.round(item.boardY || 0),
    r: Number((item.rotate || 0).toFixed(1)),
    zi: Number(item.zIndex || 1),
  }));

  const encoded = encodeUtf8Base64Url(JSON.stringify(compact));
  const prefix = locale === "ja" ? "/ja" : "";
  const url = new URL(`${window.location.origin}${prefix}/board`);
  url.searchParams.set("d", encoded);
  return url.toString();
}

/**
 * 共有URLの ?d= パラメータからボードアイテム配列を復元する
 */
export function decodeBoardShareParam(encoded) {
  if (!encoded) return null;
  try {
    const json = decodeUtf8Base64Url(encoded);
    if (!json) return null;
    const compact = JSON.parse(json);
    if (!Array.isArray(compact)) return null;

    return compact.map((c, idx) => ({
      id: `shared_${idx}_${Date.now()}`,
      scrollId: String(c.s || ""),
      sceneIndex: Number(c.i || 0),
      src: String(c.u || ""),
      prevSrc: String(c.pu || ""),
      nextSrc: String(c.nu || ""),
      pan: { x: Number(c.px || 0), y: Number(c.py || 0) },
      zoom: Number(c.z || 1.5),
      coverScale: Number(c.cs || 1),
      theme: String(c.t || "white"),
      displayTitle: String(c.dt || ""),
      displayChapter: String(c.dc || ""),
      message: String(c.mg || ""),
      memo: String(c.mm || ""),
      boardX: Number(c.bx || 0),
      boardY: Number(c.by || 0),
      rotate: Number(c.r || 0),
      zIndex: Number(c.zi || idx + 1),
    }));
  } catch {
    return null;
  }
}