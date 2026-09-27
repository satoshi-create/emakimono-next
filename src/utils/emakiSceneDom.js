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

/**
 * ビューポート水平中央に載っている `section#scene-N` の N を返す。
 * URL hash / navIndex の正本（仮想幅キャッシュは使わない）。
 * @param {HTMLElement | null} container スクロールコンテナ（fallback 探索用）
 * @returns {number | null}
 */
export function findSceneIndexAtViewportCenter(container) {
  if (typeof window === "undefined" || !container) return null;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  const elements = document.elementsFromPoint(cx, cy);
  for (const el of elements) {
    const section = el.closest?.('section[id^="scene-"]');
    if (section) {
      const id = parseSceneSectionId(section.id);
      if (!isNaN(id)) return id;
    }
  }

  const sections = container.querySelectorAll('section[id^="scene-"]');
  for (const sec of sections) {
    const rect = sec.getBoundingClientRect();
    if (rect.left <= cx && rect.right >= cx) {
      const id = parseSceneSectionId(sec.id);
      if (!isNaN(id)) return id;
    }
  }
  return null;
}
