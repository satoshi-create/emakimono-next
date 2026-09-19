/**
 * 描画窓 Phase 1: レイアウト幅を保ったまま、遠いシーンの中身だけ間引く。
 */
import {
  CONTENT_WINDOW_AHEAD,
  CONTENT_WINDOW_BEHIND,
  CONTENT_WINDOW_PLAY_AHEAD,
  CONTENT_WINDOW_PLAY_BEHIND,
  SCENE_DETECTION_HYSTERESIS_SHARE,
  SCENE_DETECTION_TIE_TOLERANCE,
  ZOOM_STRIP_MIN_SLICES,
} from "@/libs/constants/viewerPlayback";

/**
 * @param {number} index 配列 index（section[id] / linkId）
 * @param {number} centerIndex 読取中心（scrollLeft 追従の contentWindowCenter 等）
 * @param {boolean} wasMounted 直前フレームで中身を載せていたか
 * @param {{ isPlayMode?: boolean }} [opts]
 */
export function shouldMountSceneContent(
  index,
  centerIndex,
  wasMounted,
  opts = {}
) {
  // sticky: 一度載せた中身は外さない（remount による blur 再発・幅揺れを防ぐ）
  if (wasMounted) return true;
  const center = Number.isFinite(centerIndex) ? centerIndex : 0;
  const ahead = opts.isPlayMode
    ? CONTENT_WINDOW_PLAY_AHEAD
    : CONTENT_WINDOW_AHEAD;
  const behind = opts.isPlayMode
    ? CONTENT_WINDOW_PLAY_BEHIND
    : CONTENT_WINDOW_BEHIND;
  // index 大 = 巻の先（RTL で進む方向）。前方を厚く先読みする
  const delta = index - center;
  if (delta >= 0) return delta <= ahead;
  return -delta <= behind;
}

/**
 * シーン1枚の表示幅（px）。article 行高さを基準に LazyImage / 殻と同じ ratio 式。
 * @param {{ cat?: string, src?: string, srcWidth?: number, srcHeight?: number }} item
 * @param {number} rowHeightPx
 */
export function sceneWidthPx(item, rowHeightPx) {
  const h = rowHeightPx > 0 ? rowHeightPx : 1;
  const { cat, src, srcWidth, srcHeight } = item || {};
  if (cat === "ekotoba" && !src) return 0;
  if (!srcWidth || !srcHeight) return h * 0.2; // 殻フォールバック 20vh 相当
  return (srcWidth / srcHeight) * h;
}

/**
 * シーン配置レイアウト（RTL のコンテンツ先頭＝右端からの開始座標 start と幅 width）。
 * DOM 実測（buildSceneLayout）とメタデータ推定（buildSceneLayoutFromEmakis）で同じ形に揃え、
 * シーン判定を DOM / メタデータで別挙動にしないための共通土台。
 * @param {Array<{ index: number, start: number, width: number }>} hits
 * @returns {{ starts: number[], widths: number[], total: number }}
 */
export function buildSceneLayout(hits) {
  const list = Array.isArray(hits)
    ? hits.filter((h) => h && Number.isFinite(h.index) && h.index >= 0)
    : [];
  const count = list.reduce((max, h) => Math.max(max, h.index + 1), 0);
  const starts = new Array(count).fill(0);
  const widths = new Array(count).fill(0);
  let total = 0;
  list.forEach(({ index, start, width }) => {
    const s = Number.isFinite(start) ? Math.max(0, start) : 0;
    const w = Number.isFinite(width) ? Math.max(0, width) : 0;
    starts[index] = s;
    widths[index] = w;
    if (s + w > total) total = s + w;
  });
  return { starts, widths, total };
}

/** メタデータ幅から同じ形のレイアウトを組み立てる（DOM キャッシュ前の推定用） */
export function buildSceneLayoutFromEmakis(emakis, rowHeightPx) {
  const list = Array.isArray(emakis) ? emakis : [];
  let acc = 0;
  const hits = list.map((item, index) => {
    const width = sceneWidthPx(item, rowHeightPx);
    const hit = { index, start: acc, width };
    acc += width;
    return hit;
  });
  return buildSceneLayout(hits);
}

