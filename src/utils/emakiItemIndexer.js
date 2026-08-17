/**
 * 絵巻シーン配列に、cat ごとの独立した連番（uniqueIndex）を付与する。
 *
 * - cat === "image": 0 始まりの独立連番（画像のみの通し番号）
 * - cat === "ekotoba": 0 始まりの独立連番（詞書のみの通し番号）
 * - その他: null
 *
 * 抽出元: EmakiConteiner.js の processedEmakis reduce を純関数化したもの。
 * 参照: src/components/emaki/viewer/SwitcherEmaki.js（uniqueIndex を LazyImage へ伝搬）
 */
export const assignUniqueIndex = (scenes) =>
  scenes.reduce(
    (acc, item) => {
      if (item.cat === "image") {
        acc.imageCounter += 1;
        acc.result.push({ ...item, uniqueIndex: acc.imageCounter - 1 });
      } else if (item.cat === "ekotoba") {
        acc.ekotobaCounter += 1;
        acc.result.push({ ...item, uniqueIndex: acc.ekotobaCounter - 1 });
      } else {
        acc.result.push({ ...item, uniqueIndex: null });
      }
      return acc;
    },
    { result: [], imageCounter: 0, ekotobaCounter: 0 }
  ).result;
