/**
 * クイズ jump 定義 → ビューア linkId / 他巻遷移情報へ解決。
 */

/**
 * @param {{ chapter?: string|number, linkId: number, cat?: string }[]} emakis
 * @param {string|number} chapter
 * @param {{ preferImage?: boolean }} [opts]
 * @returns {number|null}
 */
export function resolveLinkIdByChapter(emakis, chapter, opts = {}) {
  if (!Array.isArray(emakis) || chapter == null || chapter === "") return null;
  const key = String(chapter);
  const { preferImage = false } = opts;
  if (preferImage) {
    const img = emakis.find(
      (s) => String(s.chapter) === key && s.cat === "image"
    );
    if (img && typeof img.linkId === "number") return img.linkId;
    // 画像の chapter が空の巻: 該当詞書の直後の image を絵引オフセットの着地先にする
    const ekIdx = emakis.findIndex(
      (s) => String(s.chapter) === key && s.cat === "ekotoba"
    );
    if (ekIdx >= 0) {
      for (let i = ekIdx + 1; i < emakis.length; i += 1) {
        if (emakis[i].cat === "ekotoba") break;
        if (
          emakis[i].cat === "image" &&
          typeof emakis[i].linkId === "number"
        ) {
          return emakis[i].linkId;
        }
      }
    }
  }
  const hit = emakis.find((s) => String(s.chapter) === key);
  return hit && typeof hit.linkId === "number" ? hit.linkId : null;
}

/**
 * 絵引アイテム → 着地 linkId + セクション内 offset_percent。
 * - link_id 明示時: そのスライス内オフセット
 * - 未指定時: scene_id 章の画像列に対する相対位置（0〜100）をスライスへ分解
 * @param {{ chapter?: string|number, linkId: number, cat?: string, srcWidth?: number, srcHeight?: number }[]} emakis
 * @param {{ link_id?: number|string, scene_id?: string|number, offset_percent?: number }} item
 * @returns {{ linkId: number, offsetPercent: number }|null}
 */
export function resolveEbikiScrollTarget(emakis, item) {
  if (!item || !Array.isArray(emakis)) return null;

  const rawOffset = Number(item.offset_percent);
  const offset = Number.isFinite(rawOffset)
    ? Math.min(100, Math.max(0, rawOffset))
    : 0;

  const rawLink = item.link_id;
  const explicit =
    typeof rawLink === "number"
      ? rawLink
      : rawLink != null && String(rawLink).trim() !== ""
        ? Number(rawLink)
        : NaN;
  if (Number.isFinite(explicit)) {
    return { linkId: explicit, offsetPercent: offset };
  }

  const key = String(item.scene_id ?? "");
  if (!key) return null;

  /** @type {{ linkId: number, srcWidth?: number, srcHeight?: number }[]} */
  const images = [];
  const ekIdx = emakis.findIndex(
    (s) => String(s.chapter) === key && s.cat === "ekotoba"
  );
  if (ekIdx >= 0) {
    for (let i = ekIdx + 1; i < emakis.length; i += 1) {
      if (emakis[i].cat === "ekotoba") break;
      if (
        emakis[i].cat === "image" &&
        typeof emakis[i].linkId === "number"
      ) {
        images.push(emakis[i]);
      }
    }
  } else {
    emakis.forEach((s) => {
      if (
        String(s.chapter) === key &&
        s.cat === "image" &&
        typeof s.linkId === "number"
      ) {
        images.push(s);
      }
    });
  }

  if (!images.length) {
    const fallback = resolveLinkIdByChapter(emakis, item.scene_id, {
      preferImage: true,
    });
    return typeof fallback === "number"
      ? { linkId: fallback, offsetPercent: offset }
      : null;
  }

  if (images.length === 1) {
    return { linkId: images[0].linkId, offsetPercent: offset };
  }

  const widths = images.map((img) =>
    img.srcWidth > 0 && img.srcHeight > 0 ? img.srcWidth / img.srcHeight : 1
  );
  const total = widths.reduce((a, b) => a + b, 0) || 1;
  const target = (offset / 100) * total;
  let acc = 0;
  for (let i = 0; i < images.length; i += 1) {
    const w = widths[i];
    if (acc + w >= target || i === images.length - 1) {
      const local = w > 0 ? ((target - acc) / w) * 100 : 0;
      return {
        linkId: images[i].linkId,
        offsetPercent: Math.min(100, Math.max(0, local)),
      };
    }
    acc += w;
  }
  return { linkId: images[0].linkId, offsetPercent: offset };
}

/**
 * @typedef {{
 *   kind: "local",
 *   linkId: number,
 *   chapter?: string|number,
 * } | {
 *   kind: "scroll",
 *   titleen: string,
 *   chapter?: string|number,
 *   linkId?: number,
 * }} ResolvedQuizJump
 */

/**
 * @param {{ chapter?: string|number, linkId: number }[]} emakis
 * @param {{ type: string, chapter?: string|number, linkId?: number, titleen?: string }|undefined} jump
 * @param {string} [currentTitleen]
 * @returns {ResolvedQuizJump|null}
 */
export function resolveQuizJump(emakis, jump, currentTitleen) {
  if (!jump) return null;

  if (jump.type === "scroll" && jump.titleen) {
    // 同一巻への scroll 指定はローカルジャンプに畳む
    if (currentTitleen && jump.titleen === currentTitleen) {
      if (typeof jump.linkId === "number") {
        return { kind: "local", linkId: jump.linkId, chapter: jump.chapter };
      }
      if (jump.chapter != null) {
        const linkId = resolveLinkIdByChapter(emakis, jump.chapter);
        if (linkId == null) return null;
        return { kind: "local", linkId, chapter: jump.chapter };
      }
      return null;
    }
    return {
      kind: "scroll",
      titleen: jump.titleen,
      chapter: jump.chapter,
      linkId: jump.linkId,
    };
  }

  if (jump.type === "linkId" && typeof jump.linkId === "number") {
    return { kind: "local", linkId: jump.linkId };
  }

  if (jump.type === "chapter") {
    const linkId = resolveLinkIdByChapter(emakis, jump.chapter);
    if (linkId == null) return null;
    return { kind: "local", linkId, chapter: jump.chapter };
  }

  return null;
}
