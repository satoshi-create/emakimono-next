/**
 * 絵巻メタデータ統合ローダー（段階的移行 Step 1）
 *
 * 巨大な単一 JSON を scrolls/{titleen}.json に分割したあとも、
 * 既存 import（配列の default export）と同じ形をここで再構成する。
 * 本番切替前は正本ファイル scroll-metadata.json を残し、呼び出し側は未変更。
 */

// 1. 境界定義・順序マニフェスト
// _order.json は分割前配列の titleen 順序の唯一の正本。個別ファイル名だけでは並びが復元できない。
import scrollOrder from "./scrolls/_order.json";

const ORDER_JSON_BASENAME = "_order.json";

// 2. バンドル用ローダー（require.context）
// Webpack がビルド時に scrolls/*.json を束ねる。ランタイムの fs 不要でクライアント SSR 双方で同じ配列を得る。
const scrollContext = require.context("./scrolls", false, /\.json$/);

function buildMapFromContext() {
  const map = new Map();
  scrollContext.keys().forEach((key) => {
    const base = key.replace(/^\.\//, "");
    if (base === ORDER_JSON_BASENAME) return;
    const item = scrollContext(key);
    const titleen = item?.titleen ?? base.replace(/\.json$/, "");
    map.set(titleen, item);
  });
  return map;
}

function assembleList(map, order) {
  return order.map((titleen) => {
    const item = map.get(titleen);
    if (!item) {
      throw new Error(`Missing scroll metadata for titleen: ${titleen}`);
    }
    return item;
  });
}

const bundledMap = buildMapFromContext();
const emakiMetadataList = assembleList(bundledMap, scrollOrder);

export { emakiMetadataList };
export default emakiMetadataList;
