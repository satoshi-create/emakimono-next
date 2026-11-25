const STORAGE_KEY = "emakimono_polaroid_board_v1";
const PERSONAL_BOARDS_META_KEY = "emakimono_personal_boards_v1";
const MAX_BOARD_ITEMS = 30;

export const DEFAULT_PERSONAL_BOARD = {
  id: "default",
  title: "マイ・ポラロイドボード",
  description: "ポラロイドを自由に並べて、自分だけの鑑賞ボードを作れます",
  relatedHubs: [],
};

function isDefaultBoardId(boardId) {
  return !boardId || boardId === "default";
}

function personalBoardStorageKey(boardId) {
  return `emakimono_polaroid_board_personal_${boardId}`;
}

function readPersonalBoardsMeta() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PERSONAL_BOARDS_META_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePersonalBoardsMeta(list) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PERSONAL_BOARDS_META_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save personal boards meta:", e);
  }
}

function touchPersonalBoardUpdatedAt(boardId) {
  if (isDefaultBoardId(boardId)) return;
  const list = readPersonalBoardsMeta();
  const next = list.map((b) =>
    b.id === boardId ? { ...b, updatedAt: Date.now() } : b
  );
  writePersonalBoardsMeta(next);
}

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
 * boardId 省略 / "default" 時は既存キーを使用（後方互換）
 */
export function loadBoardItems(boardId = "default") {
  if (typeof window === "undefined") return [];
  try {
    const key = isDefaultBoardId(boardId)
      ? STORAGE_KEY
      : personalBoardStorageKey(boardId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * localStorage にボード一覧を保存する
 * boardId 省略 / "default" 時は既存キーへ保存（後方互換）
 */
export function saveBoardItems(items, boardId = "default") {
  if (typeof window === "undefined") return;
  try {
    const key = isDefaultBoardId(boardId)
      ? STORAGE_KEY
      : personalBoardStorageKey(boardId);
    window.localStorage.setItem(key, JSON.stringify(items.slice(-MAX_BOARD_ITEMS)));
    if (!isDefaultBoardId(boardId)) {
      touchPersonalBoardUpdatedAt(boardId);
    }
  } catch (e) {
    console.error("Failed to save polaroid board items:", e);
  }
}

/**
 * 個人ボードのメタデータ一覧（default を先頭に含む）
 */
export function listPersonalBoards() {
  const saved = readPersonalBoardsMeta();
  const savedDefault = saved.find((b) => b.id === "default");
  const defaultBoard = {
    ...DEFAULT_PERSONAL_BOARD,
    ...(savedDefault || {}),
    id: "default",
    itemCount: loadBoardItems("default").length,
  };
  const extras = saved
    .filter((b) => b && b.id && b.id !== "default")
    .map((b) => ({
      ...b,
      itemCount: loadBoardItems(b.id).length,
    }));
  return [defaultBoard, ...extras];
}

/**
 * 個人ボードを新規作成
 */
export function createPersonalBoard({ title, description } = {}) {
  const id = `pb_${Date.now().toString(36)}`;
  const board = {
    id,
    title: String(title || "").trim() || "新しい個人ボード",
    description: String(description || "").trim(),
    updatedAt: Date.now(),
  };
  const list = readPersonalBoardsMeta().filter((b) => b.id !== id);
  writePersonalBoardsMeta([board, ...list]);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(personalBoardStorageKey(id), JSON.stringify([]));
    }
  } catch {
    // noop
  }
  return { ...board, itemCount: 0 };
}

/**
 * 個人ボードのタイトル・解説を更新
 */
export function updatePersonalBoardMeta(
  boardId = "default",
  { title, description, relatedHubs } = {}
) {
  const id = boardId || "default";
  const list = readPersonalBoardsMeta();
  const existing = list.find((b) => b.id === id);
  const base =
    id === "default"
      ? { ...DEFAULT_PERSONAL_BOARD, ...(existing || {}) }
      : existing || { id, title: "", description: "", relatedHubs: [] };
  const nextMeta = {
    ...base,
    id,
    title:
      title !== undefined
        ? String(title).trim() || base.title || DEFAULT_PERSONAL_BOARD.title
        : base.title,
    description:
      description !== undefined
        ? String(description).trim()
        : base.description || "",
    relatedHubs:
      relatedHubs !== undefined
        ? Array.isArray(relatedHubs)
          ? relatedHubs
          : base.relatedHubs || []
        : Array.isArray(base.relatedHubs)
        ? base.relatedHubs
        : [],
    updatedAt: Date.now(),
  };
  const without = list.filter((b) => b.id !== id);
  if (id === "default") {
    writePersonalBoardsMeta([nextMeta, ...without.filter((b) => b.id !== "default")]);
  } else {
    writePersonalBoardsMeta([nextMeta, ...without]);
  }
  return nextMeta;
}

/**
 * 個人ボードを削除（default は削除不可）
 */
export function deletePersonalBoard(boardId) {
  if (isDefaultBoardId(boardId)) return false;
  const list = readPersonalBoardsMeta().filter((b) => b.id !== boardId);
  writePersonalBoardsMeta(list);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(personalBoardStorageKey(boardId));
    }
  } catch {
    // noop
  }
  return true;
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
  const isJa = locale === "ja";
  const prefix = isJa ? "/ja" : "";
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