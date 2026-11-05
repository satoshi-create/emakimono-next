import motifsMaster from "@/data/motifs.json";
import kusouzumakiData from "@/data/emaki-text-data/kusouzumaki.json";
import chojuGigaFirstData from "@/data/emaki-text-data/Chōjū-jinbutsu-giga_first.json";

// 横断検索対象の絵巻テキストデータマップ（絵巻追加時にここに追記）
const textDataMap = {
  kusouzumaki: kusouzumakiData,
  "Chōjū-jinbutsu-giga_first": chojuGigaFirstData,
};

/**
 * モチーフIDからマスター定義を取得
 */
export function getMotifDefinition(motifId) {
  if (!motifId) return null;
  return motifsMaster[motifId] || null;
}

/**
 * 特定のモチーフIDを含むシーンを他絵巻・同一絵巻の別段から横断検索して返す
 * @param {string} currentTitleen - 現在閲覧中の絵巻スラッグ
 * @param {number|string} currentChapter - 現在の章番号
 * @param {string} motifId - 検索対象のモチーフID
 * @returns {Array<{ titleen: string, chapter: number|string, title: string, prompt: string|null }>}
 */
export function findRelatedScenesByMotif(currentTitleen, currentChapter, motifId) {
  if (!motifId) return [];

  const matches = [];

  Object.entries(textDataMap).forEach(([titleen, chapters]) => {
    if (!Array.isArray(chapters)) return;

    chapters.forEach((item) => {
      // 現在見ている全く同じシーン（同一絵巻 かつ 同一章）は除外
      const isCurrentScene =
        titleen === currentTitleen &&
        String(item.chapter).trim() === String(currentChapter).trim();

      if (isCurrentScene) return;

      if (
        item.sou &&
        Array.isArray(item.sou.motifs) &&
        item.sou.motifs.includes(motifId)
      ) {
        matches.push({
          titleen,
          chapter: item.chapter,
          title: item.title || `${titleen}（第${item.chapter}段）`,
          prompt: item.sou.prompt || null,
        });
      }
    });
  });

  return matches;
}
