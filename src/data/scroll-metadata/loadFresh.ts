import fs from "fs";
import path from "path";
import type { EmakiMetadata } from "@/types/emaki";

/**
 * =============================================================================
 * 1. 定数・順序整合ヘルパー
 * =============================================================================
 */
const ORDER_JSON_BASENAME = "_order.json";

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

/**
 * =============================================================================
 * 2. サーバー専用フレッシュメタデータローダー (loadEmakiMetadataFresh)
 * -----------------------------------------------------------------------------
 * getStaticProps 等でディスク上の scroll JSON を都度読む（サーバー専用）。
 * =============================================================================
 */
export function loadEmakiMetadataFresh(): EmakiMetadata[] {
  if (typeof window !== "undefined") {
    throw new Error("loadEmakiMetadataFresh() is server-only");
  }

  const scrollsDir = path.join(
    process.cwd(),
    "src/data/scroll-metadata/scrolls"
  );
  const orderPath = path.join(scrollsDir, ORDER_JSON_BASENAME);
  const order = JSON.parse(fs.readFileSync(orderPath, "utf8")) as string[];

  const map = new Map<string, EmakiMetadata>();
  for (const titleen of order) {
    const filePath = path.join(scrollsDir, `${titleen}.json`);
    map.set(titleen, JSON.parse(fs.readFileSync(filePath, "utf8")) as EmakiMetadata);
  }

  return assembleList(map, order);
}

export default { loadEmakiMetadataFresh };