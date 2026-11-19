/**
 * 屏風作品（typeen === "byobu"）判定。
 *
 * 屏風は 1段 = 複数扇のスライスで構成され、絵巻（emaki）と鑑賞 UI が異なる。
 * 段タイトルバー（OverlayEkotoba の黒帯）非表示・名所スポットピン表示の分岐に使う。
 * 既存絵巻へのリグレッションを避けるため、判定は typeen の完全一致のみとする。
 *
 * @param {{ typeen?: string } | null | undefined} data
 * @returns {boolean}
 */
export function isByobuScroll(data) {
  return data?.typeen === "byobu";
}

/** 鳥瞰図（typeen === "birdseye"） */
export function isBirdseyeScroll(data) {
  return data?.typeen === "birdseye";
}

/**
 * スポットバッジ式コメントバー（屏風・鳥瞰図）。
 * 物理レイアウト（屏風スライス寸法等）は isByobuScroll のまま分離する。
 */
export function isSpotGuideScroll(data) {
  return isByobuScroll(data) || isBirdseyeScroll(data);
}

export default isByobuScroll;
