import type { EmakiMetadata } from "@/types/emaki";
import scrollOrder from "./scrolls/_order.json";
import bayeuxPanels from "@/data/bayeux-tapestry/bayeux_panels.json";
import { mergeBayeuxScrollMetadata } from "@/data/bayeux-tapestry/mergeBayeuxMetadata";

/**
 * =============================================================================
 * 1. 境界定義・順序マニフェスト
 * -----------------------------------------------------------------------------
 * _order.json は分割前配列の titleen 順序の唯一の正本。
 * =============================================================================
 */
const ORDER_JSON_BASENAME = "_order.json";

/**
 * =============================================================================
 * 2. バンドル用ローダー（require.context）
 * -----------------------------------------------------------------------------
 * Webpack がビルド時に scrolls/*.json を束ね、クライアント・SSR双方で
 * 型安全な EmakiMetadata[] 配列を再構成する。
 * =============================================================================
 */
interface WebpackRequireContext {
  keys(): string[];
  <T = unknown>(id: string): T;
}

declare const require: NodeRequire & {
  context(
    directory: string,
    useSubdirectories?: boolean,
    regExp?: RegExp
  ): WebpackRequireContext;
};

const scrollContext = require.context("./scrolls", false, /\.json$/);

function buildMapFromContext(): Map<string, EmakiMetadata> {
  const map = new Map<string, EmakiMetadata>();
  scrollContext.keys().forEach((key) => {
    const base = key.replace(/^\.\//, "");
    if (base === ORDER_JSON_BASENAME) return;
    let item = scrollContext<EmakiMetadata>(key);
    const titleen = item?.titleen ?? base.replace(/\.json$/, "");
    if (titleen === "bayeux_tapestry") {
      item = mergeBayeuxScrollMetadata(item, bayeuxPanels);
    }
    map.set(titleen, item);
  });
  return map;
}

function assembleList(
  map: Map<string, EmakiMetadata>,
  order: string[]
): EmakiMetadata[] {
  return order.map((titleen) => {
    const item = map.get(titleen);
    if (!item) {
      throw new Error(`Missing scroll metadata for titleen: ${titleen}`);
    }
    return item;
  });
}

const bundledMap = buildMapFromContext();
const emakiMetadataList: EmakiMetadata[] = assembleList(
  bundledMap,
  scrollOrder as string[]
);

export { emakiMetadataList };
export default emakiMetadataList;