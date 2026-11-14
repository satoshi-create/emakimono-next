import emakisData from "@/data/scroll-metadata";
import { isWithdrawnScroll } from "@/libs/constants/withdrawnScrolls";

// =============================================================================
// デバッグスイッチ
// 検証完了後は false にすることで、すべてのコンソール出力を一括で停止できます。
// =============================================================================
const DEBUG_DATA_CACHE = false;

function logDebug(tag, ...args) {
  if (!DEBUG_DATA_CACHE) return;
  const time = performance.now().toFixed(1);
  console.log(`%c[${time}ms][${tag}]`, "color: #3b82f6; font-weight: bold;", ...args);
}

// ---------------------------------------------------------------------------
// 1. 境界定義・定数（YAML自動アップロード契約）
// フロントの絵巻メタ正本は scroll-metadata/scrolls/{titleen}.json ＋ _order.json
// （scripts/sync_all.py が scroll_config.yaml 同期後に upsert）。公開可否は withdrawn リスト
// （withdrawnScrolls.js）で判定し、パイプラインが生成する titleen と一致させる。
// ---------------------------------------------------------------------------

/** デフォルト入力 = ビルド時にバンドルされるキャッシュ正本 */
const DEFAULT_CACHE_SOURCE = "scroll-metadata/scrolls";

// ---------------------------------------------------------------------------
// 2. データ読み込み・フィルタリング処理
// 年表・時代ページは「ビューアに載る titleen」のみ必要。withdrawn を除外した集合を返す。
// ---------------------------------------------------------------------------

/**
 * ビューア公開中（withdrawn 除外）の titleen 集合。
 * 年表チップの live/準備中判定に使う。画像キャッシュを省略した場合は
 * 絵巻ページのように useLocaleData() で得た配列を渡す。
 */
export function getLiveSlugs(data = emakisData) {
  const inputCount = Array.isArray(data) ? data.length : 0;
  const missingTitleen = Array.isArray(data)
    ? data.filter((item) => !item?.titleen).length
    : 0;
  const slugCounts = new Map();
  if (Array.isArray(data)) {
    for (const item of data) {
      const key = item?.titleen;
      if (!key) continue;
      slugCounts.set(key, (slugCounts.get(key) || 0) + 1);
    }
  }
  const duplicateSlugs = [...slugCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([slug]) => slug);

  if (!Array.isArray(data)) {
    logDebug("getLiveSlugs", "error", {
      kind: "invalid_input",
      expected: "array",
      received: typeof data,
      source: DEFAULT_CACHE_SOURCE,
    });
    return [];
  }

  const live = data
    .filter((item) => !isWithdrawnScroll(item.titleen))
    .map((item) => item.titleen);

  const withdrawnCount = inputCount - live.length;

  logDebug("getLiveSlugs", "summary", {
    source: DEFAULT_CACHE_SOURCE,
    inputCount,
    liveCount: live.length,
    withdrawnExcluded: withdrawnCount,
    missingTitleen,
    duplicateTitleen: duplicateSlugs,
    integrityOk: missingTitleen === 0 && duplicateSlugs.length === 0,
  });

  if (missingTitleen > 0) {
    logDebug("getLiveSlugs", "error", {
      kind: "missing_titleen",
      count: missingTitleen,
    });
  }
  if (duplicateSlugs.length > 0) {
    logDebug("getLiveSlugs", "error", {
      kind: "duplicate_titleen",
      slugs: duplicateSlugs,
    });
  }

  return live;
}