/** レイアウト index を [0, count-1] へ丸める */
function clampSceneLayoutIndex(index, count) {
  const i = Number.isFinite(index) ? Math.round(index) : 0;
  return Math.max(0, Math.min(count - 1, i));
}

/**
 * 巻頭・巻末で占有率計算をバイパスする端しきい値（px）。
 * 狭幅スライス（舟木本 等）は端まで送っても手前の段が画面内に残り続け、
 * 相対ヒステリシスでは最終段の占有率が勝ちきれない。物理限界では面積計算を
 * 行わず端の段を確定させる。
 */
export const SCENE_EDGE_SNAP_PX = 16;

/** ビューポート内の可視幅（幅0の ekotoba マーカーは 0） */
function sliceVisibleWidth(layout, index, viewStart, viewEnd) {
  const width = layout.widths[index];
  if (!(width > 0)) return 0;
  const start = layout.starts[index];
  return Math.max(
    0,
    Math.min(start + width, viewEnd) - Math.max(start, viewStart)
  );
}

/** 段に属するスライスの可視幅を合算した占有率（Σ visibleWidth / clientWidth） */
function sceneRangeShare(layout, range, viewStart, viewEnd, clientWidth) {
  const count = layout.widths.length;
  const from = Math.max(0, range.from);
  const to = Math.min(count - 1, range.to);
  let sum = 0;
  for (let i = from; i <= to; i += 1) {
    sum += sliceVisibleWidth(layout, i, viewStart, viewEnd);
  }
  return sum / clientWidth;
}

/**
 * 解説バーの単位「段（Scene）」の範囲（配列 index・両端含む）を emakis から組む。
 * 段は ekotoba マーカー（章見出し）で区切られ、画像スライスは直前の ekotoba 章に
 * 属する（画像スライスは chapter を持たない）。舟木本は 1段 = 2扇 = スライス2枚。
 * ekotoba が無い巻では [] を返し、呼び出し側はスライス単位判定へフォールバックする。
 * @param {Array<{ cat?: string }>} emakis
 * @returns {Array<{ from: number, to: number }>}
 */
export function buildSceneRanges(emakis) {
  const list = Array.isArray(emakis) ? emakis : [];
  const anchors = [];
  list.forEach((item, i) => {
    if (item?.cat === "ekotoba") anchors.push(i);
  });
  if (!anchors.length) return [];
  // 先頭 ekotoba より前の画像は最初の段に含める（解説バーの章紐付けと同じ解釈）
  anchors[0] = 0;
  return anchors.map((from, k) => ({
    from,
    to: (k + 1 < anchors.length ? anchors[k + 1] : list.length) - 1,
  }));
}

/**
 * 改修A: ビューポート占有率が最大の段を返す純関数（固定読取点を使わない）。
 * - 段（Scene）単位で可視幅を合算して比較する。スライス個別比較だと、1段 = 複数スライス
 *   （舟木本は 1段 = 2扇）の作品で、左端から入ってきた次段の1枚目が単独で現段の
 *   スライスを上回った時点で誤判定してしまう
 * - 巻頭・巻末の物理限界では面積計算をバイパスし、端の段を確実に返す
 * - 同率（占有率差が SCENE_DETECTION_TIE_TOLERANCE 以内）は右端（RTL 起点＝
 *   start が小さい段）を優先 → 初期表示・前後ナビ直後は段の先頭側が維持される
 * - currentIndex が可視なら、挑戦者がヒステリシス分を上回るまで現シーンを維持
 * @param {{ starts: number[], widths: number[], total?: number }} layout
 * @param {number} scrollLeft RTL の負値空間（絶対値で先頭からの距離）
 * @param {number} clientWidth
 * @param {number | null} [currentIndex] 現在のシーン（null ならヒステリシスなし）
 * @param {Array<{ from: number, to: number }> | null} [sceneRanges] 段の範囲（配列 index）
 */
