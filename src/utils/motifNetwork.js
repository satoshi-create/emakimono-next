import motifsMaster from "@/data/master/motifs.json";
import generatedMotifIndex from "@/data/master/generated-motif-index.json";

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

  const rawMatches = (generatedMotifIndex && generatedMotifIndex[motifId]) || [];

  // 現在見ている全く同じシーン（同一絵巻 かつ 同一章）は除外して返す
  return rawMatches.filter((item) => {
    const isCurrentScene =
      item.titleen === currentTitleen &&
      String(item.chapter).trim() === String(currentChapter).trim();
    return !isCurrentScene;
  });
}
