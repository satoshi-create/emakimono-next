/**
 * 絵引着地時のスポットライト。
 * 対象地点は handleToId がビューポート中央へ運び、
 * ラインは画面中央（left: 50%）に fixed で一時表示する。
 */

let ebikiHighlightTimer = null;
let ebikiCleanupTimer = null;

export function triggerEbikiSpotlight() {
  if (typeof document === "undefined") return;

  if (ebikiHighlightTimer) clearTimeout(ebikiHighlightTimer);
  if (ebikiCleanupTimer) clearTimeout(ebikiCleanupTimer);

  document.querySelectorAll(".ebikiSpot").forEach((el) => el.remove());

  // スクロール開始に合わせたわずかな遅延でパルス開始
  ebikiHighlightTimer = setTimeout(() => {
    const spot = document.createElement("div");
    spot.className = "ebikiSpot";
    spot.setAttribute("aria-hidden", "true");
    document.body.appendChild(spot);

    ebikiCleanupTimer = setTimeout(() => {
      spot.remove();
    }, 2300);
  }, 180);
}