export function pickSceneIndexByShare(
  layout,
  scrollLeft,
  clientWidth,
  currentIndex = null,
  sceneRanges = null
) {
  const count = layout?.widths?.length || 0;
  if (!count || !(clientWidth > 0)) {
    return Number.isFinite(currentIndex) ? currentIndex : 0;
  }
  const viewStart = Math.abs(Number.isFinite(scrollLeft) ? scrollLeft : 0);
  const viewEnd = viewStart + clientWidth;
  const total = Number.isFinite(layout.total)
    ? layout.total
    : layout.starts[count - 1] + layout.widths[count - 1];

  // 巻頭・巻末エッジ: 物理限界では占有率を計算せず端の段を返す
  const maxScroll = total - clientWidth;
  if (maxScroll > SCENE_EDGE_SNAP_PX) {
    if (viewStart <= SCENE_EDGE_SNAP_PX) return 0; // 右端 = 巻頭（最初の段）
    if (viewStart >= maxScroll - SCENE_EDGE_SNAP_PX) return count - 1; // 左端 = 巻末（最後の段）
  }

  // sceneRanges 未指定（ekotoba 無しの巻）はスライス単位へフォールバック
  const ranges =
    Array.isArray(sceneRanges) && sceneRanges.length
      ? sceneRanges
      : layout.widths.map((_, i) => ({ from: i, to: i }));

  let best = -1;
  let bestShare = -1;
  for (let g = 0; g < ranges.length; g += 1) {
    const range = ranges[g];
    const from = Math.max(0, range.from);
    const to = Math.min(count - 1, range.to);
    const share = sceneRangeShare(
      layout,
      range,
      viewStart,
      viewEnd,
      clientWidth
    );
    // 許容幅を超えて大きい場合のみ更新 = 同率は index 小（右端）優先
    if (share <= bestShare + SCENE_DETECTION_TIE_TOLERANCE) continue;
    // 代表 index は段内で最も見えているスライス（段判定・共有位置に使う）
    let slice = from;
    let sliceMax = -1;
    for (let i = from; i <= to; i += 1) {
      const visible = sliceVisibleWidth(layout, i, viewStart, viewEnd);
      if (visible > sliceMax) {
        sliceMax = visible;
        slice = i;
      }
    }
    bestShare = share;
    best = slice;
  }
  if (best < 0) {
    return Number.isFinite(currentIndex) ? currentIndex : 0;
  }

  const current = Number.isFinite(currentIndex) ? currentIndex : null;
  if (current === null || current === best || current < 0 || current >= count) {
    return best;
  }
  // 現シーンが属する段を特定（見つからなければスライス単独で判定）
  const currentRange = ranges.find(
    (r) => current >= r.from && current <= r.to
  ) || { from: current, to: current };
  const currentShare = sceneRangeShare(
    layout,
    currentRange,
    viewStart,
    viewEnd,
    clientWidth
  );
  // 現シーンが属する段が不可視（幅0マーカー含む）なら維持しない
  if (currentShare <= 0) return best;
  // 同率なら右端優先で選ばれた best を採用（巻頭へ戻ったとき等）
  if (bestShare - currentShare <= SCENE_DETECTION_TIE_TOLERANCE) return best;
  return bestShare >= currentShare * (1 + SCENE_DETECTION_HYSTERESIS_SHARE)
    ? best
    : current;
}

/**
 * DOM キャッシュ前でも描画窓を進められるよう、メタデータ幅から支配シーンを推定。
 * RTL（row-reverse）: |scrollLeft| が進むほど巻の「先」へ。
 */
export function estimateSceneIndexFromScrollLeft(
  emakis,
  scrollLeft,
  clientWidth,
  rowHeightPx
) {
  if (!emakis?.length || !(rowHeightPx > 0) || !(clientWidth > 0)) return 0;
  return pickSceneIndexByShare(
    buildSceneLayoutFromEmakis(emakis, rowHeightPx),
    scrollLeft,
    clientWidth,
    null,
    buildSceneRanges(emakis)
  );
}

/**
 * 改修B: カーソル下のコンテンツ座標を含むシーン index（ズームのピボット特定）。
 * 幅0マーカーは包含しない。どの区間にも入らない場合は中心が最も近いシーン。
 */
export function sceneIndexAtContentX(emakis, contentX, rowHeightPx) {
  if (!emakis?.length || !(rowHeightPx > 0)) return 0;
  const layout = buildSceneLayoutFromEmakis(emakis, rowHeightPx);
  const x = Number.isFinite(contentX) ? contentX : 0;
  let nearest = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < layout.widths.length; i += 1) {
    const width = layout.widths[i];
    if (!(width > 0)) continue;
    const start = layout.starts[i];
    if (x >= start && x < start + width) return i;
    const dist = Math.abs(start + width / 2 - x);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = i;
    }
  }
  return nearest;
}

