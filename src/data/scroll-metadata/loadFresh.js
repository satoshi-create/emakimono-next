/**
 * getStaticProps 等でディスク上の scroll JSON を都度読む（サーバー専用）。
 * クライアントバンドルに含めないため index.js から分離。
 */

// eslint-disable-next-line global-require
const fs = require("fs");
// eslint-disable-next-line global-require
const path = require("path");

const ORDER_JSON_BASENAME = "_order.json";

function assembleList(map, order) {
  return order.map((titleen) => {
    const item = map.get(titleen);
    if (!item) {
      throw new Error(`Missing scroll metadata for titleen: ${titleen}`);
    }
    return item;
  });
}

function loadEmakiMetadataFresh() {
  if (typeof window !== "undefined") {
    throw new Error("loadEmakiMetadataFresh() is server-only");
  }

  const scrollsDir = path.join(
    process.cwd(),
    "src/data/scroll-metadata/scrolls"
  );
  const orderPath = path.join(scrollsDir, ORDER_JSON_BASENAME);
  const order = JSON.parse(fs.readFileSync(orderPath, "utf8"));

  const map = new Map();
  for (const titleen of order) {
    const filePath = path.join(scrollsDir, `${titleen}.json`);
    map.set(titleen, JSON.parse(fs.readFileSync(filePath, "utf8")));
  }

  return assembleList(map, order);
}

module.exports = { loadEmakiMetadataFresh };
