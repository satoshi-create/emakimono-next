/**
 * シーン DOM id。URL hash `#N` と衝突させないため `scene-N` を使う。
 * （数値 id だとブラウザが section へ縦スクロールしヘッダーが切れる）
 */
export function sceneSectionId(index) {
  return `scene-${index}`;
}

/** section.id → シーン番号。非対応 id は NaN */
export function parseSceneSectionId(id) {
  const m = String(id || "").match(/^scene-(\d+)$/);
  return m ? parseInt(m[1], 10) : NaN;
}

export function querySceneSection(index) {
  if (typeof document === "undefined") return null;
  return document.querySelector(`section[id="${sceneSectionId(index)}"]`);
}
