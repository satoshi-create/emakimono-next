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

export default isByobuScroll;