/**
 * 改修B: ズームストリップとして収集するスライス範囲 [from, to]。
 * 最小 ZOOM_STRIP_MIN_SLICES 枚を確保しつつ、ストリップ幅が最小倍率（fit）で
 * ステージ幅を満たすまで中心から左右交互に広げる（端では反対側へ枠を伸ばす）。
 * @returns {{ from: number, to: number, width: number }}
 */
export function computeZoomStripRange(
  emakis,
  centerIndex,
  rowHeightPx,
  stageWidthPx
) {
  const items = Array.isArray(emakis) ? emakis : [];
  const count = items.length;
  if (!count) return { from: 0, to: -1, width: 0 };
  const c = clampSceneLayoutIndex(centerIndex, count);
  const rowH = rowHeightPx > 0 ? rowHeightPx : 0;
  const stageW = stageWidthPx > 0 ? stageWidthPx : 0;
  // ストリップ高さはステージ高さに一致するため fit 倍率は 1（横幅条件のみ効く）
  const requiredW = stageW;
  const canCover = rowH > 0 && stageW > 0;
  const widthOf = (i) => sceneWidthPx(items[i], rowH);
  const minCount = Math.min(ZOOM_STRIP_MIN_SLICES, count);
  let from = c;
  let to = c;
  let width = widthOf(c);
  const covered = () => (to - from + 1 >= minCount && width >= requiredW);
  for (let d = 1; d < count; d += 1) {
    if (canCover && covered()) break;
    if (!canCover && to - from + 1 >= minCount) break;
    const forward = c + d;
    const backward = c - d;
    if (forward <= count - 1) {
      to = Math.max(to, forward);
      width += widthOf(forward);
    }
    if (canCover && covered()) break;
    if (backward >= 0) {
      from = Math.min(from, backward);
      width += widthOf(backward);
    }
  }
  return { from, to, width };
}

/**
 * section に常置する幅スタイル（殻／中身差し替えで flex 幅を変えない）。
 * @param {{ cat?: string, src?: string, srcWidth?: number, srcHeight?: number }} item
 * @param {{ toggleFullscreen?: boolean, orientation?: string, floatLandscape?: boolean }} ctx
 *   floatLandscape: 非全画面でも解説カードがフローティング化された md+ 横画面。
 *   article が画面下端まで広がるため、画像高基準を実キャンバス高（--vh-float）にする
 */
export function buildSceneShellStyle(item, ctx = {}) {
  const { cat, src, srcWidth, srcHeight } = item || {};
  if (cat === "ekotoba" && !src) {
    return {
      width: 0,
      minWidth: 0,
      height: "100%",
      flexShrink: 0,
      overflow: "visible",
    };
  }
  if (!srcWidth || !srcHeight) {
    const fallbackW = "20vh";
    return {
      width: fallbackW,
      minWidth: fallbackW,
      maxWidth: fallbackW,
      height: "100%",
      flexShrink: 0,
      overflow: "hidden",
      backgroundColor: "#f5f0e6",
    };
  }
  const { toggleFullscreen, orientation, floatLandscape } = ctx;
  let heightVar = "var(--vh-75)";
  if (toggleFullscreen) heightVar = "var(--vh-100)";
  else if (orientation === "portrait") heightVar = "var(--vh-45)";
  else if (orientation === "landscape")
    // フローティングカード化（非全画面 md+横）: 実キャンバス高基準でシーンを充填。
    // vh-75 固定だと広がった実キャンバス高（--vh-float）より短く、下部に余白が出る
    heightVar = floatLandscape ? "var(--vh-float)" : "var(--vh-75)";

  const width = `calc(${srcWidth / srcHeight} * ${heightVar})`;
  return {
    width,
    // flex の min-width:auto が next/image 固有サイズで section を押し広げるのを防ぐ
    minWidth: width,
    maxWidth: width,
    height: "100%",
    flexShrink: 0,
    overflow: "hidden",
    aspectRatio: `${srcWidth} / ${srcHeight}`,
    backgroundColor: "#f5f0e6",
  };
}
